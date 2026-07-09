import Link from 'next/link'
import Icon from '@/components/landing/Icon'
import { STAT_ART, type StatArtKey } from './StatArt'

// Shared dashboard UI primitives. Server-safe (no client hooks).

// A frosted content card.
export function Card({
  children,
  className = '',
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={`glass rounded-3xl p-5 ${className}`}>{children}</div>
  )
}

const TINTS: Record<string, string> = {
  indigo: 'text-indigo bg-indigo/12',
  lavender: 'text-lavender bg-lavender/15',
  blue: 'text-blue bg-blue/12',
  mint: 'text-mint bg-mint/15',
  peach: 'text-peach bg-peach/15',
}

// Plain text color per tint (no background) — for the "View all" link etc.
const TEXT_TINTS: Record<string, string> = {
  indigo: 'text-indigo',
  lavender: 'text-lavender',
  blue: 'text-blue',
  mint: 'text-mint',
  peach: 'text-peach',
}

// Section title with an icon in a tinted chip and an optional "View all" link.
// `tint` colors both the icon chip and the link, matching the section's theme.
export function SectionHeader({
  title,
  icon,
  href,
  action = 'View all',
  tint = 'indigo',
}: {
  title: string
  icon?: string
  href?: string
  action?: string
  tint?: keyof typeof TINTS
}) {
  return (
    <div className="flex items-center justify-between mb-4">
      <h2 className="flex items-center gap-2.5 font-display font-semibold text-base">
        {icon && (
          <span
            className={`grid place-items-center w-9 h-9 rounded-2xl ${TINTS[tint]}`}
          >
            <Icon name={icon} className="w-5 h-5" />
          </span>
        )}
        {title}
      </h2>
      {href && (
        <Link
          href={href}
          className={`inline-flex items-center gap-1.5 text-xs font-semibold hover:underline ${TEXT_TINTS[tint]}`}
        >
          {action}
          <span
            className={`grid place-items-center w-7 h-7 rounded-full ${TINTS[tint]}`}
            aria-hidden="true"
          >
            <Icon name="arrow" className="w-3.5 h-3.5" />
          </span>
        </Link>
      )}
    </div>
  )
}

// Text color per tint — drives the `currentColor` of the decorative art so it
// matches the card. Kept separate from TINTS (which also carries a bg).
const ART_TEXT: Record<string, string> = {
  indigo: 'text-indigo',
  lavender: 'text-lavender',
  blue: 'text-blue',
  mint: 'text-mint',
  peach: 'text-peach',
}

// All arts sit anchored to the card's bottom-right corner as a background wash.
const ART_LAYOUT: Record<string, string> = {
  area: 'right-0 -bottom-3 w-3/5 h-[70%]',
  points: 'right-0 -bottom-2 w-3/5 h-[70%]',
  certificate: '-right-2 sm:-bottom-3 -bottom-5 w-[46%] h-[92%]',
  podium: 'right-0 -bottom-5 w-[46%] h-[80%]',
}

// A single stat tile: icon, label, big value, optional footnote, and an
// optional decorative background graphic (`art`) that blends into the card —
// see StatArt.tsx. Cards without `art` look exactly as before.
export function StatCard({
  icon,
  label,
  value,
  hint,
  tint = 'indigo',
  art,
  compact = false,
}: {
  icon: string
  label: string
  value: string | number
  hint?: string
  tint?: keyof typeof TINTS
  art?: StatArtKey
  // Short, tight tile with an inline icon+text layout — no min-height. For
  // pages (e.g. Certificates) where the tall art-friendly tile wastes space.
  compact?: boolean
}) {
  const Art = art ? STAT_ART[art] : null

  if (compact) {
    return (
      <div className="glass relative overflow-hidden rounded-2xl p-3 flex items-center gap-3">
        <span
          className={`grid place-items-center w-9 h-9 rounded-xl shrink-0 ${TINTS[tint]}`}
        >
          <Icon name={icon} className="w-4 h-4" />
        </span>
        <div className="min-w-0">
          <p className="text-[0.7rem] text-muted font-medium truncate">
            {label}
          </p>
          <p className="font-display font-bold text-lg leading-tight">
            {value}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="glass relative overflow-hidden rounded-3xl p-4 sm:p-5 flex flex-col gap-2 min-h-30 sm:min-h-34">
      {Art && art && (
        <div
          className={`pointer-events-none absolute opacity-40 ${ART_LAYOUT[art]} ${ART_TEXT[tint]}`}
          aria-hidden="true"
        >
          <Art className="w-full h-full" />
        </div>
      )}
      <div className="relative flex items-center justify-between">
        <span
          className={`grid place-items-center w-10 h-10 rounded-2xl ${TINTS[tint]}`}
        >
          <Icon name={icon} className="w-5 h-5" />
        </span>
      </div>
      <div className="relative mt-auto">
        <p className="text-xs text-muted font-medium">{label}</p>
        <p className="font-display font-bold text-2xl sm:text-3xl leading-tight">
          {value}
        </p>
        {hint && <p className="text-xs text-mint font-medium mt-0.5">{hint}</p>}
      </div>
    </div>
  )
}

// Small rounded status pill.
const PILL_TINTS: Record<string, string> = {
  indigo: 'text-indigo bg-indigo/15',
  mint: 'text-mint bg-mint/12',
  peach: 'text-peach bg-peach/15',
  muted: 'text-muted bg-black/5',
}

export function Pill({
  children,
  tint = 'indigo',
}: {
  children: React.ReactNode
  tint?: keyof typeof PILL_TINTS
}) {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${PILL_TINTS[tint]}`}
    >
      {children}
    </span>
  )
}

// Empty-state placeholder for lists with no data.
export function EmptyState({
  icon = 'spark',
  title,
  hint,
}: {
  icon?: string
  title: string
  hint?: string
}) {
  return (
    <div className="text-center py-8 px-4">
      <span className="grid place-items-center w-12 h-12 rounded-2xl bg-black/5 text-muted mx-auto mb-3">
        <Icon name={icon} className="w-6 h-6" />
      </span>
      <p className="font-medium text-ink-soft">{title}</p>
      {hint && <p className="text-sm text-muted mt-1">{hint}</p>}
    </div>
  )
}
