'use client'

import { useState, useTransition } from 'react'
import { mutate } from 'swr'
import {
  registerAction,
  cancelAction,
  resubmitPaymentAction,
} from '@/lib/queries/event-actions'
import type { RegState } from '@/lib/events/reg-state'
import type { PaymentStatus } from '@/lib/supabase/database.types'
import { formatFee, isValidUtr } from '@/lib/events/upi'
import UpiPayPanel from '@/components/events/UpiPayPanel'

// Registration CTA for an event card. Renders one of:
//  - "Register" (open, not yet registered)
//  - "Registered · Cancel" (user holds an active registration)
//  - a disabled reason ("Full", "Closed", "Completed", "Cancelled")
// The server action also revalidatePath()s for any server-rendered views (e.g.
// the event detail page); the SWR revalidation below refreshes the client
// events/dashboard lists so the button state + spot counts update immediately.
//
// Paid events (`payment` given): Register expands a UPI pay panel and submits
// the transaction ID with the registration; once registered, the button shows
// the payment's verification state and lets a rejected payment be resubmitted.
export type { RegState }

export interface EventPaymentInfo {
  fee: number
  upiId: string
  payeeName: string | null
  eventTitle: string
  studentId: string | null
  // The viewer's payment status, when registered.
  status?: PaymentStatus
}

export default function EventRegisterButton({
  eventId,
  state,
  payment,
}: {
  eventId: string
  state: RegState
  payment?: EventPaymentInfo | null
}) {
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [paying, setPaying] = useState(false)
  const [utr, setUtr] = useState('')

  function run(action: () => Promise<{ ok: boolean; error?: string }>) {
    setError(null)
    startTransition(async () => {
      const res = await action()
      if (!res.ok) {
        setError(res.error ?? 'Something went wrong.')
        return
      }
      setPaying(false)
      setUtr('')
      // Refresh the SWR-cached client lists that show registration state.
      mutate('/api/events')
      mutate('/api/dashboard')
    })
  }

  const disabledReason =
    state === 'full'
      ? 'Full'
      : state === 'closed'
        ? 'Closed'
        : state === 'completed'
          ? 'Completed'
          : state === 'cancelled'
            ? 'Cancelled'
            : null

  if (disabledReason) {
    return (
      <button
        disabled
        className="w-full rounded-2xl bg-black/5 text-muted text-sm font-semibold py-2.5 cursor-not-allowed"
      >
        {disabledReason}
      </button>
    )
  }

  // Pay panel + confirm, for a new registration or a resubmitted UTR.
  if (payment && paying) {
    const resubmit = state === 'registered'
    return (
      <div className="space-y-2">
        <UpiPayPanel
          fee={payment.fee}
          upiId={payment.upiId}
          payeeName={payment.payeeName}
          eventTitle={payment.eventTitle}
          studentId={payment.studentId}
          utr={utr}
          onUtrChange={setUtr}
        />
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => {
              setPaying(false)
              setError(null)
            }}
            disabled={pending}
            className="rounded-2xl border border-black/10 text-ink-soft text-sm font-semibold px-4 py-2.5 hover:bg-white/60 transition-colors disabled:opacity-60"
          >
            Back
          </button>
          <button
            type="button"
            onClick={() =>
              run(() =>
                resubmit
                  ? resubmitPaymentAction(eventId, utr)
                  : registerAction(eventId, utr)
              )
            }
            disabled={pending || !isValidUtr(utr)}
            className="flex-1 rounded-2xl bg-indigo text-white text-sm font-semibold py-2.5 hover:bg-indigo/90 transition-colors disabled:opacity-60"
          >
            {pending
              ? 'Submitting…'
              : resubmit
                ? 'Submit transaction ID'
                : 'Confirm registration'}
          </button>
        </div>
        {error && <p className="text-xs text-peach">{error}</p>}
      </div>
    )
  }

  if (state === 'registered') {
    return (
      <div className="space-y-1">
        {payment && payment.status && payment.status !== 'not_required' && (
          <PaymentNote
            status={payment.status}
            onResubmit={() => setPaying(true)}
          />
        )}
        <button
          onClick={() => run(() => cancelAction(eventId))}
          disabled={pending}
          className="w-full rounded-2xl border border-black/10 text-ink-soft text-sm font-semibold py-2.5 hover:bg-white/60 transition-colors disabled:opacity-60"
        >
          {pending ? 'Cancelling…' : 'Registered · Cancel'}
        </button>
        {error && <p className="text-xs text-peach">{error}</p>}
      </div>
    )
  }

  return (
    <div className="space-y-1">
      <button
        onClick={() =>
          payment ? setPaying(true) : run(() => registerAction(eventId))
        }
        disabled={pending}
        className="w-full rounded-2xl bg-indigo text-white text-sm font-semibold py-2.5 hover:bg-indigo/90 transition-colors disabled:opacity-60"
      >
        {pending
          ? 'Registering…'
          : payment
            ? `Register · ${formatFee(payment.fee)}`
            : 'Register'}
      </button>
      {error && <p className="text-xs text-peach">{error}</p>}
    </div>
  )
}

function PaymentNote({
  status,
  onResubmit,
}: {
  status: Exclude<PaymentStatus, 'not_required'>
  onResubmit: () => void
}) {
  if (status === 'verified') {
    return (
      <p className="rounded-xl bg-mint/15 px-3 py-2 text-xs font-semibold text-[#178f6f]">
        Payment verified ✓
      </p>
    )
  }
  if (status === 'pending') {
    return (
      <p className="rounded-xl bg-indigo/10 px-3 py-2 text-xs text-ink-soft">
        <span className="font-semibold text-indigo">Payment pending</span> —
        we&apos;ll verify your transaction ID before the event.
      </p>
    )
  }
  return (
    <div className="rounded-xl bg-peach/15 px-3 py-2 text-xs text-[#a5522a]">
      <span className="font-semibold">Payment not found.</span> Check the
      transaction ID in your UPI app.{' '}
      <button
        type="button"
        onClick={onResubmit}
        className="font-semibold underline"
      >
        Resubmit
      </button>
    </div>
  )
}
