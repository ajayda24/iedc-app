import 'server-only'

// Leaderboard + stats readers. These hit the SQL views (leaderboard,
// leaderboard_top3, department_stats, year_stats), which respect profiles RLS
// via security_invoker — so a logged-in user is required.
import { createClient } from '@/lib/supabase/server'
import type {
  LeaderboardRow,
  MonthlyLeaderboardRow,
  MonthlyPlacement,
  DepartmentStat,
  YearStat,
  Department,
} from '@/lib/supabase/database.types'

// First day (YYYY-MM-DD) of a month, defaulting to the current month. This is
// the key used by the monthly leaderboard views' `month` column.
export function monthKey(date = new Date()): string {
  const y = date.getUTCFullYear()
  const m = String(date.getUTCMonth() + 1).padStart(2, '0')
  return `${y}-${m}-01`
}

// Overall ranking, optionally limited (e.g. top 50).
export async function getLeaderboard(limit?: number): Promise<LeaderboardRow[]> {
  const supabase = await createClient()
  let query = supabase.from('leaderboard').select('*').order('rank')
  if (limit) query = query.limit(limit)
  const { data, error } = await query
  if (error) throw error
  return (data as LeaderboardRow[]) ?? []
}

// A single profile's all-time overall rank, or null if not ranked (e.g. staff
// or a student with no points). Reads just their row from the leaderboard view.
export async function getRankFor(profileId: string): Promise<number | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('leaderboard')
    .select('rank')
    .eq('id', profileId)
    .maybeSingle()
  if (error) throw error
  return (data as { rank: number } | null)?.rank ?? null
}

// Top 3 overall (dedicated view).
export async function getTop3(): Promise<LeaderboardRow[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('leaderboard_top3')
    .select('*')
    .order('rank')
  if (error) throw error
  return (data as LeaderboardRow[]) ?? []
}

// Ranking within a single department (uses leaderboard_by_department view).
export async function getDepartmentLeaderboard(
  department: Department
): Promise<LeaderboardRow[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('leaderboard_by_department')
    .select('*')
    .eq('department', department)
    .order('dept_rank')
  if (error) throw error
  return (data as unknown as LeaderboardRow[]) ?? []
}

export async function getDepartmentStats(): Promise<DepartmentStat[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('department_stats')
    .select('*')
    .order('total_points', { ascending: false })
  if (error) throw error
  return (data as DepartmentStat[]) ?? []
}

export async function getYearStats(): Promise<YearStat[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('year_stats')
    .select('*')
    .order('year')
  if (error) throw error
  return (data as YearStat[]) ?? []
}

// -----------------------------------------------------------------------------
// Monthly (resetting) leaderboard. The board "resets" each month purely by
// filtering the monthly views on `month` — no counters are mutated, so all-time
// totals above are unaffected. Defaults to the current month.
// -----------------------------------------------------------------------------

// Full monthly ranking for a given month (default: current), optionally limited.
export async function getMonthlyLeaderboard(
  month: string = monthKey(),
  limit?: number
): Promise<MonthlyLeaderboardRow[]> {
  const supabase = await createClient()
  let query = supabase
    .from('leaderboard_monthly')
    .select('*')
    .eq('month', month)
    .order('rank')
  if (limit) query = query.limit(limit)
  const { data, error } = await query
  if (error) throw error
  return (data as MonthlyLeaderboardRow[]) ?? []
}

// Top 3 of a given month (default: current) — powers the podium.
export async function getMonthlyTop3(
  month: string = monthKey()
): Promise<MonthlyLeaderboardRow[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('leaderboard_monthly_top3')
    .select('*')
    .eq('month', month)
    .order('rank')
  if (error) throw error
  return (data as MonthlyLeaderboardRow[]) ?? []
}

// Current user's monthly rank + neighbours for a "your rank" widget.
export async function getMyMonthlyRank(
  month: string = monthKey(),
  window = 2
): Promise<{ me: MonthlyLeaderboardRow; around: MonthlyLeaderboardRow[] } | null> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  const board = await getMonthlyLeaderboard(month)
  const idx = board.findIndex((r) => r.id === user.id)
  if (idx === -1) return null

  const start = Math.max(0, idx - window)
  return {
    me: board[idx],
    around: board.slice(start, idx + window + 1),
  }
}

// Every top-3 monthly placement for one profile (newest first) — the data
// behind the "[Month] Winner / 2nd / 3rd" badges shown on a viewed profile.
export async function getProfileMonthlyPlacements(
  profileId: string
): Promise<MonthlyPlacement[]> {
  const supabase = await createClient()
  const { data, error } = await supabase.rpc('profile_monthly_placements', {
    p_profile_id: profileId,
  })
  if (error) throw error
  return (data as MonthlyPlacement[]) ?? []
}

// Current user's rank + neighbours (rows just above/below) for a "your rank"
// widget. Pulls the full leaderboard once, then slices around the user.
export async function getMyRank(
  window = 2
): Promise<{ me: LeaderboardRow; around: LeaderboardRow[] } | null> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  const board = await getLeaderboard()
  const idx = board.findIndex((r) => r.id === user.id)
  if (idx === -1) return null

  const start = Math.max(0, idx - window)
  return {
    me: board[idx],
    around: board.slice(start, idx + window + 1),
  }
}
