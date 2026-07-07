import 'server-only'

// Certificates. Students see their own (RLS); staff can issue them. Issuing a
// certificate auto-increments the profile's total_certificates via trigger.
import { createClient } from '@/lib/supabase/server'
import type {
  Certificate,
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
