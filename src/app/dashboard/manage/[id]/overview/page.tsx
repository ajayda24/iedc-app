import Link from 'next/link'
import { notFound } from 'next/navigation'
import { requireStaff } from '@/lib/auth/queries'
import {
  getEvent,
  listEventRegistrations,
  certificatesForEvent,
} from '@/lib/queries'
import { Card, EmptyState, StatCard, Pill } from '@/components/dashboard/ui'
import { fullDate, eventTime, REG_STATUS } from '@/components/dashboard/format'
import type { CertificateType } from '@/lib/supabase/database.types'
import Icon from '@/components/landing/Icon'
import AttendanceControls from '@/components/dashboard/AttendanceControls'
import IssueCertificateControls from '@/components/dashboard/IssueCertificateControls'
import IssueAllCertificatesButton from '@/components/dashboard/IssueAllCertificatesButton'
import EventOverviewActions from '@/components/dashboard/EventOverviewActions'

export default async function EventOverviewPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  await requireStaff()
  const { id } = await params
  const [event, regs, certs] = await Promise.all([
    getEvent(id),
    listEventRegistrations(id),
    certificatesForEvent(id),
  ])
  if (!event) notFound()

  const active = regs.filter((r) => r.status !== 'cancelled')
  const attended = regs.filter((r) => r.status === 'attended').length
  const absent = regs.filter((r) => r.status === 'absent').length
  const cancelled = regs.length - active.length

  // Certificate issuance is available only once the event is completed, and
  // only for attendees. Map profile_id -> its certificate for quick lookup.
  const canIssue = event.status === 'completed'
  const certByProfile = new Map<
    string,
    { id: string; type: CertificateType; serial: string }
  >()
  for (const c of certs) {
    certByProfile.set(c.profile_id, {
      id: c.id,
      type: c.certificate_type,
      serial: c.serial,
    })
  }
  // Attendees still missing a certificate — drives the bulk-issue button.
  const pendingCerts = regs.filter(
    (r) => r.status === 'attended' && !certByProfile.has(r.profile_id)
  ).length

  return (
    <div className="space-y-5">
      {/* Back + heading + edit/delete shortcuts */}
      <div>
        <Link
          href="/dashboard/manage"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-muted hover:text-indigo transition-colors"
        >
          <Icon name="arrow" className="w-4 h-4 rotate-180" />
          Back to events
        </Link>
        <div className="flex flex-wrap items-start justify-between gap-3 mt-2">
          <div className="min-w-0">
            <h1 className="font-display font-bold text-2xl sm:text-3xl">
              {event.title}
            </h1>
            <p className="text-ink-soft mt-1">
              {fullDate(event.start_date)} · {eventTime(event.start_date)}
              {event.venue ? ` · ${event.venue}` : ''}
            </p>
          </div>
          <EventOverviewActions eventId={id} title={event.title} />
        </div>
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

      {/* Certificate issuance */}
      <Card className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h2 className="flex items-center gap-2 font-display font-semibold">
            <Icon name="certificate" className="w-5 h-5 text-indigo" />
            Certificates
          </h2>
          <p className="text-sm text-muted mt-0.5">
            {canIssue
              ? `${certs.length} issued · participation is auto-issued when a student is marked Present.`
              : 'Mark the event as completed to issue certificates to attendees.'}
          </p>
        </div>
        {canIssue ? (
          <IssueAllCertificatesButton eventId={id} pendingCount={pendingCerts} />
        ) : (
          <Pill tint="muted">Event not completed</Pill>
        )}
      </Card>

      {/* Scores / marks entry */}
      <Card className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h2 className="flex items-center gap-2 font-display font-semibold">
            <Icon name="spark" className="w-5 h-5 text-indigo" />
            Scores &amp; winners
          </h2>
          <p className="text-sm text-muted mt-0.5">
            Enter marks and rank attendees to identify the winner.
          </p>
        </div>
        <Link
          href={`/dashboard/manage/${id}/overview/scores`}
          className="inline-flex items-center gap-2 rounded-2xl bg-indigo text-white text-sm font-semibold px-4 py-2.5 hover:bg-indigo/90 transition-colors shrink-0"
        >
          <Icon name="edit" className="w-4 h-4" />
          Enter marks
        </Link>
      </Card>

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

                  {/* Attendance + certificate controls */}
                  <div className="w-full sm:w-auto flex flex-wrap items-center justify-end gap-3 shrink-0">
                    <AttendanceControls
                      registrationId={r.id}
                      eventId={id}
                      status={r.status}
                    />
                    {/* Certificate control: only for attendees of a completed
                        event. Shows an "Issue" picker, or the issued badge. */}
                    {canIssue && r.status === 'attended' && (
                      <IssueCertificateControls
                        eventId={id}
                        profileId={r.profile_id}
                        existing={certByProfile.get(r.profile_id) ?? null}
                      />
                    )}
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
