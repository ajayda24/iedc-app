import Link from 'next/link'
import { requireStaff } from '@/lib/auth/queries'
import { listEvents, countRegistrationsByEvent } from '@/lib/queries'
import type { EventRow, EventStatus } from '@/lib/supabase/database.types'
import { Card, Pill, EmptyState } from '@/components/dashboard/ui'
import {
  dateChip,
  eventTime,
  CATEGORY_LABEL,
  EVENT_STATUS,
} from '@/components/dashboard/format'
import Icon from '@/components/landing/Icon'
import ManageEventActions from '@/components/dashboard/ManageEventActions'

const TABS: { key: EventStatus | 'all'; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'draft', label: 'Draft' },
  { key: 'published', label: 'Published' },
  { key: 'completed', label: 'Completed' },
  { key: 'cancelled', label: 'Cancelled' },
]

export default async function ManageEventsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>
}) {
  // Guard: coordinator + admin only. Both are is_staff(), so identical access.
  await requireStaff()

  const sp = await searchParams
  const activeTab = TABS.some((t) => t.key === sp.status)
    ? (sp.status as EventStatus | 'all')
    : 'all'

  // Staff see drafts too (RLS). Fetch all, then split by status in-memory.
  const all = await listEvents()
  const events =
    activeTab === 'all' ? all : all.filter((e) => e.status === activeTab)
  const counts = await countRegistrationsByEvent(events.map((e) => e.id))

  // Per-status counts for the tab labels.
  const byStatus = all.reduce<Record<string, number>>((acc, e) => {
    acc[e.status] = (acc[e.status] ?? 0) + 1
    return acc
  }, {})

  return (
    <div className="space-y-5">
      {/* Heading + create */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display font-bold text-2xl sm:text-3xl">
            Manage Events
          </h1>
          <p className="text-ink-soft mt-1">
            Create, publish and track events for your community.
          </p>
        </div>
        <Link
          href="/dashboard/manage/new"
          className="inline-flex items-center gap-2 rounded-2xl bg-indigo text-white text-sm font-semibold px-4 py-2.5 hover:bg-indigo/90 transition-colors"
        >
          <Icon name="plus" className="w-4 h-4" />
          New event
        </Link>
      </div>

      {/* Status tabs */}
      <div className="flex flex-wrap gap-2">
        {TABS.map((t) => {
          const active = activeTab === t.key
          const count = t.key === 'all' ? all.length : (byStatus[t.key] ?? 0)
          return (
            <Link
              key={t.key}
              href={
                t.key === 'all'
                  ? '/dashboard/manage'
                  : `/dashboard/manage?status=${t.key}`
              }
              className={`px-3.5 py-1.5 rounded-full text-sm font-medium transition-colors ${
                active
                  ? 'bg-indigo text-white'
                  : 'bg-white/60 text-ink-soft hover:bg-white'
              }`}
            >
              {t.label}
              <span className={active ? 'opacity-80' : 'text-muted'}>
                {' '}
                {count}
              </span>
            </Link>
          )
        })}
      </div>

      {/* List */}
      {events.length === 0 ? (
        <Card>
          <EmptyState
            icon="calendar"
            title="No events here yet"
            hint="Create your first event to get started."
          />
        </Card>
      ) : (
        <Card className="p-0 overflow-hidden">
          <ul className="divide-y divide-black/5">
            {events.map((ev) => (
              <ManageRow
                key={ev.id}
                event={ev}
                registered={counts[ev.id] ?? 0}
              />
            ))}
          </ul>
        </Card>
      )}
    </div>
  )
}

function ManageRow({
  event: ev,
  registered,
}: {
  event: EventRow
  registered: number
}) {
  const chip = dateChip(ev.start_date)
  const status = EVENT_STATUS[ev.status]
  const cap =
    ev.max_participants != null
      ? `${registered}/${ev.max_participants}`
      : `${registered}`

  return (
    <li className="flex flex-wrap items-center gap-3 px-4 sm:px-5 py-3.5">
      {/* Date chip */}
      <span className="grid place-items-center w-12 h-12 rounded-2xl bg-indigo/10 text-indigo shrink-0 leading-none">
        <span className="font-display font-bold text-sm">{chip.day}</span>
        <span className="text-[0.6rem] font-semibold">{chip.mon}</span>
      </span>

      {/* Title + meta */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 min-w-0">
          <p className="font-semibold truncate min-w-0">{ev.title}</p>
          <span className="shrink-0">
            <Pill tint={status.tint}>{status.label}</Pill>
          </span>
        </div>
        <p className="text-sm text-muted truncate">
          {CATEGORY_LABEL[ev.category]} · {eventTime(ev.start_date)}
          {ev.venue ? ` · ${ev.venue}` : ''}
        </p>
      </div>

      {/* Registrations */}
      <div className="flex items-center gap-1.5 text-sm text-ink-soft shrink-0">
        <Icon name="team" className="w-4 h-4 text-muted" />
        {cap}
      </div>

      {/* Actions — full width below the meta on mobile, inline on desktop */}
      <div className="w-full sm:w-auto flex justify-end min-w-0">
        <ManageEventActions
          eventId={ev.id}
          title={ev.title}
          status={ev.status}
        />
      </div>
    </li>
  )
}
