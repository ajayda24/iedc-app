import 'server-only'

// Certificates. Students see their own (RLS); staff can issue them. Issuing a
// certificate auto-increments the profile's total_certificates via trigger.
import { createClient } from '@/lib/supabase/server'
import type {
  Certificate,
  CertificatePublic,
  CertificateType,
  EventRow,
} from '@/lib/supabase/database.types'

// Current user's certificates, newest first, with the joined event.
export async function listMyCertificates(): Promise<
  (Certificate & { event: EventRow | null })[]
> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return []

  const { data, error } = await supabase
    .from('certificates')
    .select('*, event:events(*)')
    .eq('profile_id', user.id)
    .order('issued_at', { ascending: false })
  if (error) throw error
  return (data as (Certificate & { event: EventRow | null })[]) ?? []
}

// A given profile's certificates, newest first, with the joined event. RLS
// restricts certificates to the owner (or staff), so on another user's profile
// this is empty for non-staff viewers until that policy is widened.
export async function listCertificatesFor(
  profileId: string
): Promise<(Certificate & { event: EventRow | null })[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('certificates')
    .select('*, event:events(*)')
    .eq('profile_id', profileId)
    .order('issued_at', { ascending: false })
  if (error) throw error
  return (data as (Certificate & { event: EventRow | null })[]) ?? []
}

// Staff: all certificates issued for one event, keyed by profile_id. Used by the
// issue view to show which attendees already have a certificate (and its type).
export async function certificatesForEvent(
  eventId: string
): Promise<Certificate[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('certificates')
    .select('*')
    .eq('event_id', eventId)
  if (error) throw error
  return (data as Certificate[]) ?? []
}

// Public verification lookup. Reads the anon-safe `certificate_public` view by
// serial (IEDC-YYYY-XXXXXX) OR raw id, so /certificates/<serial|id> both work.
// Returns null when not found. Safe for logged-out visitors (view granted to
// anon); exposes only non-sensitive credential fields — no email/phone/points.
export async function getPublicCertificate(
  serialOrId: string
): Promise<CertificatePublic | null> {
  const supabase = await createClient()
  // Match serial first (the printed code); fall back to id for UUID links.
  const isUuid =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      serialOrId
    )
  const query = supabase.from('certificate_public').select('*')
  const { data, error } = isUuid
    ? await query.eq('id', serialOrId).maybeSingle()
    : await query.eq('serial', serialOrId).maybeSingle()
  if (error) throw error
  return (data as CertificatePublic | null) ?? null
}

// Staff: issue a certificate to a student.
export async function issueCertificate(input: {
  profileId: string
  eventId?: string
  certificateType: CertificateType
  certificateUrl?: string
}): Promise<Certificate> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('certificates')
    .insert({
      profile_id: input.profileId,
      event_id: input.eventId ?? null,
      certificate_type: input.certificateType,
      certificate_url: input.certificateUrl ?? null,
    })
    .select('*')
    .single()
  if (error) throw error
  return data as Certificate
}

// Staff: remove a certificate (e.g. issued in error). The trigger recomputes the
// recipient's total_certificates. RLS restricts this to staff.
export async function revokeCertificate(certificateId: string): Promise<void> {
  const supabase = await createClient()
  const { error } = await supabase
    .from('certificates')
    .delete()
    .eq('id', certificateId)
  if (error) throw error
}
