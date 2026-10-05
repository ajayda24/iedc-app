import 'server-only'

// Read helpers for the PUBLIC (no-login) pages: /events, /events/[id].
//
// Uses the service-role client because anon users can't read events or count
// registrations through RLS. Every query hard-filters to non-draft events and
// selects an explicit, presentation-safe column list — never created_by, edit
// locks or anything about who registered — so nothing private is exposed.
import { cache } from 'react'
import { createAdminClient } from '@/lib/supabase/admin'
import type { EventCategory, EventRow } from '@/lib/supabase/database.types'
import { regStateFor, type RegState } from '@/lib/events/reg-state'

const PUBLIC_COLUMNS =
  'id, title, description, banner, category, venue, start_date, end_date, registration_deadline, max_participants, points, benefit_attendance, benefit_certificate, benefit_activity_points, status, certificate_template, created_at, updated_at'

// Statuses the public may see. Drafts are staff-only.
const VISIBLE_STATUSES = ['published', 'completed', 'cancelled'] as const

export type PublicEventRow = Omit<EventRow, 'created_by'>

export interface PublicEventCard extends PublicEventRow {
  registered: number
  spotsLeft: number | null
  state: RegState
}

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export function isUuid(id: string): boolean {
  return UUID_RE.test(id)
}

// Active (non-cancelled) registration counts per event id.
async function countRegistrations(
  eventIds: string[]
): Promise<Record<string, number>> {
  if (eventIds.length === 0) return {}
  const admin = createAdminClient()
  const { data } = await admin
    .from('event_registrations')
    .select('event_id')
    .in('event_id', eventIds)
    .neq('status', 'cancelled')
  const counts: Record<string, number> = {}
  for (const row of (data as { event_id: string }[]) ?? []) {
    counts[row.event_id] = (counts[row.event_id] ?? 0) + 1
  }
  return counts
}

function toCard(ev: PublicEventRow, registered: number): PublicEventCard {
  const spotsLeft =
    ev.max_participants != null
      ? Math.max(0, ev.max_participants - registered)
      : null
  return {
    ...ev,
    registered,
    spotsLeft,
    state: regStateFor(ev as EventRow, undefined, spotsLeft),
  }
}

export type PublicEventsView = 'upcoming' | 'past'

// Upcoming = published and not yet started/ended. Past = completed, or
// published events whose start has passed. Cancelled events are hidden from
// the listing (still reachable by direct link so old shares don't 404).
export async function listPublicEvents(opts: {
  view: PublicEventsView
  category?: EventCategory
}): Promise<PublicEventCard[]> {
  const admin = createAdminClient()
  const now = new Date().toISOString()

  let query = admin.from('events').select(PUBLIC_COLUMNS)
  if (opts.category) query = query.eq('category', opts.category)

  if (opts.view === 'upcoming') {
    query = query
      .eq('status', 'published')
      .gte('start_date', now)
      .order('start_date', { ascending: true })
  } else {
    query = query
      .in('status', ['published', 'completed'])
      .lt('start_date', now)
      .order('start_date', { ascending: false })
      .limit(48)
  }

  const { data, error } = await query
  if (error) {
    console.error('[public] listPublicEvents failed:', error.message)
    return []
  }
  const events = (data ?? []) as PublicEventRow[]
  const counts = await countRegistrations(events.map((e) => e.id))
  return events.map((e) => toCard(e, counts[e.id] ?? 0))
}

// One event for the public detail page, or null (draft / missing / bad id).
// cache() so generateMetadata and the page share one query per request.
export const getPublicEvent = cache(
  async (id: string): Promise<PublicEventCard | null> => {
    if (!isUuid(id)) return null
    const admin = createAdminClient()
    const { data } = await admin
      .from('events')
      .select(PUBLIC_COLUMNS)
      .eq('id', id)
      .in('status', VISIBLE_STATUSES as unknown as string[])
      .maybeSingle()
    if (!data) return null
    const ev = data as PublicEventRow
    const counts = await countRegistrations([ev.id])
    return toCard(ev, counts[ev.id] ?? 0)
  }
)

// Headline numbers for the public events hero.
export async function getPublicStats(): Promise<{
  events: number
  participants: number
}> {
  const admin = createAdminClient()
  const [{ count: events }, { count: participants }] = await Promise.all([
    admin
      .from('events')
      .select('id', { count: 'exact', head: true })
      .in('status', ['published', 'completed']),
    admin
      .from('event_registrations')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'attended'),
  ])
  return { events: events ?? 0, participants: participants ?? 0 }
}
