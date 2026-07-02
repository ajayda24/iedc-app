import type {
  EventRow,
  RegistrationStatus,
} from '@/lib/supabase/database.types'

// The state a registration CTA should present for an event + the viewer's
// current registration. Shared by the events list card and the detail page so
// both agree on when registration is open/closed/full.
export type RegState =
  | 'open' // can register
  | 'registered' // holds an active spot
  | 'full' // capacity reached
  | 'closed' // deadline passed / not published / already started
  | 'completed'
  | 'cancelled'

export function regStateFor(
  ev: EventRow,
  myStatus: RegistrationStatus | undefined,
  spotsLeft: number | null
): RegState {
  const now = Date.now()
  if (myStatus && myStatus !== 'cancelled') return 'registered'
  if (ev.status === 'cancelled') return 'cancelled'
  if (ev.status === 'completed') return 'completed'
  if (ev.status !== 'published') return 'closed'
  if (
    ev.registration_deadline &&
    new Date(ev.registration_deadline).getTime() < now
  )
    return 'closed'
  if (new Date(ev.start_date).getTime() < now) return 'closed'
  if (spotsLeft != null && spotsLeft <= 0) return 'full'
  return 'open'
}
