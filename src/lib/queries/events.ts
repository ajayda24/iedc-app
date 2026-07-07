import 'server-only'

// Event query + mutation helpers (server-side, RLS-respecting).
// Reads run as the logged-in user; RLS in rls.sql decides visibility (e.g.
// drafts are staff-only, students can only register themselves).
import { createClient } from '@/lib/supabase/server'
import type {
  EventRow,
  EventStatus,
  EventCategory,
} from '@/lib/supabase/database.types'

export interface ListEventsOptions {
  status?: EventStatus
  category?: EventCategory
  upcomingOnly?: boolean
  limit?: number
}

// List events. Visibility is enforced by RLS (non-staff never see drafts).
export async function listEvents(
  opts: ListEventsOptions = {}
): Promise<EventRow[]> {
  const supabase = await createClient()
  let query = supabase.from('events').select('*')

  if (opts.status) query = query.eq('status', opts.status)
  if (opts.category) query = query.eq('category', opts.category)
  if (opts.upcomingOnly) query = query.gte('start_date', new Date().toISOString())

  query = query.order('start_date', { ascending: true })
  if (opts.limit) query = query.limit(opts.limit)

  const { data, error } = await query
  if (error) throw error
  return (data as EventRow[]) ?? []
}

// A single event by id, or null if not visible / not found.
export async function getEvent(id: string): Promise<EventRow | null> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('events')
    .select('*')
    .eq('id', id)
    .maybeSingle()
  return (data as EventRow) ?? null
}

// Count of active (non-cancelled) registrations per event id. Used to show
// "spots left" on cards. One grouped query rather than N per-event counts.
export async function countRegistrationsByEvent(
  eventIds: string[]
): Promise<Record<string, number>> {
  if (eventIds.length === 0) return {}
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('event_registrations')
    .select('event_id')
    .in('event_id', eventIds)
    .neq('status', 'cancelled')
  if (error) throw error
  const counts: Record<string, number> = {}
  for (const row of (data as { event_id: string }[]) ?? []) {
    counts[row.event_id] = (counts[row.event_id] ?? 0) + 1
  }
  return counts
}

// Events created by a given profile (staff), newest first. Powers the "Events
// Organized" section on a coordinator/admin profile. RLS still applies, so a
// non-staff viewer only sees the creator's published events.
export async function listEventsByCreator(
  profileId: string,
  limit?: number
): Promise<EventRow[]> {
  const supabase = await createClient()
  let query = supabase
    .from('events')
    .select('*')
    .eq('created_by', profileId)
    .order('start_date', { ascending: false })
  if (limit) query = query.limit(limit)
  const { data, error } = await query
  if (error) throw error
  return (data as EventRow[]) ?? []
}

// Published events open for registration right now (deadline not passed).
export async function listOpenEvents(): Promise<EventRow[]> {
  const supabase = await createClient()
  const now = new Date().toISOString()
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('status', 'published')
    .or(`registration_deadline.is.null,registration_deadline.gte.${now}`)
    .order('start_date', { ascending: true })
  if (error) throw error
  return (data as EventRow[]) ?? []
}

// --- Staff mutations (RLS: is_staff() required) ----------------------------
export type EventInput = Partial<
  Omit<EventRow, 'id' | 'created_at' | 'updated_at' | 'created_by'>
>

export async function createEvent(input: EventInput): Promise<EventRow> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data, error } = await supabase
    .from('events')
    .insert({ ...input, created_by: user?.id })
    .select('*')
    .single()
  if (error) throw error
  return data as EventRow
}

export async function updateEvent(
  id: string,
  patch: EventInput
): Promise<EventRow> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('events')
    .update(patch)
    .eq('id', id)
    .select('*')
    .single()
  if (error) throw error
  return data as EventRow
}

export async function deleteEvent(id: string): Promise<void> {
  const supabase = await createClient()
  const { error } = await supabase.from('events').delete().eq('id', id)
  if (error) throw error
}
