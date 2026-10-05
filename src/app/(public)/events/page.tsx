import type { Metadata } from 'next'
import Link from 'next/link'
import Icon from '@/components/landing/Icon'
import { CATEGORY_LABEL } from '@/components/dashboard/format'
import PublicEventCard from '@/components/public/PublicEventCard'
import {
  getPublicStats,
  listPublicEvents,
  type PublicEventsView,
} from '@/lib/public/events'
import type { EventCategory } from '@/lib/supabase/database.types'

export const metadata: Metadata = {
  title: 'Events',
  description:
    'Workshops, hackathons, bootcamps and talks from IEDC. Register with your student ID — no account needed.',
  openGraph: {
    title: 'Events · IEDC Hub',
    description:
      'Workshops, hackathons, bootcamps and talks from IEDC. Register with your student ID — no account needed.',
  },
}

// Always render fresh: seat counts and open/closed state change constantly.
export const dynamic = 'force-dynamic'

const CATEGORIES = Object.keys(CATEGORY_LABEL) as EventCategory[]

function hrefFor(view: PublicEventsView, category?: EventCategory) {
  const sp = new URLSearchParams()
  if (view === 'past') sp.set('view', 'past')
  if (category) sp.set('category', category)
  const qs = sp.toString()
  return qs ? `/events?${qs}` : '/events'
}

export default async function PublicEventsPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string; category?: string }>
}) {
  const sp = await searchParams
  const view: PublicEventsView = sp.view === 'past' ? 'past' : 'upcoming'
  const category = CATEGORIES.includes(sp.category as EventCategory)
    ? (sp.category as EventCategory)
    : undefined

  const [events, stats] = await Promise.all([
    listPublicEvents({ view, category }),
    getPublicStats(),
  ])

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10"
          style={{
            background:
              'radial-gradient(700px 360px at 15% 0%, rgba(122,108,255,0.16), transparent 70%), radial-gradient(600px 340px at 90% 20%, rgba(116,208,255,0.16), transparent 70%)',
          }}
        />
        <div className="mx-auto max-w-6xl px-4 pb-10 pt-12 sm:px-6 sm:pt-16">
          <p className="eyebrow">IEDC Events</p>
          <h1 className="mt-3 max-w-2xl font-display text-4xl font-bold tracking-tight sm:text-5xl">
            Learn, build and <span className="text-grad">compete</span>
          </h1>
          <p className="mt-4 max-w-xl text-ink-soft sm:text-lg">
            Register with your student ID and the email on your college record.
            No account needed. Create one later to collect your certificates and
            activity points.
          </p>

          <dl className="mt-8 flex flex-wrap gap-x-10 gap-y-4">
            <div>
              <dt className="text-xs font-medium uppercase tracking-wider text-muted">
                Events hosted
              </dt>
              <dd className="font-display text-2xl font-bold tabular-nums">
                {stats.events}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase tracking-wider text-muted">
                Attendances
              </dt>
              <dd className="font-display text-2xl font-bold tabular-nums">
                {stats.participants}
              </dd>
            </div>
          </dl>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 sm:px-6">
        {/* Filters */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div
            role="tablist"
            aria-label="Event timeframe"
            className="inline-flex self-start rounded-2xl bg-black/[0.04] p-1"
          >
            {(['upcoming', 'past'] as const).map((v) => (
              <Link
                key={v}
                href={hrefFor(v, category)}
                role="tab"
                aria-selected={view === v}
                scroll={false}
                className={`rounded-xl px-4 py-2 text-sm font-semibold transition-colors ${
                  view === v
                    ? 'bg-white text-ink shadow-sm'
                    : 'text-ink-soft hover:text-ink'
                }`}
              >
                {v === 'upcoming' ? 'Upcoming' : 'Past'}
              </Link>
            ))}
          </div>

          <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:px-0">
            <FilterChip href={hrefFor(view)} active={!category}>
              All
            </FilterChip>
            {CATEGORIES.map((c) => (
              <FilterChip key={c} href={hrefFor(view, c)} active={category === c}>
                {CATEGORY_LABEL[c]}
              </FilterChip>
            ))}
          </div>
        </div>

        {/* Grid */}
        <div className="mt-8">
          {events.length === 0 ? (
            <div className="glass mx-auto max-w-md rounded-3xl p-10 text-center">
              <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-indigo/10 text-indigo">
                <Icon name="calendar" className="h-6 w-6" />
              </span>
              <p className="mt-4 font-semibold text-ink">
                {view === 'upcoming'
                  ? 'No upcoming events here yet'
                  : 'No past events to show'}
              </p>
              <p className="mt-1 text-sm text-ink-soft">
                {view === 'upcoming'
                  ? 'New events are announced regularly. Check back soon.'
                  : 'Try another category.'}
              </p>
              {category && (
                <Link
                  href={hrefFor(view)}
                  className="mt-5 inline-flex text-sm font-semibold text-indigo hover:underline"
                >
                  Show all categories
                </Link>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {events.map((ev) => (
                <PublicEventCard key={ev.id} event={ev} />
              ))}
            </div>
          )}
        </div>

        {/* Account nudge */}
        <AccountBanner />
      </section>
    </>
  )
}

function FilterChip({
  href,
  active,
  children,
}: {
  href: string
  active: boolean
  children: React.ReactNode
}) {
  return (
    <Link
      href={href}
      scroll={false}
      aria-current={active ? 'true' : undefined}
      className={`shrink-0 rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors ${
        active
          ? 'border-indigo bg-indigo text-white'
          : 'border-black/10 bg-white/60 text-ink-soft hover:border-black/20 hover:text-ink'
      }`}
    >
      {children}
    </Link>
  )
}

function AccountBanner() {
  const perks = [
    { icon: 'certificate', text: 'Download verified certificates' },
    { icon: 'trophy', text: 'Earn points and climb the leaderboard' },
    { icon: 'bell', text: 'Get notified about new events first' },
  ]
  return (
    <div className="glass relative mt-16 overflow-hidden rounded-[28px] p-7 sm:p-10">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background:
            'radial-gradient(500px 260px at 0% 0%, rgba(122,108,255,0.14), transparent 70%), radial-gradient(500px 260px at 100% 100%, rgba(95,227,192,0.14), transparent 70%)',
        }}
      />
      <div className="grid gap-8 md:grid-cols-[1.2fr_1fr] md:items-center">
        <div>
          <h2 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">
            Make every event count
          </h2>
          <p className="mt-2 max-w-md text-ink-soft">
            Your registrations are saved against your student ID. Create your
            account any time and everything you&apos;ve attended moves in with you.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/signup"
              className="btn-primary inline-flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold"
            >
              Create your account
              <Icon name="arrow" className="h-4 w-4" />
            </Link>
            <Link
              href="/certificates"
              className="btn-ghost inline-flex items-center rounded-xl px-5 py-3 text-sm font-semibold"
            >
              Check my activity
            </Link>
          </div>
        </div>
        <ul className="space-y-3">
          {perks.map((p) => (
            <li key={p.text} className="flex items-center gap-3 text-sm font-medium">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-indigo/10 text-indigo">
                <Icon name={p.icon} className="h-[18px] w-[18px]" />
              </span>
              {p.text}
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
