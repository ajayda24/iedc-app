'use server'

// Server Actions for issuing / revoking certificates (coordinator + admin).
// Every action re-checks staff via requireStaff() as the real security
// boundary; RLS (certs_staff_write) is the backstop.
//
// Policy: a certificate can only be issued to a registrant who ATTENDED an event
// that is COMPLETED. This keeps issuance honest — no certs for no-shows or for
// events that haven't happened yet.
import { revalidatePath } from 'next/cache'
import { requireStaff } from '@/lib/auth/queries'
import { getEvent } from './events'
import { issueCertificate, revokeCertificate } from './certificates'
import { createClient } from '@/lib/supabase/server'
import type { CertificateType } from '@/lib/supabase/database.types'

const CERT_TYPES: CertificateType[] = [
  'participation',
  'winner',
  'runnerup',
  'volunteer',
]

export interface ActionResult {
  ok: boolean
  error?: string
}

// Issue one certificate to an attendee of a completed event.
export async function issueCertificateAction(input: {
  eventId: string
  profileId: string
  certificateType: CertificateType
}): Promise<ActionResult> {
  await requireStaff()

  if (!CERT_TYPES.includes(input.certificateType)) {
    return { ok: false, error: 'Invalid certificate type.' }
  }

  // Guard: event must exist and be completed.
  const event = await getEvent(input.eventId)
  if (!event) return { ok: false, error: 'Event not found.' }
  if (event.status !== 'completed') {
    return { ok: false, error: 'Certificates can only be issued for completed events.' }
  }

  // Guard: the recipient must have attended this event.
  const supabase = await createClient()
  const { data: reg } = await supabase
    .from('event_registrations')
    .select('status')
    .eq('event_id', input.eventId)
    .eq('profile_id', input.profileId)
    .maybeSingle()
  if (!reg || reg.status !== 'attended') {
    return { ok: false, error: 'This student is not marked as attended.' }
  }

  // Guard: don't double-issue for the same person + event.
  const { data: existing } = await supabase
    .from('certificates')
    .select('id')
    .eq('event_id', input.eventId)
    .eq('profile_id', input.profileId)
    .maybeSingle()
  if (existing) {
    return { ok: false, error: 'A certificate was already issued to this student.' }
  }

  try {
    await issueCertificate({
      profileId: input.profileId,
      eventId: input.eventId,
      certificateType: input.certificateType,
    })
  } catch {
    return { ok: false, error: 'Could not issue the certificate. Try again.' }
  }

  revalidatePath(`/dashboard/manage/${input.eventId}/overview`)
  return { ok: true }
}

// Revoke a mistakenly issued certificate.
export async function revokeCertificateAction(
  certificateId: string,
  eventId: string
): Promise<ActionResult> {
  await requireStaff()
  try {
    await revokeCertificate(certificateId)
  } catch {
    return { ok: false, error: 'Could not revoke the certificate.' }
  }
  revalidatePath(`/dashboard/manage/${eventId}/overview`)
  return { ok: true }
}

// Issue certificates to ALL attendees of a completed event who don't yet have
// one. Defaults to 'participation'. Returns how many were issued.
export async function issueAllCertificatesAction(input: {
  eventId: string
  certificateType?: CertificateType
}): Promise<ActionResult & { issued?: number }> {
  await requireStaff()
  const type = input.certificateType ?? 'participation'
  if (!CERT_TYPES.includes(type)) {
    return { ok: false, error: 'Invalid certificate type.' }
  }

  const event = await getEvent(input.eventId)
  if (!event) return { ok: false, error: 'Event not found.' }
  if (event.status !== 'completed') {
    return { ok: false, error: 'Certificates can only be issued for completed events.' }
  }

  const supabase = await createClient()
  const [{ data: attendees }, { data: existing }] = await Promise.all([
    supabase
      .from('event_registrations')
      .select('profile_id')
      .eq('event_id', input.eventId)
      .eq('status', 'attended'),
    supabase
      .from('certificates')
      .select('profile_id')
      .eq('event_id', input.eventId),
  ])

  const have = new Set((existing ?? []).map((c) => c.profile_id))
  const todo = (attendees ?? [])
    .map((a) => a.profile_id)
    .filter((id) => !have.has(id))

  if (todo.length === 0) {
    return { ok: true, issued: 0 }
  }

  const { error } = await supabase.from('certificates').insert(
    todo.map((profile_id) => ({
      profile_id,
      event_id: input.eventId,
      certificate_type: type,
    }))
  )
  if (error) return { ok: false, error: 'Could not issue certificates.' }

  revalidatePath(`/dashboard/manage/${input.eventId}/overview`)
  return { ok: true, issued: todo.length }
}
