'use server'

// Server Actions for event registration, invoked from client components.
// Auth + RLS (event open, self-only) are enforced in the query layer; these
// wrappers translate thrown errors into a serializable result and refresh the
// events list so the UI reflects the new registration state.
import { revalidatePath } from 'next/cache'
import {
  registerForEvent,
  cancelRegistration,
  resubmitPayment,
} from './registrations'
import { getEvent } from './events'
import { isValidUtr, normalizeUtr } from '@/lib/events/upi'

export interface ActionResult {
  ok: boolean
  error?: string
}

// `paymentRef` is the UPI transaction ID, required for paid events.
export async function registerAction(
  eventId: string,
  paymentRef?: string
): Promise<ActionResult> {
  const ref = paymentRef ? normalizeUtr(paymentRef) : null
  const event = await getEvent(eventId)
  if (event && event.fee_amount > 0 && (!ref || !isValidUtr(ref))) {
    return { ok: false, error: 'Enter the 12-digit UPI transaction ID.' }
  }
  try {
    await registerForEvent(eventId, event?.fee_amount ? ref : null)
    revalidatePath('/dashboard/events')
    revalidatePath(`/dashboard/events/${eventId}`)
    return { ok: true }
  } catch (err) {
    return { ok: false, error: messageFor(err) }
  }
}

export async function cancelAction(eventId: string): Promise<ActionResult> {
  try {
    await cancelRegistration(eventId)
    revalidatePath('/dashboard/events')
    revalidatePath(`/dashboard/events/${eventId}`)
    return { ok: true }
  } catch (err) {
    return { ok: false, error: messageFor(err) }
  }
}

// Submit a corrected UPI transaction ID for an existing registration.
export async function resubmitPaymentAction(
  eventId: string,
  paymentRef: string
): Promise<ActionResult> {
  const ref = normalizeUtr(paymentRef)
  if (!isValidUtr(ref)) {
    return { ok: false, error: 'Enter the 12-digit UPI transaction ID.' }
  }
  try {
    await resubmitPayment(eventId, ref)
    revalidatePath('/dashboard/events')
    revalidatePath(`/dashboard/events/${eventId}`)
    return { ok: true }
  } catch (err) {
    return { ok: false, error: messageFor(err) }
  }
}

// Map raw errors (incl. RLS denials / unique-violation on re-register) to a
// short user-facing message. We keep it generic — the exact Postgres text
// isn't useful to a student.
function messageFor(err: unknown): string {
  // Supabase errors are plain objects with a message in some client versions.
  const msg =
    (err as { message?: unknown } | null)?.message?.toString() ?? String(err)
  if (/payment_ref/i.test(msg) && /duplicate|unique/i.test(msg))
    return 'This transaction ID was already used for this event.'
  if (/payment_ref/i.test(msg)) return 'Enter the 12-digit UPI transaction ID.'
  if (/duplicate|unique/i.test(msg)) return 'You are already registered.'
  if (/row-level security|policy/i.test(msg))
    return 'Registration is closed for this event.'
  return 'Something went wrong. Please try again.'
}
