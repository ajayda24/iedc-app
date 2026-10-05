import type { RegState } from '@/lib/events/reg-state'

// Registration status pill for public event cards + the detail page.
const STYLES: Record<RegState, { label: string; className: string; dot: string }> = {
  open: {
    label: 'Registration open',
    className: 'bg-mint/15 text-[#178f6f]',
    dot: 'bg-[#22b08a]',
  },
  registered: {
    label: 'Registered',
    className: 'bg-indigo/12 text-indigo',
    dot: 'bg-indigo',
  },
  full: {
    label: 'Full',
    className: 'bg-peach/20 text-[#b85e30]',
    dot: 'bg-[#e07a45]',
  },
  closed: {
    label: 'Registration closed',
    className: 'bg-black/[0.05] text-ink-soft',
    dot: 'bg-muted',
  },
  completed: {
    label: 'Completed',
    className: 'bg-black/[0.05] text-ink-soft',
    dot: 'bg-muted',
  },
  cancelled: {
    label: 'Cancelled',
    className: 'bg-peach/20 text-[#b85e30]',
    dot: 'bg-[#e07a45]',
  },
}

export default function EventStateBadge({
  state,
  className = '',
}: {
  state: RegState
  className?: string
}) {
  const s = STYLES[state]
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${s.className} ${className}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} aria-hidden />
      {s.label}
    </span>
  )
}
