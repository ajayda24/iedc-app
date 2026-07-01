import Link from 'next/link'
import Icon from '@/components/landing/Icon'

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

// Section title with an optional "View all" link.
export function SectionHeader({
  title,
  icon,
  href,
  action = 'View all',
}: {
  title: string
  icon?: string
  href?: string
  action?: string
}) {
  return (
    <div className="flex items-center justify-between mb-4">
      <h2 className="flex items-center gap-2 font-display font-semibold text-base">
        {icon && <Icon name={icon} className="w-5 h-5 text-indigo" />}
        {title}
      </h2>
      {href && (
        <Link
          href={href}
          className="text-sm font-medium text-indigo hover:underline"
        >
          {action}
        </Link>
      )}
    </div>
  )
}

const TINTS: Record<string, string> = {
  indigo: 'text-indigo bg-indigo/12',
  blue: 'text-blue bg-blue/12',
  mint: 'text-mint bg-mint/15',
  peach: 'text-peach bg-peach/15',
}

// A single stat tile: icon, label, big value, optional delta/footnote.
export function StatCard({
  icon,
  label,
  value,
  hint,
  tint = 'indigo',
}: {
  icon: string
  label: string
  value: string | number
  hint?: string
  tint?: keyof typeof TINTS
}) {
  return (
    <div className="glass rounded-3xl p-4 sm:p-5 flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span
          className={`grid place-items-center w-10 h-10 rounded-2xl ${TINTS[tint]}`}
        >
          <Icon name={icon} className="w-5 h-5" />
        </span>
      </div>
      <div>
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
  indigo: 'text-indigo bg-indigo/12',
  mint: 'text-mint bg-mint/15',
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
