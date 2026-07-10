import { NextResponse } from 'next/server'
import {
  getMonthlyLeaderboard,
  getMonthlyTop3,
  getMyMonthlyRank,
  getDepartmentStats,
  getYearStats,
  monthKey,
} from '@/lib/queries'
import { getUser } from '@/lib/auth/queries'
import type {
  MonthlyLeaderboardRow,
  DepartmentStat,
  YearStat,
} from '@/lib/supabase/database.types'

// Client data source for the leaderboard page. The page renders its shell
// instantly and fetches this via SWR — so revisiting shows cached data at once
// and revalidates in the background. All reads are RLS-scoped to the caller.

export interface LeaderboardPayload {
  month: string
  board: MonthlyLeaderboardRow[]
  top3: MonthlyLeaderboardRow[]
  rank: {
    me: MonthlyLeaderboardRow
    around: MonthlyLeaderboardRow[]
  } | null
  deptStats: DepartmentStat[]
  yearStats: YearStat[]
}

export async function GET() {
  const user = await getUser()
  if (!user) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const month = monthKey()
  const [board, top3, rank, deptStats, yearStats] = await Promise.all([
    getMonthlyLeaderboard(month),
    getMonthlyTop3(month),
    getMyMonthlyRank(month),
    getDepartmentStats(),
    getYearStats(),
  ])

  return NextResponse.json({
    month,
    board,
    top3,
    rank,
    deptStats,
    yearStats,
  } satisfies LeaderboardPayload)
}
