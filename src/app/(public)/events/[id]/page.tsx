import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import Icon from '@/components/landing/Icon'
import {
  CATEGORY_LABEL,
  fullDate,
  timeRange,
  eventTime,
} from '@/components/dashboard/format'
import EventStateBadge from '@/components/public/EventStateBadge'
import GuestRegisterForm from '@/components/public/GuestRegisterForm'
import { getPublicEvent, type PublicEventCard } from '@/lib/public/events'
import { getUser } from '@/lib/auth/queries'
import type { RegState } from '@/lib/events/reg-state'
import { APP_TIMEZONE } from '@/lib/time'

export const dynamic = 'force-dynamic'

type Params = { params: Promise<{ id: string }> }

function excerpt(text: string | null, max = 160): string | undefined {
  if (!text) return undefined
  const flat = text.replace(/\s+/g, ' ').trim()
  return flat.length > max ? `${flat.slice(0, max - 1).trimEnd()}…` : flat
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { id } = await params
  const ev = await getPublicEvent(id)
  if (!ev) return { title: 'Event not found' }

  const description =
    excerpt(ev.description) ??
    `${CATEGORY_LABEL[ev.category]} on ${fullDate(ev.start_date)}${ev.venue ? ` at ${ev.venue}` : ''}.`
  return {
    title: ev.title,
    description,
    alternates: { canonical: `/events/${ev.id}` },
    openGraph: {
      type: 'website',
      title: ev.title,
      description,
      url: `/events/${ev.id}`,
      ...(ev.banner ? { images: [{ url: ev.banner }] } : {}),
    },
    twitter: {
      card: ev.banner ? 'summary_large_image' : 'summary',
      title: ev.title,
      description,
      ...(ev.banner ? { images: [ev.banner] } : {}),
    },
  }
}

// Google Calendar "add event" link. Times in UTC; defaults to 2h if no end.
function googleCalendarUrl(ev: PublicEventCard): string {
  const fmt = (d: Date) => d.toISOString().replace(/[-:]|\.\d{3}/g, '')
  const start = new Date(ev.start_date)
  const end = ev.end_date
    ? new Date(ev.end_date)
    : new Date(start.getTime() + 2 * 60 * 60 * 1000)
  const sp = new URLSearchParams({
    action: 'TEMPLATE',
    text: ev.title,
    dates: `${fmt(start)}/${fmt(end)}`,
    details: excerpt(ev.description, 500) ?? 'IEDC event',
    location: ev.venue ?? '',
  })
  return `https://calendar.google.com/calendar/render?${sp.toString()}`
}

export default async function PublicEventPage({ params }: Params) {
  const { id } = await params
  const [ev, user] = await Promise.all([getPublicEvent(id), getUser()])
  if (!ev) notFound()

  // Calendar days compared in the app timezone, matching how dates render.
  const dayKey = (iso: string) =>
    new Date(iso).toLocaleDateString('en-CA', { timeZone: APP_TIMEZONE })
  const multiDay = !!ev.end_date && dayKey(ev.end_date) !== dayKey(ev.start_date)

  const benefits = [
    ev.benefit_certificate && {
      icon: 'certificate',
      title: 'Certificate',
      text: 'Verified, shareable certificate for attendees',
    },
    (ev.benefit_activity_points || ev.points > 0) && {
      icon: 'trophy',
      title: ev.points > 0 ? `${ev.points} activity points` : 'Activity points',
      text: 'Counts toward the IEDC leaderboard',
    },
    ev.benefit_attendance && {
      icon: 'check',
      title: 'Attendance recorded',
      text: 'Marked on the day by the organisers',
    },
  ].filter(Boolean) as { icon: string; title: string; text: string }[]

  // schema.org Event for rich results in search.
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Event',
    name: ev.title,
    description: excerpt(ev.description, 500),
    startDate: ev.start_date,
    endDate: ev.end_date ?? undefined,
    eventStatus:
      ev.status === 'cancelled'
        ? 'https://schema.org/EventCancelled'
        : 'https://schema.org/EventScheduled',
    eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
    location: ev.venue
      ? { '@type': 'Place', name: ev.venue, address: ev.venue }
      : undefined,
    image: ev.banner ? [ev.banner] : undefined,
    organizer: { '@type': 'Organization', name: 'IEDC' },
    isAccessibleForFree: true,
  }

  return (
    <article className="mx-auto max-w-6xl px-4 pt-6 sm:px-6 sm:pt-8">
      <script
        type="application/ld+json"
        // JSON.stringify output; `<` escaped so event text can't close the tag.
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c'),
        }}
      />

      <Link
        href="/events"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-muted transition-colors hover:text-indigo"
      >
        <Icon name="chevron-left" className="h-4 w-4" />
        All events
      </Link>

      {/* Banner */}
      <div className="relative mt-4 aspect-[16/7] overflow-hidden rounded-[28px] bg-gradient-to-br from-indigo/30 via-blue/20 to-mint/25 sm:aspect-[16/6]">
        {ev.banner ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={ev.banner}
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 grid place-items-center">
            <Icon name="rocket" className="h-20 w-20 text-white/60" />
          </div>
        )}
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_380px] lg:gap-10">
        {/* Main column */}
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-indigo/10 px-3 py-1 text-xs font-semibold text-indigo">
              {CATEGORY_LABEL[ev.category]}
            </span>
            <EventStateBadge state={ev.state} />
          </div>
          <h1 className="mt-3 font-display text-3xl font-bold leading-tight tracking-tight sm:text-4xl">
            {ev.title}
          </h1>

          {/* Key facts */}
          <dl className="mt-6 grid gap-4 sm:grid-cols-2">
            <Fact icon="calendar" label="Date">
              {fullDate(ev.start_date)}
              {multiDay && ev.end_date ? ` – ${fullDate(ev.end_date)}` : ''}
            </Fact>
            <Fact icon="clock" label="Time">
              {timeRange(ev.start_date, ev.end_date)} IST
            </Fact>
            {ev.venue && (
              <Fact icon="compass" label="Venue">
                {ev.venue}
              </Fact>
            )}
            {ev.registration_deadline && ev.status === 'published' && (
              <Fact icon="bell" label="Register by">
                {fullDate(ev.registration_deadline)},{' '}
                {eventTime(ev.registration_deadline)}
              </Fact>
            )}
          </dl>

          {/* About */}
          <section className="mt-10">
            <h2 className="font-display text-xl font-semibold">About this event</h2>
            {ev.description ? (
              <div className="mt-3 whitespace-pre-line leading-relaxed text-ink-soft">
                {ev.description}
              </div>
            ) : (
              <p className="mt-3 text-ink-soft">
                More details will be shared soon.
              </p>
            )}
          </section>

          {/* Benefits */}
          {benefits.length > 0 && (
            <section className="mt-10">
              <h2 className="font-display text-xl font-semibold">What you get</h2>
              <ul className="mt-4 grid gap-3 sm:grid-cols-2">
                {benefits.map((b) => (
                  <li key={b.title} className="glass flex items-start gap-3 rounded-2xl p-4">
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-indigo/10 text-indigo">
                      <Icon name={b.icon} className="h-5 w-5" />
                    </span>
                    <div>
                      <p className="font-semibold">{b.title}</p>
                      <p className="mt-0.5 text-sm text-ink-soft">{b.text}</p>
                    </div>
                  </li>
                ))}
              </ul>
              {ev.benefit_certificate && (
                <p className="mt-3 text-sm text-muted">
                  Certificates are delivered to your IEDC Hub account. Register
                  now and create your account any time, even after the event.
                </p>
              )}
            </section>
          )}
        </div>

        {/* Registration panel */}
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="glass rounded-3xl p-6">
            <SeatMeter ev={ev} />
            <div className="mt-5">
              <RegistrationPanel
                ev={ev}
                signedIn={!!user}
                calendarUrl={googleCalendarUrl(ev)}
              />
            </div>
          </div>
          <ShareRow title={ev.title} id={ev.id} />
        </aside>
      </div>
    </article>
  )
}

function Fact({
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
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white/80 text-indigo shadow-sm ring-1 ring-black/5">
        <Icon name={icon} className="h-5 w-5" />
      </span>
      <div className="min-w-0">
        <dt className="text-xs font-medium uppercase tracking-wider text-muted">
          {label}
        </dt>
        <dd className="mt-0.5 font-medium text-ink">{children}</dd>
      </div>
    </div>
  )
}

function SeatMeter({ ev }: { ev: PublicEventCard }) {
  if (ev.max_participants == null) {
    return (
      <div>
        <p className="font-display text-lg font-semibold">
          {ev.status === 'completed' ? 'Event wrapped up' : 'Open to all students'}
        </p>
        <p className="mt-0.5 text-sm text-muted">
          {ev.registered} registered so far
        </p>
      </div>
    )
  }
  const pct = Math.min(100, Math.round((ev.registered / ev.max_participants) * 100))
  return (
    <div>
      <div className="flex items-baseline justify-between gap-2">
        <p className="font-display text-lg font-semibold">
          {ev.spotsLeft === 0
            ? 'No seats left'
            : `${ev.spotsLeft} of ${ev.max_participants} seats left`}
        </p>
        <span className="text-xs font-medium text-muted tabular-nums">{pct}%</span>
      </div>
      <div
        className="mt-2 h-2 overflow-hidden rounded-full bg-black/[0.06]"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={ev.max_participants}
        aria-valuenow={ev.registered}
        aria-label="Seats filled"
      >
        <div
          className={`h-full rounded-full ${pct >= 90 ? 'bg-[#e07a45]' : 'bg-gradient-to-r from-indigo to-blue'}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}

const CLOSED_COPY: Record<Exclude<RegState, 'open' | 'registered'>, { title: string; text: string }> = {
  full: {
    title: 'This event is full',
    text: 'All seats have been taken. Keep an eye on upcoming events.',
  },
  closed: {
    title: 'Registration has closed',
    text: 'The registration window for this event is over.',
  },
  completed: {
    title: 'This event has ended',
    text: 'Attended? Check whether your certificate is ready.',
  },
  cancelled: {
    title: 'This event was cancelled',
    text: 'Sorry about that. Browse other upcoming events.',
  },
}

function RegistrationPanel({
  ev,
  signedIn,
  calendarUrl,
}: {
  ev: PublicEventCard
  signedIn: boolean
  calendarUrl: string
}) {
  if (ev.state === 'open' || ev.state === 'registered') {
    if (signedIn) {
      return (
        <div className="space-y-3">
          <p className="text-sm text-ink-soft">
            You&apos;re signed in. Register from your dashboard so it&apos;s
            linked to your account straight away.
          </p>
          <Link
            href={`/dashboard/events/${ev.id}`}
            className="btn-primary flex w-full items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold"
          >
            Register in dashboard
            <Icon name="arrow" className="h-4 w-4" />
          </Link>
        </div>
      )
    }
    return (
      <GuestRegisterForm
        eventId={ev.id}
        eventTitle={ev.title}
        calendarUrl={calendarUrl}
        points={ev.points}
        hasCertificate={ev.benefit_certificate}
      />
    )
  }

  const copy = CLOSED_COPY[ev.state]
  return (
    <div className="space-y-4">
      <div>
        <p className="font-semibold">{copy.title}</p>
        <p className="mt-1 text-sm text-ink-soft">{copy.text}</p>
      </div>
      {ev.state === 'completed' ? (
        <Link
          href="/certificates"
          className="btn-primary flex w-full items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold"
        >
          <Icon name="certificate" className="h-4 w-4" />
          Find my certificate
        </Link>
      ) : (
        <Link
          href="/events"
          className="btn-ghost flex w-full items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold"
        >
          See upcoming events
        </Link>
      )}
    </div>
  )
}

function ShareRow({ title, id }: { title: string; id: string }) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://iedchub.vercel.app'
  const url = `${siteUrl}/events/${id}`
  const text = `${title} — register on IEDC Hub`
  const links = [
    {
      label: 'WhatsApp',
      href: `https://wa.me/?text=${encodeURIComponent(`${text}\n${url}`)}`,
    },
    {
      label: 'LinkedIn',
      href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
    },
    {
      label: 'X',
      href: `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`,
    },
  ]
  return (
    <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-sm">
      <span className="text-muted">Share with friends:</span>
      {links.map((l) => (
        <a
          key={l.label}
          href={l.href}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-full border border-black/10 bg-white/60 px-3 py-1 font-medium text-ink-soft transition-colors hover:border-black/20 hover:text-ink"
        >
          {l.label}
        </a>
      ))}
    </div>
  )
}
