import 'server-only'

// Leaderboard + stats readers. These hit the SQL views (leaderboard,
// leaderboard_top3, department_stats, year_stats), which respect profiles RLS
// via security_invoker — so a logged-in user is required.
import { createClient } from '@/lib/supabase/server'
import type {
  LeaderboardRow,
  DepartmentStat,
  YearStat,
  Department,
} from '@/lib/supabase/database.types'

// Overall ranking, optionally limited (e.g. top 50).
export async function getLeaderboard(limit?: number): Promise<LeaderboardRow[]> {
  const supabase = await createClient()
  let query = supabase.from('leaderboard').select('*').order('rank')
  if (limit) query = query.limit(limit)
  const { data, error } = await query
  if (error) throw error
  return (data as LeaderboardRow[]) ?? []
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
