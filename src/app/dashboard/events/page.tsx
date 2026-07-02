import Link from 'next/link'
import {
  listEvents,
  listMyRegistrations,
  countRegistrationsByEvent,
} from '@/lib/queries'
import type {
  EventRow,
  EventCategory,
  RegistrationStatus,
} from '@/lib/supabase/database.types'
import { Card, Pill, EmptyState } from '@/components/dashboard/ui'
import { dateChip, eventTime, CATEGORY_LABEL } from '@/components/dashboard/format'
import Icon from '@/components/landing/Icon'
import EventRegisterButton from '@/components/dashboard/EventRegisterButton'
import { regStateFor } from '@/lib/events/reg-state'

// Time filters shown as chips. Map to listEvents options + client-side splits.
const TIME_FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'open', label: 'Open' },
  { key: 'upcoming', label: 'Upcoming' },
  { key: 'past', label: 'Past' },
  { key: 'mine', label: 'My Events' },
] as const
type TimeFilter = (typeof TIME_FILTERS)[number]['key']

const CATEGORIES = Object.keys(CATEGORY_LABEL) as EventCategory[]

export default async function EventsPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; filter?: string }>
}) {
  const sp = await searchParams
  const category = CATEGORIES.includes(sp.category as EventCategory)
    ? (sp.category as EventCategory)
    : undefined
  // Default to "Open" when no filter is specified.
  const filter: TimeFilter = TIME_FILTERS.some((f) => f.key === sp.filter)
    ? (sp.filter as TimeFilter)
    : 'open'

  // Fetch the (RLS-scoped) event list + the user's registrations in parallel.
  const [events, myRegs] = await Promise.all([
    listEvents({
      category,
      upcomingOnly: filter === 'upcoming' || filter === 'open',
    }),
    listMyRegistrations(),
  ])

  // event id -> the user's current registration status (active or cancelled).
  const myStatus = new Map<string, RegistrationStatus>()
  for (const r of myRegs) myStatus.set(r.event_id, r.status)

  // "My Events" = events the user holds an active (non-cancelled) spot for.
  const myActiveIds = new Set(
    myRegs.filter((r) => r.status !== 'cancelled').map((r) => r.event_id)
  )

  // Latest first (listEvents returns ascending by start_date).
  const filtered = (
    filter === 'mine'
      ? events.filter((e) => myActiveIds.has(e.id))
      : applyTimeFilter(events, filter)
  ).sort(
    (a, b) =>
      new Date(b.start_date).getTime() - new Date(a.start_date).getTime()
  )
  const counts = await countRegistrationsByEvent(filtered.map((e) => e.id))

  return (
    <div className="space-y-5">
      {/* Heading */}
      <div>
        <h1 className="font-display font-bold text-2xl sm:text-3xl">Events</h1>
        <p className="text-ink-soft mt-1">
          Discover workshops, hackathons and talks — register in one tap.
        </p>
      </div>

      {/* Filters */}
      <div className="space-y-3">
        <FilterRow
          items={TIME_FILTERS.map((f) => ({ key: f.key, label: f.label }))}
          activeKey={filter}
          param="filter"
          otherParam={['category', category]}
        />
        <FilterRow
          items={[
            { key: '', label: 'All types' },
            ...CATEGORIES.map((c) => ({ key: c, label: CATEGORY_LABEL[c] })),
          ]}
          activeKey={category ?? ''}
          param="category"
          otherParam={['filter', filter === 'open' ? undefined : filter]}
        />
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <Card>
          {filter === 'mine' ? (
            <EmptyState
              icon="calendar"
              title="You haven't registered for any events yet"
              hint="Browse Open events and register in one tap."
            />
          ) : (
            <EmptyState
              icon="calendar"
              title="No events match these filters"
              hint="Try clearing the filters or check back soon."
            />
          )}
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((ev) => (
            <EventCard
              key={ev.id}
              event={ev}
              registered={counts[ev.id] ?? 0}
              myStatus={myStatus.get(ev.id)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------

function EventCard({
  event: ev,
  registered,
  myStatus,
}: {
  event: EventRow
  registered: number
  myStatus?: RegistrationStatus
}) {
  const chip = dateChip(ev.start_date)
  const spotsLeft =
    ev.max_participants != null ? ev.max_participants - registered : null
  const state = regStateFor(ev, myStatus, spotsLeft)

  return (
    <div className="group glass rounded-3xl overflow-hidden flex flex-col">
      {/* Banner + info link to the detail page */}
      <Link
        href={`/dashboard/events/${ev.id}`}
        className="flex flex-col flex-1 outline-none"
      >
        <div className="relative h-32 bg-gradient-to-br from-indigo/25 to-blue/20">
          {ev.banner && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={ev.banner}
              alt=""
              className="absolute inset-0 w-full h-full object-cover"
            />
          )}
          <div className="absolute top-3 left-3">
            <Pill>{CATEGORY_LABEL[ev.category]}</Pill>
          </div>
          <div className="absolute top-3 right-3 grid place-items-center w-12 h-12 rounded-2xl bg-white/90 text-indigo shadow-sm">
            <span className="font-display font-bold leading-none text-sm">
              {chip.day}
            </span>
            <span className="text-[0.6rem] font-semibold">{chip.mon}</span>
          </div>
        </div>

        <div className="p-4 flex-1 space-y-2">
          <h3 className="font-display font-semibold leading-snug line-clamp-2 group-hover:text-indigo transition-colors">
            {ev.title}
          </h3>

          <div className="space-y-1 text-sm text-muted">
            <p className="flex items-center gap-1.5">
              <Icon name="calendar" className="w-4 h-4 shrink-0" />
              {eventTime(ev.start_date)}
              {ev.venue ? ` · ${ev.venue}` : ''}
            </p>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              {ev.points > 0 && (
                <span className="flex items-center gap-1.5">
                  <Icon name="spark" className="w-4 h-4 text-peach shrink-0" />
                  {ev.points} pts
                </span>
              )}
              {ev.benefit_certificate && (
                <span className="flex items-center gap-1.5">
                  <Icon
                    name="certificate"
                    className="w-4 h-4 text-mint shrink-0"
                  />
                  Certificate
                </span>
              )}
              {spotsLeft != null && (
                <span
                  className={spotsLeft <= 0 ? 'text-peach font-medium' : ''}
                >
                  {spotsLeft > 0 ? `${spotsLeft} spots left` : 'Full'}
                </span>
              )}
            </div>
          </div>
        </div>
      </Link>

      {/* Actions (outside the link so the button stays independently clickable) */}
      <div className="px-4 pb-4">
        <EventRegisterButton eventId={ev.id} state={state} />
      </div>
    </div>
  )
}

// A row of filter chips, each a Link that preserves the other active filter.
function FilterRow({
  items,
  activeKey,
  param,
  otherParam,
}: {
  items: { key: string; label: string }[]
  activeKey: string
  param: string
  otherParam: [string, string | undefined]
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item) => {
        const params = new URLSearchParams()
        if (item.key) params.set(param, item.key)
        const [oname, oval] = otherParam
        if (oval) params.set(oname, oval)
        const qs = params.toString()
        const active = activeKey === item.key
        return (
          <Link
            key={item.key || 'all'}
            href={qs ? `/dashboard/events?${qs}` : '/dashboard/events'}
            className={`px-3.5 py-1.5 rounded-full text-sm font-medium transition-colors ${
              active
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

// ---------------------------------------------------------------------------

// Split events by time relative to now (used for the "upcoming"/"past" chips).
// listEvents already applies `upcomingOnly` for open/upcoming server-side; the
// "past" case is derived here since the query helper has no "pastOnly".
function applyTimeFilter(events: EventRow[], filter: TimeFilter): EventRow[] {
  const now = Date.now()
  if (filter === 'past') {
    return events.filter((e) => new Date(e.start_date).getTime() < now)
  }
  if (filter === 'open') {
    return events.filter(
      (e) =>
        e.status === 'published' &&
        (!e.registration_deadline ||
          new Date(e.registration_deadline).getTime() >= now)
    )
  }
  return events
}
