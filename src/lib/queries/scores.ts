import 'server-only'

// Event scores / marks. Staff record a numeric score and an optional rank
// (1 = winner, 2 = runner-up, …) per participant to identify winners. RLS
// (scores_staff_write / scores_select) is the security boundary; a score row
// folds into the profile's total_points via the recompute trigger.
import { createClient } from '@/lib/supabase/server'
import type { EventScore } from '@/lib/supabase/database.types'

// All score rows for one event, keyed by profile_id for quick lookup.
export async function scoresForEvent(eventId: string): Promise<EventScore[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('event_scores')
    .select('*')
    .eq('event_id', eventId)
  if (error) throw error
  return (data as EventScore[]) ?? []
}

// Upsert a participant's score + rank for an event. Keyed by the unique
// (event_id, profile_id) constraint, so re-saving updates in place.
export async function upsertEventScore(input: {
  eventId: string
  profileId: string
  score: number
  rank: number | null
  remarks: string | null
}): Promise<void> {
  const supabase = await createClient()
  const { error } = await supabase.from('event_scores').upsert(
    {
      event_id: input.eventId,
      profile_id: input.profileId,
      score: input.score,
      rank: input.rank,
      remarks: input.remarks,
    },
    { onConflict: 'event_id,profile_id' }
  )
  if (error) throw error
}

// Remove a participant's score row for an event (clears their mark/rank).
export async function deleteEventScore(
  eventId: string,
  profileId: string
): Promise<void> {
  const supabase = await createClient()
  const { error } = await supabase
    .from('event_scores')
    .delete()
    .eq('event_id', eventId)
    .eq('profile_id', profileId)
  if (error) throw error
}
