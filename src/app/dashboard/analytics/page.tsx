import Link from 'next/link'
import { requireStaff } from '@/lib/auth/queries'
import {
  getAnalytics,
  getDepartmentStats,
  getYearStats,
  getLeaderboard,
} from '@/lib/queries'
import { Card, StatCard, SectionHeader, Pill } from '@/components/dashboard/ui'
import {
  CATEGORY_LABEL,
  EVENT_STATUS,
  yearLabel,
  fullDate,
} from '@/components/dashboard/format'
import BarList from '@/components/dashboard/charts/BarList'
import Columns from '@/components/dashboard/charts/Columns'
import SegmentedBar from '@/components/dashboard/charts/SegmentedBar'

const CERT_LABEL: Record<string, string> = {
  participation: 'Participation',
  winner: 'Winner',
  runnerup: 'Runner-up',
  volunteer: 'Volunteer',
}

// "2026-07" -> "Jul" (+ year on January for context across a year boundary).
function monthTick(ym: string): string {
  const [y, m] = ym.split('-').map(Number)
  const d = new Date(y, m - 1, 1)
  const mon = d.toLocaleString('en-US', { month: 'short' })
  return m === 1 ? `${mon} ’${String(y).slice(2)}` : mon
}

export default async function AnalyticsPage() {
  // Gate + data in parallel so the staff auth hop doesn't block the queries.
  const [, data, deptStats, yearStats, leaders] = await Promise.all([
    requireStaff(),
    getAnalytics(12),
    getDepartmentStats(),
    getYearStats(),
    getLeaderboard(8),
  ])

  const { kpis, months, categories, topEvents, certTypes } = data
  const attendancePct = Math.round(kpis.attendanceRate * 100)

  return (
    <div className="space-y-5">
      {/* Heading */}
      <div>
        <h1 className="font-display font-bold text-2xl sm:text-3xl">Analytics</h1>
        <p className="text-ink-soft mt-1">
          Community engagement across events, departments and students.
        </p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard
          icon="calendar"
          label="Events"
          value={kpis.totalEvents}
          hint={`${kpis.eventsByStatus.completed} completed`}
          tint="indigo"
        />
        <StatCard
          icon="team"
          label="Registrations"
          value={kpis.totalRegistrations}
          tint="blue"
        />
        <StatCard
          icon="check"
          label="Attendance"
          value={`${attendancePct}%`}
          hint={`${kpis.totalAttended} attended`}
          tint="mint"
        />
        <StatCard
          icon="certificate"
          label="Certificates"
          value={kpis.totalCertificates}
          tint="peach"
        />
      </div>

      {/* Event status + student breakdown as compact secondary row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard
          icon="user"
          label="Active students"
          value={kpis.activeStudents}
          hint={`${kpis.totalStudents} total`}
          tint="indigo"
        />
        <StatCard
          icon="edit"
          label="Draft events"
          value={kpis.eventsByStatus.draft}
          tint="blue"
        />
        <StatCard
          icon="rocket"
          label="Published"
          value={kpis.eventsByStatus.published}
          tint="mint"
        />
        <StatCard
          icon="trash"
          label="Cancelled"
          value={kpis.eventsByStatus.cancelled}
          tint="peach"
        />
      </div>

      {/* Trends over time */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <SectionHeader title="Events per month" icon="calendar" />
          <Columns
            points={months.map((m) => ({
              label: monthTick(m.month),
              value: m.events,
            }))}
          />
        </Card>
        <Card>
          <SectionHeader title="Registrations & attendance" icon="team" />
          <Columns
            primaryLabel="Registered"
            overlayLabel="Attended"
            points={months.map((m) => ({
              label: monthTick(m.month),
              value: m.registrations,
              overlay: m.attended,
            }))}
          />
        </Card>
      </div>

      {/* Department + year breakdowns */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <SectionHeader title="Points by department" icon="chart" />
          <BarList
            items={deptStats.map((d) => ({
              label: d.department,
              value: d.total_points,
              sub: `${d.student_count} student${d.student_count === 1 ? '' : 's'}`,
            }))}
            emptyLabel="No student activity yet."
          />
        </Card>
        <Card>
          <SectionHeader title="Points by year" icon="chart" />
          <BarList
            items={yearStats.map((y) => ({
              label: yearLabel(y.year),
              value: y.total_points,
              sub: `${y.student_count} student${y.student_count === 1 ? '' : 's'}`,
            }))}
            emptyLabel="No student activity yet."
          />
        </Card>
      </div>

      {/* Category + certificates */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <SectionHeader title="Events by category" icon="grid" />
          <BarList
            items={categories.map((c) => ({
              label: CATEGORY_LABEL[c.category],
              value: c.events,
              sub: `${c.registrations} reg`,
            }))}
            emptyLabel="No events yet."
          />
        </Card>
        <Card>
          <SectionHeader title="Certificates by type" icon="certificate" />
          <SegmentedBar
            segments={certTypes.map((c) => ({
              label: CERT_LABEL[c.type],
              value: c.count,
            }))}
          />
        </Card>
      </div>

      {/* Top events */}
      <Card>
        <SectionHeader title="Top events by attendance" icon="flame" />
        {topEvents.length === 0 ? (
          <p className="text-sm text-muted">No events yet.</p>
        ) : (
          <div className="overflow-x-auto -mx-1">
            <table className="w-full text-sm min-w-[32rem]">
              <thead>
                <tr className="text-left text-xs text-muted border-b border-black/5">
                  <th className="font-semibold px-1 py-2">Event</th>
                  <th className="font-semibold px-1 py-2">Category</th>
                  <th className="font-semibold px-1 py-2 text-right">Reg.</th>
                  <th className="font-semibold px-1 py-2 text-right">Attended</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5">
                {topEvents.map((e) => (
                  <tr key={e.id} className="hover:bg-white/40 transition-colors">
                    <td className="px-1 py-2.5">
                      <Link
                        href={`/dashboard/manage/${e.id}/overview`}
                        className="font-medium text-ink-soft hover:text-indigo transition-colors"
                      >
                        {e.title}
                      </Link>
                      <div className="text-xs text-muted">
                        {fullDate(e.start_date)} ·{' '}
                        <span className="inline-flex align-middle">
                          <Pill tint={EVENT_STATUS[e.status].tint}>
                            {EVENT_STATUS[e.status].label}
                          </Pill>
                        </span>
                      </div>
                    </td>
                    <td className="px-1 py-2.5 text-muted">
                      {CATEGORY_LABEL[e.category]}
                    </td>
                    <td className="px-1 py-2.5 text-right tabular-nums">
                      {e.registrations}
                    </td>
                    <td className="px-1 py-2.5 text-right tabular-nums font-semibold">
                      {e.attended}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Top participants */}
      <Card>
        <SectionHeader
          title="Top participants"
          icon="trophy"
          href="/dashboard/leaderboard"
        />
        {leaders.length === 0 ? (
          <p className="text-sm text-muted">No ranked students yet.</p>
        ) : (
          <ul className="divide-y divide-black/5">
            {leaders.map((p) => (
              <li key={p.id} className="flex items-center gap-3 py-2.5">
                <span className="grid place-items-center w-7 h-7 rounded-lg bg-indigo/10 text-indigo text-xs font-bold shrink-0">
                  {p.rank}
                </span>
                {p.avatar ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={p.avatar}
                    alt=""
                    className="w-9 h-9 rounded-full object-cover shrink-0"
                  />
                ) : (
                  <span className="grid place-items-center w-9 h-9 rounded-full bg-indigo/12 text-indigo text-xs font-semibold shrink-0">
                    {p.name
                      .split(' ')
                      .filter(Boolean)
                      .slice(0, 2)
                      .map((w) => w[0]?.toUpperCase())
                      .join('')}
                  </span>
                )}
                <div className="min-w-0 flex-1">
                  <Link
                    href={`/dashboard/profile/${p.id}`}
                    className="font-semibold truncate hover:text-indigo transition-colors"
                  >
                    {p.name}
                  </Link>
                  <p className="text-xs text-muted truncate">
                    {p.department} · {yearLabel(p.year)}
                  </p>
                </div>
                <span className="font-display font-bold tabular-nums shrink-0">
                  {p.total_points}
                  <span className="text-xs text-muted font-normal"> pts</span>
                </span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  )
}
