'use server'

// Server Actions for event registration, invoked from client components.
// Auth + RLS (event open, self-only) are enforced in the query layer; these
// wrappers translate thrown errors into a serializable result and refresh the
// events list so the UI reflects the new registration state.
import { revalidatePath } from 'next/cache'
import { registerForEvent, cancelRegistration } from './registrations'

export interface ActionResult {
  ok: boolean
  error?: string
}

export async function registerAction(eventId: string): Promise<ActionResult> {
  try {
    await registerForEvent(eventId)
    revalidatePath('/dashboard/events')
    return { ok: true }
  } catch (err) {
    return { ok: false, error: messageFor(err) }
  }
}

export async function cancelAction(eventId: string): Promise<ActionResult> {
  try {
    await cancelRegistration(eventId)
    revalidatePath('/dashboard/events')
    return { ok: true }
  } catch (err) {
    return { ok: false, error: messageFor(err) }
  }
}

// Map raw errors (incl. RLS denials / unique-violation on re-register) to a
// short user-facing message. We keep it generic — the exact Postgres text
// isn't useful to a student.
function messageFor(err: unknown): string {
  const msg = err instanceof Error ? err.message : String(err)
  if (/duplicate|unique/i.test(msg)) return 'You are already registered.'
  if (/row-level security|policy/i.test(msg))
    return 'Registration is closed for this event.'
  return 'Something went wrong. Please try again.'
}
