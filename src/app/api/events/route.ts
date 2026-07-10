import { NextResponse } from 'next/server'
import {
  listEvents,
  listMyRegistrations,
  countRegistrationsByEvent,
} from '@/lib/queries'
import { getUser } from '@/lib/auth/queries'
import type {
  EventRow,
  RegistrationStatus,
} from '@/lib/supabase/database.types'

// Client data source for the events page. Returns ALL visible events (RLS still
// hides drafts from students) plus the caller's registration status per event
// and the active-registration counts. The page filters (time/category) client
// side, so switching filters never re-fetches. Fetched via SWR — cached and
// background-revalidated for snappy revisits.

export interface EventsPayload {
  events: EventRow[]
  // event id -> the caller's current registration status (if any)
  myStatus: Record<string, RegistrationStatus>
  // event id -> active (non-cancelled) registration count
  counts: Record<string, number>
}

export async function GET() {
  const user = await getUser()
  if (!user) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const [events, myRegs] = await Promise.all([
    listEvents(),
    listMyRegistrations(),
  ])

  const myStatus: Record<string, RegistrationStatus> = {}
  for (const r of myRegs) myStatus[r.event_id] = r.status

  const counts = await countRegistrationsByEvent(events.map((e) => e.id))

  return NextResponse.json({ events, myStatus, counts } satisfies EventsPayload)
}
