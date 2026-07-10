import { NextResponse } from 'next/server'
import { getProfile } from '@/lib/auth/queries'
import {
  getMyRank,
  getTop3,
  listOpenEvents,
  listMyNotifications,
} from '@/lib/queries'
import type {
  ProfileCurrent,
  LeaderboardRow,
  EventRow,
  Notification,
} from '@/lib/supabase/database.types'

// Client data source for the dashboard overview. Fetched via SWR — cached and
// background-revalidated so returning to the dashboard is instant.

export interface DashboardPayload {
  profile: Pick<
    ProfileCurrent,
    | 'name'
    | 'department'
    | 'total_points'
    | 'total_events'
    | 'total_certificates'
  >
  rank: { me: LeaderboardRow; around: LeaderboardRow[] } | null
  top3: LeaderboardRow[]
  openEvents: EventRow[]
  notifications: Notification[]
}

export async function GET() {
  const profile = await getProfile()
  if (!profile) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const [rank, top3, openEvents, notifications] = await Promise.all([
    getMyRank(),
    getTop3(),
    listOpenEvents(),
    listMyNotifications(4),
  ])

  return NextResponse.json({
    profile: {
      name: profile.name,
      department: profile.department,
      total_points: profile.total_points,
      total_events: profile.total_events,
      total_certificates: profile.total_certificates,
    },
    rank,
    top3,
    openEvents,
    notifications,
  } satisfies DashboardPayload)
}
