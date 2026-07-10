'use client'

import Link from 'next/link'
import useSWR from 'swr'
import type { DashboardPayload } from '@/app/api/dashboard/route'
import { Card, SectionHeader, StatCard, Pill, EmptyState } from './ui'
import {
  dateChip,
  eventTime,
  relativeTime,
  yearLabel,
  CATEGORY_LABEL,
} from './format'
import Icon from '@/components/landing/Icon'

// Client dashboard overview. Renders the greeting + stat-tile shell instantly
// and fetches everything via SWR (cached, background-revalidated), so returning
// to the dashboard is instant instead of blocking on a fresh server render.

const fetcher = (url: string): Promise<DashboardPayload> =>
  fetch(url).then((r) => {
    if (!r.ok) throw new Error('Failed to load dashboard')
    return r.json()
  })

export default function DashboardView() {
  const { data } = useSWR<DashboardPayload>('/api/dashboard', fetcher, {
    keepPreviousData: true,
    dedupingInterval: 30_000,
  })

  const profile = data?.profile
  const rank = data?.rank ?? null
  const top3 = data?.top3 ?? []
  const openEvents = data?.openEvents ?? []
  const notifications = data?.notifications ?? []

  const firstName = profile?.name.split(' ')[0] ?? ''

  return (
    <div className="grid gap-5 xl:grid-cols-[1fr_20rem]">
      {/* ---- Main column ---- */}
      <div className="space-y-5 min-w-0">
        {/* Greeting — instant (name fills in when data lands). */}
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="font-display font-bold text-xl sm:text-2xl">
              Welcome back{firstName ? `, ${firstName}` : ''}!{' '}
              <span aria-hidden>👋</span>
            </h1>
            <p className="text-ink-soft mt-1 font-medium">
              Let&apos;s <span className="text-grad-rainbow">build,</span>{' '}
              <span className="text-grad-rainbow">innovate</span> and make an{' '}
              <span className="text-grad-rainbow">impact.</span>
            </p>
          </div>
        </div>

        {/* Stat tiles */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <StatCard
            icon="calendar"
            label="Events Joined"
            value={profile?.total_events ?? '—'}
            tint="lavender"
            art="area"
          />
          <StatCard
            icon="trophy"
            label="Points Earned"
            value={profile ? profile.total_points.toLocaleString() : '—'}
            tint="peach"
            art="points"
          />
          <StatCard
            icon="certificate"
            label="Certificates"
            value={profile?.total_certificates ?? '—'}
            tint="mint"
            art="certificate"
          />
          <StatCard
            icon="chart"
            label="Rank"
            value={rank ? `#${rank.me.rank}` : '—'}
            hint={rank && profile ? `in ${profile.department}` : undefined}
            tint="blue"
            art="podium"
          />
        </div>

        {/* Upcoming events */}
        <Card>
          <SectionHeader
            title="Upcoming Events"
            icon="calendar"
            href="/dashboard/events"
            tint="indigo"
          />
          {openEvents.length === 0 ? (
            <EmptyState
              icon="calendar"
              title="No open events right now"
              hint="Check back soon — new events open regularly."
            />
          ) : (
            <ul className="divide-y divide-black/5">
              {openEvents.slice(0, 5).map((ev) => {
                const chip = dateChip(ev.start_date)
                return (
                  <li key={ev.id}>
                    <Link
                      href={`/dashboard/events/${ev.id}`}
                      className="flex items-center gap-3 py-3 -mx-2 px-2 rounded-2xl hover:bg-white/60 transition-colors"
                    >
                      <span className="grid place-items-center w-12 h-12 rounded-2xl bg-indigo/10 text-indigo shrink-0">
                        <span className="font-display font-bold leading-none text-sm">
                          {chip.day}
                        </span>
                        <span className="text-[0.6rem] font-semibold">
                          {chip.mon}
                        </span>
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold truncate">{ev.title}</p>
                        <p className="text-sm text-muted truncate">
                          {eventTime(ev.start_date)}
                          {ev.venue ? ` · ${ev.venue}` : ''}
                        </p>
                      </div>
                      <Pill>{CATEGORY_LABEL[ev.category]}</Pill>
                    </Link>
                  </li>
                )
              })}
            </ul>
          )}
        </Card>
      </div>

      {/* ---- Side column ---- */}
      <aside className="space-y-5">
        {/* Leaderboard */}
        <Card>
          <SectionHeader
            title="Leaderboard"
            icon="trophy"
            href="/dashboard/leaderboard"
            tint="peach"
          />
          {top3.length === 0 ? (
            <EmptyState icon="trophy" title="No rankings yet" />
          ) : (
            <ul className="space-y-2">
              {top3.map((row) => (
                <li key={row.id}>
                  <Link
                    href={`/dashboard/profile/${row.id}`}
                    className="flex items-center gap-3 py-1.5 px-2 -mx-2 rounded-2xl hover:bg-white/60 transition-colors"
                  >
                    <span
                      className={`grid place-items-center w-7 h-7 rounded-full text-xs font-bold ${
                        row.rank === 1
                          ? 'bg-peach/25 text-peach'
                          : row.rank === 2
                            ? 'bg-blue/15 text-blue'
                            : 'bg-mint/20 text-mint'
                      }`}
                    >
                      {row.rank}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-sm truncate">{row.name}</p>
                      <p className="text-xs text-muted">
                        {row.department} · {yearLabel(row.year)}
                      </p>
                    </div>
                    <span className="text-sm font-semibold text-indigo shrink-0">
                      {row.total_points.toLocaleString()}
                      <span className="text-muted font-normal"> pts</span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
          {rank && (
            <div className="mt-3 pt-3 border-t border-black/5 flex items-center gap-3">
              <span className="grid place-items-center w-7 h-7 rounded-full bg-indigo/12 text-indigo text-xs font-bold">
                {rank.me.rank}
              </span>
              <p className="text-sm flex-1">
                You&apos;re ranked{' '}
                <span className="font-semibold">#{rank.me.rank}</span>
              </p>
              <span className="text-sm font-semibold text-indigo">
                {rank.me.total_points.toLocaleString()} pts
              </span>
            </div>
          )}
        </Card>

        {/* Notifications */}
        <Card>
          <SectionHeader title="Notifications" icon="bell" tint="mint" />
          {notifications.length === 0 ? (
            <EmptyState icon="bell" title="You're all caught up" />
          ) : (
            <ul className="space-y-3">
              {notifications.map((n) => (
                <li key={n.id} className="flex gap-3">
                  <span className="grid place-items-center w-8 h-8 rounded-xl bg-indigo/10 text-indigo shrink-0">
                    <Icon name="spark" className="w-4 h-4" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{n.title}</p>
                    <p className="text-xs text-muted line-clamp-2">
                      {n.message}
                    </p>
                    <p className="text-[0.7rem] text-muted mt-0.5">
                      {relativeTime(n.created_at)}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </aside>
    </div>
  )
}
