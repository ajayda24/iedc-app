import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { EventRow, LeaderboardRow } from '@/lib/supabase/database.types'

export interface SearchResult {
  events: Pick<EventRow, 'id' | 'title' | 'category' | 'start_date' | 'venue'>[]
  people: Pick<
    LeaderboardRow,
    'id' | 'name' | 'department' | 'year' | 'total_points'
  >[]
}

// Live search across events (title/venue) and people (leaderboard names).
// Reads run as the logged-in user, so RLS decides visibility (e.g. no drafts
// for students). Returns empty for very short queries.
export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get('q')?.trim() ?? ''

  if (q.length < 2) {
    return NextResponse.json({ events: [], people: [] } satisfies SearchResult)
  }

  const supabase = await createClient()

  // Guard: must be authenticated (the dashboard is the only caller).
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const like = `%${q}%`

  const [eventsRes, peopleRes] = await Promise.all([
    supabase
      .from('events')
      .select('id, title, category, start_date, venue')
      .or(`title.ilike.${like},venue.ilike.${like}`)
      .order('start_date', { ascending: false })
      .limit(6),
    supabase
      .from('leaderboard')
      .select('id, name, department, year, total_points')
      .ilike('name', like)
      .limit(6),
  ])

  return NextResponse.json({
    events: eventsRes.data ?? [],
    people: peopleRes.data ?? [],
  } satisfies SearchResult)
}
