import Icon from '@/components/landing/Icon'
import { formatFee } from '@/lib/events/upi'
import type { EventRow } from '@/lib/supabase/database.types'

// Gold highlight for an event's cash prize pool. Server-safe (no hooks).
//  - 'chip':  compact pill for event cards.
//  - 'panel': larger callout for event detail pages.
// Renders nothing when the event has no prize.
export default function PrizeBadge({
  event,
  variant = 'chip',
}: {
  event: Pick<EventRow, 'prize_pool' | 'prize_winners'>
  variant?: 'chip' | 'panel'
}) {
  if (!event.prize_pool) return null
  const amount = formatFee(event.prize_pool)
  const winners = event.prize_winners
  const who = winners
    ? winners === 1
      ? 'for the winner'
      : `for the top ${winners}`
    : null

  if (variant === 'panel') {
    return (
      <div className="flex items-center gap-3 rounded-2xl border border-amber-300/70 bg-gradient-to-r from-amber-100 via-amber-50 to-white px-4 py-3">
        <span className="grid place-items-center w-10 h-10 rounded-xl bg-amber-400/25 text-amber-700 shrink-0">
          <Icon name="trophy" className="w-5 h-5" />
        </span>
        <div className="min-w-0">
          <p className="text-[0.7rem] font-semibold uppercase tracking-wide text-amber-700">
            Cash prize pool
          </p>
          <p className="font-display text-lg font-bold leading-tight text-amber-900">
            {amount}
            {who && (
              <span className="ml-1.5 text-sm font-semibold text-amber-800">
                {who}
              </span>
            )}
          </p>
        </div>
      </div>
    )
  }

  return (
    <span className="inline-flex self-start max-w-full items-center gap-1.5 rounded-full border border-amber-300/70 bg-gradient-to-r from-amber-100 to-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-800">
      <Icon name="trophy" className="w-3.5 h-3.5 shrink-0 text-amber-600" />
      <span className="truncate">
        {amount} cash prize
        {winners ? ` · ${winners === 1 ? 'Winner' : `Top ${winners}`}` : ''}
      </span>
    </span>
  )
}
