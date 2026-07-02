import Link from 'next/link'
import { notFound } from 'next/navigation'
import {
  getEvent,
  getMyRegistration,
  countRegistrationsByEvent,
} from '@/lib/queries'
import { Card, Pill } from '@/components/dashboard/ui'
import {
  CATEGORY_LABEL,
  REG_STATUS,
  fullDate,
  timeRange,
  dateChip,
} from '@/components/dashboard/format'
import Icon from '@/components/landing/Icon'
import EventRegisterButton from '@/components/dashboard/EventRegisterButton'
import { regStateFor } from '@/lib/events/reg-state'

export default async function EventDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const event = await getEvent(id)
  if (!event) notFound()

  const [myReg, counts] = await Promise.all([
    getMyRegistration(id),
    countRegistrationsByEvent([id]),
  ])

  const registered = counts[id] ?? 0
  const spotsLeft =
    event.max_participants != null ? event.max_participants - registered : null
  const state = regStateFor(event, myReg?.status, spotsLeft)
  const chip = dateChip(event.start_date)

  const benefits = [
    event.benefit_attendance && {
      icon: 'check',
      tint: 'indigo' as const,
      label: 'Counts as attendance',
    },
    event.benefit_certificate && {
      icon: 'certificate',
      tint: 'mint' as const,
      label: 'Certificate awarded',
    },
    event.benefit_activity_points && {
      icon: 'spark',
      tint: 'peach' as const,
      label: 'Activity points',
    },
  ].filter(Boolean) as { icon: string; tint: 'indigo' | 'mint' | 'peach'; label: string }[]

  const regInfo = myReg && myReg.status !== 'cancelled' ? REG_STATUS[myReg.status] : null

  return (
    <div className="space-y-5">
      {/* Back */}
      <Link
        href="/dashboard/events"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-muted hover:text-indigo transition-colors"
      >
        <Icon name="arrow" className="w-4 h-4 rotate-180" />
        Back to events
      </Link>

      {/* Banner hero */}
      <div className="relative rounded-3xl overflow-hidden h-48 sm:h-64 bg-gradient-to-br from-indigo/25 to-blue/20">
        {event.banner && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={event.banner}
            alt=""
            className="absolute inset-0 w-full h-full object-cover"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-ink/50 to-transparent" />
        <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between gap-3">
          <div className="min-w-0">
            <Pill>{CATEGORY_LABEL[event.category]}</Pill>
            <h1 className="mt-2 font-display font-bold text-2xl sm:text-3xl text-white drop-shadow">
              {event.title}
            </h1>
          </div>
          <div className="grid place-items-center w-14 h-14 rounded-2xl bg-white/95 text-indigo shadow-sm shrink-0">
            <span className="font-display font-bold text-lg leading-none">
              {chip.day}
            </span>
            <span className="text-[0.65rem] font-semibold">{chip.mon}</span>
          </div>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1fr_20rem]">
        {/* Main */}
        <div className="space-y-5 min-w-0">
          {event.description && (
            <Card>
              <h2 className="font-display font-semibold text-base mb-2">
                About this event
              </h2>
              <p className="text-ink-soft whitespace-pre-line leading-relaxed">
                {event.description}
              </p>
            </Card>
          )}

          <Card>
            <h2 className="font-display font-semibold text-base mb-4">
              Details
            </h2>
            <div className="space-y-3">
              <DetailRow icon="calendar" label="Date">
                {fullDate(event.start_date)}
              </DetailRow>
              <DetailRow icon="clock" label="Time">
                {timeRange(event.start_date, event.end_date)}
              </DetailRow>
              {event.venue && (
                <DetailRow icon="compass" label="Venue">
                  {event.venue}
                </DetailRow>
              )}
              {event.registration_deadline && (
                <DetailRow icon="bell" label="Register by">
                  {fullDate(event.registration_deadline)}
                </DetailRow>
              )}
            </div>
          </Card>

          {benefits.length > 0 && (
            <Card>
              <h2 className="font-display font-semibold text-base mb-4">
                What you&apos;ll get
              </h2>
              <ul className="space-y-3">
                {benefits.map((b) => (
                  <li key={b.label} className="flex items-center gap-3">
                    <span
                      className={`grid place-items-center w-9 h-9 rounded-xl shrink-0 ${
                        b.tint === 'indigo'
                          ? 'bg-indigo/12 text-indigo'
                          : b.tint === 'mint'
                            ? 'bg-mint/15 text-mint'
                            : 'bg-peach/15 text-peach'
                      }`}
                    >
                      <Icon name={b.icon} className="w-4 h-4" />
                    </span>
                    <span className="text-sm font-medium">{b.label}</span>
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </div>

        {/* Side — registration panel */}
        <aside>
          <Card className="lg:sticky lg:top-5">
            {regInfo && (
              <div className="mb-4">
                <Pill tint={regInfo.tint}>You&apos;re {regInfo.label.toLowerCase()}</Pill>
              </div>
            )}

            <div className="space-y-3 mb-4">
              {event.points > 0 && (
                <StatRow icon="spark" tint="peach" label="Points">
                  {event.points} pts
                </StatRow>
              )}
              <StatRow icon="team" tint="indigo" label="Registered">
                {registered}
                {event.max_participants != null
                  ? ` / ${event.max_participants}`
                  : ''}
              </StatRow>
              {spotsLeft != null && (
                <StatRow
                  icon="check"
                  tint={spotsLeft > 0 ? 'mint' : 'peach'}
                  label="Availability"
                >
                  {spotsLeft > 0 ? `${spotsLeft} spots left` : 'Full'}
                </StatRow>
              )}
            </div>

            <EventRegisterButton eventId={event.id} state={state} />
          </Card>
        </aside>
      </div>
    </div>
  )
}

function DetailRow({
  icon,
  label,
  children,
}: {
  icon: string
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="flex items-start gap-3">
      <span className="grid place-items-center w-9 h-9 rounded-xl bg-black/5 text-ink-soft shrink-0">
        <Icon name={icon} className="w-4 h-4" />
      </span>
      <div className="min-w-0">
        <p className="text-xs text-muted">{label}</p>
        <p className="text-sm font-medium">{children}</p>
      </div>
    </div>
  )
}

const STAT_TINTS = {
  indigo: 'bg-indigo/12 text-indigo',
  mint: 'bg-mint/15 text-mint',
  peach: 'bg-peach/15 text-peach',
} as const

function StatRow({
  icon,
  tint,
  label,
  children,
}: {
  icon: string
  tint: keyof typeof STAT_TINTS
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="flex items-center gap-3">
      <span
        className={`grid place-items-center w-9 h-9 rounded-xl shrink-0 ${STAT_TINTS[tint]}`}
      >
        <Icon name={icon} className="w-4 h-4" />
      </span>
      <div className="flex-1 flex items-center justify-between gap-2">
        <span className="text-xs text-muted">{label}</span>
        <span className="text-sm font-semibold">{children}</span>
      </div>
    </div>
  )
}
