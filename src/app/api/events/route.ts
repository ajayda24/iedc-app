import { NextResponse } from 'next/server'
import {
  listEvents,
  listMyRegistrations,
  countRegistrationsByEvent,
} from '@/lib/queries'
import { getUser, getProfile } from '@/lib/auth/queries'
import type {
  EventRow,
  PaymentStatus,
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
  // event id -> the caller's payment status (paid events only)
  myPayment: Record<string, PaymentStatus>
  // The caller's student ID, put in the UPI payment note for paid events.
  studentId: string | null
  // event id -> active (non-cancelled) registration count
  counts: Record<string, number>
}

export async function GET() {
  const user = await getUser()
  if (!user) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const [events, myRegs, profile] = await Promise.all([
    listEvents(),
    listMyRegistrations(),
    getProfile(),
  ])

  const myStatus: Record<string, RegistrationStatus> = {}
  const myPayment: Record<string, PaymentStatus> = {}
  for (const r of myRegs) {
    myStatus[r.event_id] = r.status
    if (r.payment_status !== 'not_required') {
      myPayment[r.event_id] = r.payment_status
    }
  }

  const counts = await countRegistrationsByEvent(events.map((e) => e.id))

  return NextResponse.json({
    events,
    myStatus,
    myPayment,
    studentId: profile?.student_id ?? null,
    counts,
  } satisfies EventsPayload)
}
