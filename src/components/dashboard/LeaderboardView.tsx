'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import useSWR from 'swr'
import type {
  MonthlyLeaderboardRow,
  Department,
} from '@/lib/supabase/database.types'
import type { LeaderboardPayload } from '@/app/api/leaderboard/route'
import { Card, SectionHeader, EmptyState } from './ui'
import { yearLabel } from './format'
import Icon from '@/components/landing/Icon'

// Client leaderboard. Renders the shell (heading, month chip, department filter)
// INSTANTLY on navigation, then fetches the board via SWR. SWR caches per key, so
// returning to this page shows the last data at once and revalidates in the
// background — no blank wait. `keepPreviousData` keeps the list visible while a
// re-fetch (e.g. after refocus) is in flight.

const DEPARTMENTS: Department[] = ['CS', 'IT', 'EC', 'EEE', 'ME', 'PT', 'EP']

const fetcher = (url: string): Promise<LeaderboardPayload> =>
  fetch(url).then((r) => {
    if (!r.ok) throw new Error('Failed to load leaderboard')
    return r.json()
  })

function rankTint(rank: number): string {
  if (rank === 1) return 'bg-peach/25 text-peach'
  if (rank === 2) return 'bg-blue/15 text-blue'
  if (rank === 3) return 'bg-mint/20 text-mint'
  return 'bg-indigo/12 text-indigo'
}

function monthLabel(key: string): string {
  const [y, m] = key.split('-').map(Number)
  return new Date(Date.UTC(y, m - 1, 1)).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  })
}

export default function LeaderboardView() {
  const searchParams = useSearchParams()
  const deptParam = searchParams.get('department')
  const department = DEPARTMENTS.includes(deptParam as Department)
    ? (deptParam as Department)
    : undefined

  // Cached, background-revalidated. dedupingInterval avoids refetching on quick
  // back-and-forth navigation; revalidateOnFocus refreshes when you return.
  const { data, isLoading } = useSWR<LeaderboardPayload>(
    '/api/leaderboard',
    fetcher,
    { keepPreviousData: true, dedupingInterval: 30_000 }
  )

  const month = data?.month ?? currentMonthKey()

  // Department filter applied client-side against the monthly board.
  const monthBoard = data?.board ?? []
  const board = department
    ? monthBoard.filter((r) => r.department === department)
    : monthBoard
  const ranked = board.map((row, i) => ({
    row,
    pos: department ? i + 1 : row.rank,
  }))

  const top3 = data?.top3 ?? []
  const rank = data?.rank ?? null
  const deptStats = data?.deptStats ?? []
  const yearStats = data?.yearStats ?? []

  return (
    <div className="">
      {/* ---- Main column ---- */}
      <div className="space-y-5 min-w-0">
        {/* Heading — renders instantly, no data needed. */}
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="font-display font-bold text-2xl sm:text-3xl">
              Leaderboard
            </h1>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo/12 text-indigo px-3 py-1 text-sm font-semibold">
              <Icon name="calendar" className="w-4 h-4" />
              {monthLabel(month)}
            </span>
          </div>
          <p className="text-ink-soft mt-1">
            Points reset each month — climb this month&apos;s board by joining
            events.
          </p>
        </div>

        {/* Podium (this month's top 3) */}
        {top3.length > 0 && <Podium rows={top3} />}

        {/* Department filter — instant. */}
        <DeptFilter active={department} />

        {/* Ranked list */}
        <div className="grid gap-5 xl:grid-cols-[1fr_20rem] items-start">
          <Card className="p-4!">
            <SectionHeader
              title={department ? `${department} — This Month` : 'This Month'}
              icon="trophy"
            />
            {isLoading && ranked.length === 0 ? (
              <ListSkeleton />
            ) : ranked.length === 0 ? (
              <EmptyState
                icon="trophy"
                title="No points earned yet this month"
                hint="Attend an event to get on the board."
              />
            ) : (
              <ul className="divide-y divide-black/5 flex flex-col gap-2">
                {ranked.map(({ row, pos }) => (
                  <Row
                    key={row.id}
                    row={row}
                    pos={pos}
                    isMe={row.id === rank?.me.id}
                  />
                ))}
              </ul>
            )}
          </Card>

          {/* ---- Side column ---- */}
          <aside className="space-y-5">
            {rank && (
              <Card>
                <SectionHeader title="Your Rank" icon="chart" />
                <ul className="space-y-1">
                  {rank.around.map((row) => (
                    <li
                      key={row.id}
                      className={`flex items-center gap-3 py-2 px-2 -mx-2 rounded-2xl ${
                        row.id === rank.me.id ? 'bg-indigo/10' : ''
                      }`}
                    >
                      <span
                        className={`grid place-items-center w-7 h-7 rounded-full text-xs font-bold shrink-0 ${rankTint(
                          row.rank
                        )}`}
                      >
                        {row.rank}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-sm truncate">
                          {row.id === rank.me.id ? 'You' : row.name}
                        </p>
                        <p className="text-xs text-muted">
                          {row.department} · {yearLabel(row.year)}
                        </p>
                      </div>
                      <span className="text-sm font-semibold text-indigo shrink-0">
                        {row.month_points.toLocaleString()}
                      </span>
                    </li>
                  ))}
                </ul>
              </Card>
            )}

            {/* Department stats */}
            <Card>
              <SectionHeader title="By Department" icon="team" />
              {deptStats.length === 0 ? (
                <EmptyState icon="team" title="No data yet" />
              ) : (
                <ul className="space-y-2">
                  {deptStats.map((d) => (
                    <StatBar
                      key={d.department}
                      label={d.department}
                      value={d.total_points}
                      max={deptStats[0].total_points}
                      hint={`${d.student_count} students`}
                    />
                  ))}
                </ul>
              )}
            </Card>

            {/* Year stats */}
            <Card>
              <SectionHeader title="By Year" icon="chart" />
              {yearStats.length === 0 ? (
                <EmptyState icon="chart" title="No data yet" />
              ) : (
                <ul className="space-y-2">
                  {[...yearStats]
                    .sort((a, b) => b.total_points - a.total_points)
                    .map((y, _, arr) => (
                      <StatBar
                        key={y.year}
                        label={yearLabel(y.year)}
                        value={y.total_points}
                        max={arr[0].total_points}
                        hint={`${y.student_count} students`}
                      />
                    ))}
                </ul>
              )}
            </Card>
          </aside>
        </div>
      </div>
    </div>
  )
}

// Current month key (YYYY-MM-01) — used only for the header label before data
// loads; the real value comes from the API payload.
function currentMonthKey(): string {
  const d = new Date()
  const y = d.getUTCFullYear()
  const m = String(d.getUTCMonth() + 1).padStart(2, '0')
  return `${y}-${m}-01`
}

// A few shimmer rows while the board loads for the first time.
function ListSkeleton() {
  return (
    <ul className="flex flex-col gap-2">
      {Array.from({ length: 6 }).map((_, i) => (
        <li key={i} className="flex items-center gap-3 py-3 px-2">
          <span className="w-8 h-8 rounded-full bg-black/5 animate-pulse" />
          <span className="w-9 h-9 rounded-full bg-black/5 animate-pulse" />
          <div className="flex-1 space-y-1.5">
            <div className="h-3.5 w-40 rounded bg-black/5 animate-pulse" />
            <div className="h-3 w-28 rounded bg-black/5 animate-pulse" />
          </div>
          <div className="h-4 w-12 rounded bg-black/5 animate-pulse" />
        </li>
      ))}
    </ul>
  )
}

// ---------------------------------------------------------------------------

const ORDINAL = { 1: 'st', 2: 'nd', 3: 'rd' } as const

const PODIUM_STYLE = {
  1: {
    laurel: 'text-peach',
    ring: 'from-peach/60 to-peach/20',
    card: 'from-peach/20 via-white/40 to-white/10 border-peach/40',
    avatar: 'w-24 h-24 sm:w-28 sm:h-28',
    lift: '-mt-6 sm:-mt-8',
    pad: 'pt-1 pb-1',
  },
  2: {
    laurel: 'text-blue',
    ring: 'from-blue/50 to-blue/15',
    card: 'from-blue/15 via-white/40 to-white/10 border-blue/30',
    avatar: 'w-20 h-20 sm:w-24 sm:h-24',
    lift: 'mt-4 sm:mt-6',
    pad: 'pt-1 pb-1',
  },
  3: {
    laurel: 'text-mint',
    ring: 'from-mint/50 to-mint/15',
    card: 'from-mint/15 via-white/40 to-white/10 border-mint/30',
    avatar: 'w-20 h-20 sm:w-24 sm:h-24',
    lift: 'mt-4 sm:mt-6',
    pad: 'pt-1 pb-1',
  },
} as const

function LaurelBadge({
  rank,
  className = '',
}: {
  rank: number
  className?: string
}) {
  return (
    <span
      className={`relative inline-grid place-items-center ${className}`}
      aria-label={`Rank ${rank}`}
    >
      <svg
        viewBox="0 0 64 64"
        className="w-16 h-16 sm:w-20 sm:h-20"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      >
        <path d="M24 54c-9-3-14-11-14-22 0-6 2-11 5-15" />
        <path d="M40 54c9-3 14-11 14-22 0-6-2-11-5-15" />
        <path d="M14 24c-3-1-5 0-6 3 3 1 5 0 6-3ZM12 33c-3 0-5 1-5 4 3 0 5-1 5-4ZM14 42c-3 1-4 3-3 6 3-1 4-3 3-6ZM18 49c-2 2-2 4 0 6 2-2 2-4 0-6Z" />
        <path d="M50 24c3-1 5 0 6 3-3 1-5 0-6-3ZM52 33c3 0 5 1 5 4-3 0-5-1-5-4ZM50 42c3 1 4 3 3 6-3-1-4-3-3-6ZM46 49c2 2 2 4 0 6-2-2-2-4 0-6Z" />
      </svg>
      <span className="absolute font-display font-bold text-base sm:text-lg leading-none">
        {rank}
        <span className="text-[0.6em] align-super">
          {ORDINAL[rank as 1 | 2 | 3]}
        </span>
      </span>
    </span>
  )
}

function PodiumCard({ row }: { row: MonthlyLeaderboardRow }) {
  const s = PODIUM_STYLE[row.rank as 1 | 2 | 3] ?? PODIUM_STYLE[3]
  return (
    <Link
      href={`/dashboard/profile/${row.id}`}
      className={` rounded-3xl ${s.card} ${s.lift} ${s.pad} px-2 sm:px-3 flex flex-col items-center text-center min-w-0 transition-transform hover:-translate-y-0.5`}
    >
      <LaurelBadge rank={row.rank} className={s.laurel} />

      <div
        className={`mt-2 rounded-full p-0.75 bg-linear-to-b ${s.ring} ${s.avatar}`}
      >
        {row.avatar ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={row.avatar}
            alt=""
            className="w-full h-full rounded-full object-cover bg-white"
          />
        ) : (
          <span className="w-full h-full grid place-items-center rounded-full bg-white/80 text-muted">
            <Icon name="team" className="w-8 h-8" />
          </span>
        )}
      </div>

      <p className="text-xs text-muted truncate max-w-full">
        {row.department} · {yearLabel(row.year)}
      </p>
      <p className="mt-1.5 flex items-center gap-1.5 font-display font-bold text-lg text-indigo">
        {row.month_points.toLocaleString()}
      </p>
    </Link>
  )
}

function Podium({ rows }: { rows: MonthlyLeaderboardRow[] }) {
  const byRank = new Map(rows.map((r) => [r.rank, r]))
  const order = [byRank.get(2), byRank.get(1), byRank.get(3)]
    .filter((r): r is MonthlyLeaderboardRow => Boolean(r))
    .filter((r) => r.month_points > 0)
  return (
    <div className="max-w-sm w-full mx-auto flex gap-2 sm:gap-4 items-center justify-center pt-2">
      {order.map((row) => (
        <PodiumCard key={row.id} row={row} />
      ))}
    </div>
  )
}

function Row({
  row,
  pos,
  isMe,
}: {
  row: MonthlyLeaderboardRow
  pos: number
  isMe: boolean
}) {
  return (
    <li>
      <Link
        href={`/dashboard/profile/${row.id}`}
        className={`flex flex-wrap items-center gap-3 py-3 px-2 -mx-2 rounded-2xl transition-colors hover:bg-white/60 ${
          isMe ? 'bg-indigo/10' : ''
        }`}
      >
        <span
          className={`grid place-items-center w-8 h-8 rounded-full text-sm font-bold shrink-0 ${rankTint(
            pos
          )}`}
        >
          {pos}
        </span>
        {row.avatar ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={row.avatar}
            alt=""
            className="w-9 h-9 rounded-full object-cover shrink-0"
          />
        ) : (
          <span className="grid place-items-center w-9 h-9 rounded-full bg-black/5 text-muted shrink-0">
            <Icon name="team" className="w-4 h-4" />
          </span>
        )}
        <div className="min-w-0 flex-1">
          <p className="font-semibold truncate">
            {row.name}
            {isMe && (
              <span className="text-indigo text-sm font-medium"> · You</span>
            )}
          </p>
          <p className="text-sm text-muted">
            {yearLabel(row.year)} · {row.department} · {row.month_events} events
          </p>
        </div>
        <span className="text-sm font-semibold text-indigo shrink-0">
          {row.month_points.toLocaleString()}
          <span className="text-muted font-normal"> pts</span>
        </span>
      </Link>
    </li>
  )
}

function StatBar({
  label,
  value,
  max,
  hint,
}: {
  label: string
  value: number
  max: number
  hint?: string
}) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0
  return (
    <li>
      <div className="flex items-center justify-between text-sm mb-1">
        <span className="font-medium">{label}</span>
        <span className="text-muted">{value.toLocaleString()}</span>
      </div>
      <div className="h-2 rounded-full bg-black/5 overflow-hidden">
        <div
          className="h-full rounded-full bg-indigo/70"
          style={{ width: `${pct}%` }}
        />
      </div>
      {hint && <p className="text-xs text-muted mt-0.5">{hint}</p>}
    </li>
  )
}

function DeptFilter({ active }: { active?: Department }) {
  const items: { key: string; label: string }[] = [
    { key: '', label: 'Overall' },
    ...DEPARTMENTS.map((d) => ({ key: d, label: d })),
  ]
  return (
    <div className="flex flex-nowrap sm:flex-wrap gap-2 overflow-x-auto sm:overflow-visible no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0">
      {items.map((item) => {
        const isActive = (active ?? '') === item.key
        const href = item.key
          ? `/dashboard/leaderboard?department=${item.key}`
          : '/dashboard/leaderboard'
        return (
          <Link
            key={item.key || 'all'}
            href={href}
            className={`shrink-0 px-3.5 py-1.5 rounded-full text-sm font-medium transition-colors ${
              isActive
                ? 'bg-indigo text-white'
                : 'bg-white/60 text-ink-soft hover:bg-white'
            }`}
          >
            {item.label}
          </Link>
        )
      })}
    </div>
  )
}
