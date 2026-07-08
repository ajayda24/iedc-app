'use server'

// Server Actions for recording event marks/scores (coordinator + admin). Every
// action re-checks staff via requireStaff() as the real security boundary; RLS
// (scores_staff_write) is the backstop.
//
// Policy: scores can only be recorded for a participant who ATTENDED the event.
// Scoring is independent of certificates — recording a rank does NOT issue a
// winner/runner-up certificate; those stay manual on the overview page.
import { revalidatePath } from 'next/cache'
import { requireStaff } from '@/lib/auth/queries'
import { getEvent } from './events'
import { upsertEventScore, deleteEventScore } from './scores'
import { createClient } from '@/lib/supabase/server'

export interface ActionResult {
  ok: boolean
  error?: string
}

// Record (upsert) one participant's score + optional rank for an event.
export async function saveScoreAction(input: {
  eventId: string
  profileId: string
  score: number
  rank: number | null
  remarks: string | null
}): Promise<ActionResult> {
  await requireStaff()

  if (!Number.isFinite(input.score)) {
    return { ok: false, error: 'Score must be a number.' }
  }
  if (input.rank != null && (!Number.isInteger(input.rank) || input.rank < 1)) {
    return { ok: false, error: 'Rank must be a positive whole number.' }
  }

  const event = await getEvent(input.eventId)
  if (!event) return { ok: false, error: 'Event not found.' }

  // Guard: only attendees can be scored.
  const supabase = await createClient()
  const { data: reg } = await supabase
    .from('event_registrations')
    .select('status')
    .eq('event_id', input.eventId)
    .eq('profile_id', input.profileId)
    .maybeSingle()
  if (!reg || reg.status !== 'attended') {
    return { ok: false, error: 'This student is not marked as attended.' }
  }

  try {
    await upsertEventScore({
      eventId: input.eventId,
      profileId: input.profileId,
      score: input.score,
      rank: input.rank,
      remarks: input.remarks?.trim() ? input.remarks.trim() : null,
    })
  } catch {
    return { ok: false, error: 'Could not save the score. Try again.' }
  }

  revalidatePath(`/dashboard/manage/${input.eventId}/overview/scores`)
  revalidatePath(`/dashboard/manage/${input.eventId}/overview`)
  return { ok: true }
}

// Clear a participant's score row.
export async function clearScoreAction(
  eventId: string,
  profileId: string
): Promise<ActionResult> {
  await requireStaff()
  try {
    await deleteEventScore(eventId, profileId)
  } catch {
    return { ok: false, error: 'Could not clear the score.' }
  }
  revalidatePath(`/dashboard/manage/${eventId}/overview/scores`)
  revalidatePath(`/dashboard/manage/${eventId}/overview`)
  return { ok: true }
}
