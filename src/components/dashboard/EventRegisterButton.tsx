'use client'

import { useState, useTransition } from 'react'
import { mutate } from 'swr'
import {
  registerAction,
  cancelAction,
} from '@/lib/queries/event-actions'
import type { RegState } from '@/lib/events/reg-state'

// Registration CTA for an event card. Renders one of:
//  - "Register" (open, not yet registered)
//  - "Registered · Cancel" (user holds an active registration)
//  - a disabled reason ("Full", "Closed", "Completed", "Cancelled")
// The server action also revalidatePath()s for any server-rendered views (e.g.
// the event detail page); the SWR revalidation below refreshes the client
// events/dashboard lists so the button state + spot counts update immediately.
export type { RegState }

export default function EventRegisterButton({
  eventId,
  state,
}: {
  eventId: string
  state: RegState
}) {
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function run(action: () => Promise<{ ok: boolean; error?: string }>) {
    setError(null)
    startTransition(async () => {
      const res = await action()
      if (!res.ok) {
        setError(res.error ?? 'Something went wrong.')
        return
      }
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

  if (state === 'registered') {
    return (
      <div className="space-y-1">
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
        onClick={() => run(() => registerAction(eventId))}
        disabled={pending}
        className="w-full rounded-2xl bg-indigo text-white text-sm font-semibold py-2.5 hover:bg-indigo/90 transition-colors disabled:opacity-60"
      >
        {pending ? 'Registering…' : 'Register'}
      </button>
      {error && <p className="text-xs text-peach">{error}</p>}
    </div>
  )
}
