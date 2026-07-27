'use client'

import Link from 'next/link'
import useSWR from 'swr'
import Icon from './Icon'
import { dateChip, eventTime } from '@/components/dashboard/format'
import { CATEGORY_LABEL } from '@/components/dashboard/format'
import type { PublicEvent } from '@/app/api/public/upcoming-events/route'

// Landing-page section showing the next few published events. Public — fetches
// the /api/public/upcoming-events feed (no auth) via SWR. Dates render in the
// app timezone through the shared format helpers, so they match the dashboard.

const fetcher = (url: string): Promise<{ events: PublicEvent[] }> =>
  fetch(url).then((r) => {
    if (!r.ok) throw new Error('Failed to load events')
    return r.json()
  })

export default function UpcomingEvents() {
  const { data, isLoading } = useSWR('/api/public/upcoming-events', fetcher, {
    dedupingInterval: 60_000,
  })
  const events = data?.events ?? []

  return (
    <section
      id="events"
      data-station
      className="relative flex min-h-screen items-center py-24"
    >
      <div className="mx-auto w-full max-w-6xl px-5 sm:px-8">
        <div className="reveal mx-auto max-w-2xl text-center">
          <p className="eyebrow">What&apos;s Next</p>
          <h2
            className="mt-3 text-4xl font-bold tracking-tight sm:text-5xl"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            Upcoming <span className="text-grad">events</span>
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-ink-soft">
            Workshops, hackathons and talks on the horizon. Sign in to register
            in one tap.
          </p>
        </div>

        <div className="reveal mt-12">
          {isLoading ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div
                  key={i}
                  className="glass h-48 animate-pulse rounded-3xl"
                />
              ))}
            </div>
          ) : events.length === 0 ? (
            <div className="glass mx-auto max-w-md rounded-3xl p-8 text-center">
              <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-indigo/10 text-indigo">
                <Icon name="calendar" className="h-6 w-6" />
              </span>
              <p className="mt-4 font-semibold text-ink">
                No upcoming events right now
              </p>
              <p className="mt-1 text-sm text-ink-soft">
                Check back soon — new events are added regularly.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {events.map((ev) => (
                <EventCard key={ev.id} event={ev} />
              ))}
            </div>
          )}
        </div>

        {events.length > 0 && (
          <div className="reveal mt-8 text-center">
            <Link
              href="/dashboard/events"
              className="btn-ghost inline-flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold"
            >
              View all events
              <Icon name="arrow" className="h-4 w-4" />
            </Link>
          </div>
        )}
      </div>
    </section>
  )
}

function EventCard({ event: ev }: { event: PublicEvent }) {
  const chip = dateChip(ev.start_date)
  return (
    <Link
      href="/dashboard/events"
      className="group glass flex flex-col overflow-hidden rounded-3xl transition-transform duration-300 hover:-translate-y-1.5"
    >
      <div className="relative h-28 bg-gradient-to-br from-indigo/25 to-blue/20">
        {ev.banner && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={ev.banner}
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
          />
        )}
        <div className="absolute left-3 top-3 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-indigo shadow-sm">
          {CATEGORY_LABEL[ev.category]}
        </div>
        <div className="absolute right-3 top-3 grid h-12 w-12 place-items-center rounded-2xl bg-white/90 text-indigo shadow-sm">
          <span
            className="text-sm font-bold leading-none"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            {chip.day}
          </span>
          <span className="text-[0.6rem] font-semibold">{chip.mon}</span>
        </div>
      </div>
      <div className="flex-1 space-y-2 p-4">
        <h3 className="font-semibold leading-snug text-ink transition-colors group-hover:text-indigo line-clamp-2">
          {ev.title}
        </h3>
        <p className="flex items-center gap-1.5 text-sm text-ink-soft">
          <Icon name="calendar" className="h-4 w-4 shrink-0" />
          {eventTime(ev.start_date)}
          {ev.venue ? ` · ${ev.venue}` : ''}
        </p>
        {ev.points > 0 && (
          <p className="flex items-center gap-1.5 text-sm text-ink-soft">
            <Icon name="spark" className="h-4 w-4 shrink-0 text-peach" />
            {ev.points} pts
          </p>
        )}
      </div>
    </Link>
  )
}
