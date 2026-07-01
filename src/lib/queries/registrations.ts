import 'server-only'

// Registration + attendance helpers. Students register/cancel themselves;
// attendance marking is staff-only (enforced by RLS in rls.sql). Counters on
// profiles auto-recompute via triggers when status changes.
import { createClient } from '@/lib/supabase/server'
import type {
  EventRegistration,
  EventRow,
  RegistrationStatus,
} from '@/lib/supabase/database.types'

// A student's registration for one event, or null.
export async function getMyRegistration(
  eventId: string
): Promise<EventRegistration | null> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

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
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return []

  const { data, error } = await supabase
    .from('event_registrations')
    .select('*, event:events(*)')
    .eq('profile_id', user.id)
    .order('registered_at', { ascending: false })
  if (error) throw error
  return (data as (EventRegistration & { event: EventRow })[]) ?? []
}

// Register the current user for an event (RLS checks event is open).
export async function registerForEvent(
  eventId: string
): Promise<EventRegistration> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data, error } = await supabase
    .from('event_registrations')
    .insert({ event_id: eventId, profile_id: user.id, status: 'registered' })
    .select('*')
    .single()
  if (error) throw error
  return data as EventRegistration
}

// Cancel the current user's own registration.
export async function cancelRegistration(eventId: string): Promise<void> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { error } = await supabase
    .from('event_registrations')
    .update({ status: 'cancelled' })
    .eq('event_id', eventId)
    .eq('profile_id', user.id)
  if (error) throw error
}

// --- Staff: view all registrations for an event + mark attendance ----------
export async function listEventRegistrations(
  eventId: string
): Promise<EventRegistration[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('event_registrations')
    .select('*')
    .eq('event_id', eventId)
    .order('registered_at', { ascending: true })
  if (error) throw error
  return (data as EventRegistration[]) ?? []
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
