'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { markPaymentAction } from '@/lib/queries/manage-actions'
import type { PaymentStatus } from '@/lib/supabase/database.types'

// Payment check for a single registrant of a paid event: shows the submitted
// UPI transaction ID with Verify / Reject. A decided payment shows its badge
// with an Undo back to pending. Refreshes after a successful change.
export default function PaymentControls({
  registrationId,
  eventId,
  status,
  paymentRef,
}: {
  registrationId: string
  eventId: string
  status: PaymentStatus
  paymentRef: string | null
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function mark(next: Exclude<PaymentStatus, 'not_required'>) {
    setError(null)
    startTransition(async () => {
      const res = await markPaymentAction(registrationId, eventId, next)
      if (res.ok) router.refresh()
      else setError(res.error ?? 'Something went wrong.')
    })
  }

  const decided = status === 'verified' || status === 'rejected'

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex items-center gap-2 text-xs">
        <span
          className="flex flex-col items-end leading-tight"
          title="UPI transaction ID (UTR)"
        >
          <span className="text-[0.65rem] font-semibold uppercase tracking-wide text-muted">
            UPI Ref ID
          </span>
          <span className="font-mono text-ink-soft select-all">
            {paymentRef ?? 'Not submitted'}
          </span>
        </span>
        {decided ? (
          <>
            <span
              className={`rounded-full px-2 py-0.5 font-semibold ${
                status === 'verified'
                  ? 'bg-mint/15 text-[#178f6f]'
                  : 'bg-peach/15 text-[#a5522a]'
              }`}
            >
              {status === 'verified' ? 'Paid ✓' : 'Rejected'}
            </span>
            <button
              type="button"
              onClick={() => mark('pending')}
              disabled={pending}
              className="text-muted hover:text-ink-soft underline disabled:opacity-50"
            >
              Undo
            </button>
          </>
        ) : (
          <div className="flex rounded-xl bg-black/5 p-0.5 font-semibold">
            <button
              type="button"
              onClick={() => mark('verified')}
              disabled={pending}
              className="px-3 py-1.5 rounded-lg text-muted hover:text-ink-soft transition-colors disabled:opacity-50"
              title={paymentRef ? 'UTR found in payment history' : 'Collected in person'}
            >
              Verify
            </button>
            <button
              type="button"
              onClick={() => mark('rejected')}
              disabled={pending}
              className="px-3 py-1.5 rounded-lg text-muted hover:text-ink-soft transition-colors disabled:opacity-50"
            >
              Reject
            </button>
          </div>
        )}
      </div>
      {error && <span className="text-xs text-peach">{error}</span>}
    </div>
  )
}
