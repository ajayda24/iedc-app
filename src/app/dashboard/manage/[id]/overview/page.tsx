import Link from 'next/link'
import { notFound } from 'next/navigation'
import { requireStaff } from '@/lib/auth/queries'
import { getEvent, listEventRegistrations } from '@/lib/queries'
import { Card, EmptyState, StatCard } from '@/components/dashboard/ui'
import { fullDate, eventTime, REG_STATUS } from '@/components/dashboard/format'
import Icon from '@/components/landing/Icon'
import AttendanceControls from '@/components/dashboard/AttendanceControls'

export default async function EventRegistrationsPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  await requireStaff()
  const { id } = await params
  const [event, regs] = await Promise.all([
    getEvent(id),
    listEventRegistrations(id),
  ])
  if (!event) notFound()

  const active = regs.filter((r) => r.status !== 'cancelled')
  const attended = regs.filter((r) => r.status === 'attended').length
  const absent = regs.filter((r) => r.status === 'absent').length
  const cancelled = regs.length - active.length

  return (
    <div className="space-y-5">
      {/* Back + heading */}
      <div>
        <Link
          href="/dashboard/manage"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-muted hover:text-indigo transition-colors"
        >
          <Icon name="arrow" className="w-4 h-4 rotate-180" />
          Back to events
        </Link>
        <h1 className="font-display font-bold text-2xl sm:text-3xl mt-2">
          {event.title}
        </h1>
        <p className="text-ink-soft mt-1">
          {fullDate(event.start_date)} · {eventTime(event.start_date)}
          {event.venue ? ` · ${event.venue}` : ''}
        </p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard
          icon="team"
          label="Registered"
          value={active.length}
          tint="indigo"
        />
        <StatCard icon="check" label="Present" value={attended} tint="mint" />
        <StatCard icon="user" label="Absent" value={absent} tint="peach" />
        <StatCard
          icon="calendar"
          label="Cancelled"
          value={cancelled}
          tint="blue"
        />
      </div>

      {/* Registrant list */}
      <Card className="p-0 overflow-hidden">
        {regs.length === 0 ? (
          <EmptyState
            icon="team"
            title="No registrations yet"
            hint="Students who register will appear here."
          />
        ) : (
          <ul className="divide-y divide-black/5">
            {regs.map((r) => {
              const info = REG_STATUS[r.status]
              const name = r.profile?.name ?? 'Unknown student'
              const initials = name
                .split(' ')
                .filter(Boolean)
                .slice(0, 2)
                .map((w) => w[0]?.toUpperCase())
                .join('')
              return (
                <li
                  key={r.id}
                  className="flex flex-wrap items-center gap-3 px-4 sm:px-5 py-3.5"
                >
                  {/* Avatar */}
                  {r.profile?.avatar ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={r.profile.avatar}
                      alt=""
                      className="w-10 h-10 rounded-full object-cover shrink-0"
                    />
                  ) : (
                    <span className="grid place-items-center w-10 h-10 rounded-full bg-indigo/12 text-indigo text-sm font-semibold shrink-0">
                      {initials || '?'}
                    </span>
                  )}

                  {/* Name + meta */}
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold truncate">{name}</p>
                    <p className="text-sm text-muted truncate">
                      {r.profile?.student_id ?? '—'}
                      {r.profile?.department
                        ? ` · ${r.profile.department}`
                        : ''}
                      {` · ${info.label}`}
                    </p>
                  </div>

                  {/* Attendance controls */}
                  <div className="w-full sm:w-auto flex justify-end shrink-0">
                    <AttendanceControls
                      registrationId={r.id}
                      eventId={id}
                      status={r.status}
                    />
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </Card>
    </div>
  )
}
