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
