import Link from 'next/link'
import type {
  ProfileCurrent,
  UserRole,
  Certificate,
  CertificateType,
  EventRow,
  EventRegistration,
  MonthlyPlacement,
} from '@/lib/supabase/database.types'
import { Card, SectionHeader, StatCard, Pill, EmptyState } from './ui'
import { yearLabel, fullDate } from './format'
import MonthlyBadges from './MonthlyBadges'
import Icon from '@/components/landing/Icon'

type Registration = EventRegistration & { event: EventRow }
type Cert = Certificate & { event: EventRow | null }

const ROLE_LABEL: Record<UserRole, string> = {
  student: 'Student',
  coordinator: 'Coordinator',
  admin: 'Admin',
}

const CERT_LABEL: Record<CertificateType, string> = {
  participation: 'Participation',
  winner: 'Winner',
  runnerup: 'Runner-up',
  volunteer: 'Volunteer',
}

// Presentational, server-safe resume-style profile. All data is passed in; the
// (client) edit control is injected via `editSlot` so this stays a server
// component. `organizedEvents` is only supplied for staff (coordinator/admin).
export default function ProfileView({
  profile,
  registrations,
  certificates,
  placements,
  rank,
  organizedEvents,
  editSlot,
}: {
  profile: ProfileCurrent
  registrations: Registration[]
  certificates: Cert[]
  placements: MonthlyPlacement[]
  rank: number | null
  organizedEvents?: EventRow[]
  editSlot?: React.ReactNode
}) {
  const isStaff = profile.role === 'coordinator' || profile.role === 'admin'
  // Attended events only, for the participation timeline.
  const attended = registrations.filter((r) => r.status === 'attended')

  return (
    <div className="space-y-5">
      {/* ---- Hero ---- */}
      <Card className="p-0! overflow-hidden">
        <div className="h-24 bg-linear-to-r from-indigo/25 via-blue/20 to-mint/20" />
        <div className="px-5 sm:px-7 pb-6 -mt-18">

          <div className="flex flex-col sm:flex-row sm:items-start gap-4 relative">
            {/* Avatar */}
            {profile.avatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
              src={profile.avatar}
              alt=""
              className="w-24 h-24 rounded-full object-cover ring-4 ring-white bg-white shrink-0"
              />
            ) : (
              <span className="w-24 h-24 grid place-items-center rounded-full ring-4 ring-white bg-indigo/10 text-indigo shrink-0">
                <Icon name="user" className="w-10 h-10" />
              </span>
            )}
            {editSlot && <div className="absolute top-8 -right-7">{editSlot}</div>}

            <div className="min-w-0 flex-1 sm:pb-1">
              <div className="flex  items-center gap-2">
                <h1 className="font-display font-bold text-xl sm:text-3xl">
                  {profile.name}
                </h1>
                <Pill tint={'indigo'}>
                  {ROLE_LABEL[profile.role]}
                </Pill>
                {profile.is_alumni && <Pill tint="muted">Alumni</Pill>}
              </div>
              <p className="text-ink-soft mt-0.5">
                {yearLabel(profile.year)} · {profile.department}
              </p>
            </div>

          </div>

          {/* Bio */}
          {profile.bio && (
            <p className="text-ink-soft mt-4 max-w-2xl">{profile.bio}</p>
          )}

          {/* Contact + socials */}
          <div className="flex flex-wrap items-center gap-2 mt-4">
            <ContactChip icon="mail" href={`mailto:${profile.email}`}>
              {profile.email}
            </ContactChip>
            {profile.phone && (
              <ContactChip icon="phone" href={`tel:${profile.phone}`}>
                {profile.phone}
              </ContactChip>
            )}
            {profile.github && (
              <ContactChip icon="github" href={profile.github}>
                GitHub
              </ContactChip>
            )}
            {profile.linkedin && (
              <ContactChip icon="linkedin" href={profile.linkedin}>
                LinkedIn
              </ContactChip>
            )}
            {profile.website && (
              <ContactChip icon="globe" href={profile.website}>
                Website
              </ContactChip>
            )}
          </div>
        </div>
      </Card>

      {/* ---- Body ---- */}
      <div className="grid gap-5 xl:grid-cols-[1fr_20rem]">
        {/* Main column */}
        <div className="space-y-5 min-w-0">
          {/* Participation timeline */}
          <Card>
            <SectionHeader title="Activity" icon="calendar" />
            {attended.length === 0 ? (
              <EmptyState
                icon="calendar"
                title="No events attended yet"
                hint={isStaff ? undefined : 'Join an event to start your journey.'}
              />
            ) : (
              <ol className="relative border-l border-black/10 ml-2 space-y-5">
                {attended.map((r) => (
                  <li key={r.id} className="ml-5">
                    <span className="absolute -left-1.75 mt-1.5 w-3 h-3 rounded-full bg-indigo ring-4 ring-white" />
                    <Link
                      href={`/dashboard/events/${r.event.id}`}
                      className="group block"
                    >
                      <p className="font-semibold group-hover:text-indigo transition-colors">
                        {r.event.title}
                      </p>
                      <p className="text-sm text-muted">
                        {fullDate(r.event.start_date)}
                        {r.event.points > 0 && ` · ${r.event.points} pts`}
                      </p>
                    </Link>
                  </li>
                ))}
              </ol>
            )}
          </Card>

          {/* Certificates */}
          <Card>
            <SectionHeader title="Certificates" icon="certificate" />
            {certificates.length === 0 ? (
              <EmptyState icon="certificate" title="No certificates yet" />
            ) : (
              <ul className="grid sm:grid-cols-2 gap-3">
                {certificates.map((c) => (
                  <li
                    key={c.id}
                    className="flex items-center gap-3 rounded-2xl bg-white/60 p-3"
                  >
                    <span className="grid place-items-center w-10 h-10 rounded-2xl bg-mint/15 text-mint shrink-0">
                      <Icon name="certificate" className="w-5 h-5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-sm truncate">
                        {c.event?.title ?? CERT_LABEL[c.certificate_type]}
                      </p>
                      <p className="text-xs text-muted">
                        {CERT_LABEL[c.certificate_type]} · {fullDate(c.issued_at)}
                      </p>
                    </div>
                    <Link
                      href={`/certificates/${c.serial}`}
                      className="text-indigo shrink-0"
                      aria-label="View certificate"
                    >
                      <Icon name="arrow" className="w-4 h-4" />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          {/* Events organized (staff only) */}
          {isStaff && (
            <Card>
              <SectionHeader title="Events Organized" icon="compass" />
              {!organizedEvents || organizedEvents.length === 0 ? (
                <EmptyState icon="compass" title="No events organized yet" />
              ) : (
                <ul className="divide-y divide-black/5">
                  {organizedEvents.map((ev) => (
                    <li key={ev.id}>
                      <Link
                        href={`/dashboard/events/${ev.id}`}
                        className="flex items-center gap-3 py-3 -mx-2 px-2 rounded-2xl hover:bg-white/60 transition-colors"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold truncate">{ev.title}</p>
                          <p className="text-sm text-muted">
                            {fullDate(ev.start_date)}
                          </p>
                        </div>
                        <Pill tint={REG_STATUS_TINT(ev)}>{ev.status}</Pill>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          )}
        </div>

        {/* Side column */}
        <aside className="space-y-5">
          {/* Stats — not meaningful for pure staff, but coordinators are students
              too, so we always show them. */}
          <div className="grid grid-cols-2 gap-3">
            <StatCard
              icon="spark"
              label="Points"
              value={profile.total_points.toLocaleString()}
              tint="peach"
            />
            <StatCard
              icon="calendar"
              label="Events"
              value={profile.total_events}
              tint="indigo"
            />
            <StatCard
              icon="certificate"
              label="Certificates"
              value={profile.total_certificates}
              tint="mint"
            />
            <StatCard
              icon="trophy"
              label="Rank"
              value={rank ? `#${rank}` : '—'}
              tint="blue"
            />
          </div>

          {/* Monthly badges */}
          {placements.length > 0 && (
            <Card>
              <SectionHeader title="Monthly Honours" icon="trophy" />
              <MonthlyBadges placements={placements} />
            </Card>
          )}
        </aside>
      </div>
    </div>
  )
}

// Small tint helper for the organized-event status pill.
function REG_STATUS_TINT(ev: EventRow): 'indigo' | 'mint' | 'peach' | 'muted' {
  if (ev.status === 'published') return 'indigo'
  if (ev.status === 'completed') return 'mint'
  if (ev.status === 'cancelled') return 'peach'
  return 'muted'
}

function ContactChip({
  icon,
  href,
  children,
}: {
  icon: string
  href: string
  children: React.ReactNode
}) {
  const external = href.startsWith('http')
  return (
    <a
      href={href}
      target={external ? '_blank' : undefined}
      rel={external ? 'noopener noreferrer' : undefined}
      className="inline-flex items-center gap-2 rounded-full bg-white/60 hover:bg-white px-3.5 py-1.5 text-sm font-medium text-ink-soft transition-colors"
    >
      <Icon name={icon} className="w-4 h-4" />
      {children}
    </a>
  )
}
