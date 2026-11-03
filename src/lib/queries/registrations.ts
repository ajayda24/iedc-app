import 'server-only'

// Registration + attendance helpers. Students register/cancel themselves;
// attendance marking is staff-only (enforced by RLS in rls.sql). Counters on
// profiles auto-recompute via triggers when status changes.
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getUser } from '@/lib/auth/queries'
import type {
  Department,
  EventRegistration,
  EventRow,
  PaymentStatus,
  Profile,
  RegistrationStatus,
} from '@/lib/supabase/database.types'

// A registration joined with the attendee's profile (staff attendance view).
export type RegistrationWithProfile = EventRegistration & {
  profile: Pick<
    Profile,
    'id' | 'name' | 'student_id' | 'department' | 'avatar'
  > | null
  // Roster details for a guest registration (profile_id NULL) made from the
  // public site. null for account registrations.
  guest: { name: string | null; student_id: string; department: Department } | null
}

// A student's registration for one event, or null.
export async function getMyRegistration(
  eventId: string
): Promise<EventRegistration | null> {
  const user = await getUser()
  if (!user) return null

  const supabase = await createClient()
  const { data } = await supabase
    .from('event_registrations')
    .select('*')
    .eq('event_id', eventId)
    .eq('profile_id', user.id)
    .maybeSingle()
  return (data as EventRegistration) ?? null
}

// All of the current user's registrations, with the joined event.
export async function listMyRegistrations(): Promise<
  (EventRegistration & { event: EventRow })[]
> {
  const user = await getUser()
  if (!user) return []

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('event_registrations')
    .select('*, event:events(*)')
    .eq('profile_id', user.id)
    .order('registered_at', { ascending: false })
  if (error) throw error
  return (data as (EventRegistration & { event: EventRow })[]) ?? []
}

// A given profile's registrations with joined event, newest first. Used for the
// participation timeline on a profile page. RLS: a user can read their own; for
// other users this returns rows only where the underlying registration is
// visible to the caller (staff, or self).
export async function listRegistrationsFor(
  profileId: string
): Promise<(EventRegistration & { event: EventRow })[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('event_registrations')
    .select('*, event:events(*)')
    .eq('profile_id', profileId)
    .order('registered_at', { ascending: false })
  if (error) throw error
  return (data as (EventRegistration & { event: EventRow })[]) ?? []
}

// Register the current user for an event (RLS checks event is open). Paid
// events need the UPI transaction ID; the DB trigger sets payment_status.
export async function registerForEvent(
  eventId: string,
  paymentRef?: string | null
): Promise<EventRegistration> {
  const user = await getUser()
  if (!user) throw new Error('Not authenticated')

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('event_registrations')
    .insert({
      event_id: eventId,
      profile_id: user.id,
      status: 'registered',
      payment_ref: paymentRef ?? null,
    })
    .select('*')
    .single()
  if (error) throw error
  return data as EventRegistration
}

// Cancel the current user's own registration.
export async function cancelRegistration(eventId: string): Promise<void> {
  const user = await getUser()
  if (!user) throw new Error('Not authenticated')

  const supabase = await createClient()
  const { error } = await supabase
    .from('event_registrations')
    .update({ status: 'cancelled' })
    .eq('event_id', eventId)
    .eq('profile_id', user.id)
  if (error) throw error
}

// Replace the current user's UPI transaction ID (e.g. after a rejection). The
// DB trigger resets payment_status to 'pending' for re-verification.
export async function resubmitPayment(
  eventId: string,
  paymentRef: string
): Promise<void> {
  const user = await getUser()
  if (!user) throw new Error('Not authenticated')

  const supabase = await createClient()
  const { error } = await supabase
    .from('event_registrations')
    .update({ payment_ref: paymentRef })
    .eq('event_id', eventId)
    .eq('profile_id', user.id)
  if (error) throw error
}

// --- Staff: view all registrations for an event + mark attendance ----------
export async function listEventRegistrations(
  eventId: string
): Promise<RegistrationWithProfile[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('event_registrations')
    .select(
      // Explicit FK: payment_verified_by also references profiles, which
      // makes a bare `profiles(...)` embed ambiguous (PGRST201).
      '*, profile:profiles!event_registrations_profile_id_fkey(id, name, student_id, department, avatar)'
    )
    .eq('event_id', eventId)
    .order('registered_at', { ascending: true })
  if (error) throw error
  const regs = ((data ?? []) as Omit<RegistrationWithProfile, 'guest'>[]).map(
    (r) => ({ ...r, guest: null }) as RegistrationWithProfile
  )

  // Guests have no profile, and the roster isn't readable by coordinators, so
  // resolve their names with the admin client. Only student_ids from rows the
  // caller could already see (RLS above) are looked up.
  const guestIds = regs.filter((r) => !r.profile_id).map((r) => r.student_id)
  if (guestIds.length > 0) {
    const admin = createAdminClient()
    const { data: students } = await admin
      .from('students')
      .select('student_id, name, department')
      .in('student_id', guestIds)
    const byId = new Map(
      ((students ?? []) as NonNullable<RegistrationWithProfile['guest']>[]).map(
        (s) => [s.student_id, s]
      )
    )
    for (const r of regs) {
      if (!r.profile_id) r.guest = byId.get(r.student_id) ?? null
    }
  }
  return regs
}

export async function markAttendance(
  registrationId: string,
  status: Extract<RegistrationStatus, 'attended' | 'absent'>
): Promise<void> {
  const supabase = await createClient()
  const { error } = await supabase
    .from('event_registrations')
    .update({
      status,
      attendance_marked_at: new Date().toISOString(),
    })
    .eq('id', registrationId)
  if (error) throw error
}

// Staff: record the outcome of checking a UTR against the payment history.
// 'pending' undoes a previous decision.
export async function markPayment(
  registrationId: string,
  status: Exclude<PaymentStatus, 'not_required'>
): Promise<void> {
  const user = await getUser()
  const supabase = await createClient()
  const verified = status === 'verified'
  const { error } = await supabase
    .from('event_registrations')
    .update({
      payment_status: status,
      payment_verified_at: verified ? new Date().toISOString() : null,
      payment_verified_by: verified ? (user?.id ?? null) : null,
    })
    .eq('id', registrationId)
  if (error) throw error
}
