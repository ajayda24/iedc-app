'use client'

import { useId, useState, useTransition } from 'react'
import Link from 'next/link'
import Icon from '@/components/landing/Icon'
import {
  registerGuestAction,
  type GuestRegistrationResult,
} from '@/lib/public/actions'

// Public event registration: student ID + roster email, no account required.
// On success shows a confirmation with an add-to-calendar link and, for
// students without an account, the case for creating one.
export default function GuestRegisterForm({
  eventId,
  eventTitle,
  calendarUrl,
  points,
  hasCertificate,
}: {
  eventId: string
  eventTitle: string
  calendarUrl: string
  points: number
  hasCertificate: boolean
}) {
  const ids = useId()
  const [pending, startTransition] = useTransition()
  const [studentId, setStudentId] = useState('')
  const [email, setEmail] = useState('')
  const [company, setCompany] = useState('') // honeypot
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState<GuestRegistrationResult | null>(null)

  function submit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    startTransition(async () => {
      const res = await registerGuestAction({ eventId, studentId, email, company })
      if (!res.ok) {
        setError(res.error)
        return
      }
      // No router.refresh(): if this took the last seat, a refresh would swap
      // the form (and this confirmation) for the "Full" panel. The action
      // already revalidated the page for the next visit.
      setDone(res.data)
    })
  }

  if (done) {
    return (
      <Confirmation
        result={done}
        studentId={studentId.trim().toUpperCase()}
        eventTitle={eventTitle}
        calendarUrl={calendarUrl}
        points={points}
        hasCertificate={hasCertificate}
      />
    )
  }

  return (
    <form onSubmit={submit} noValidate className="space-y-4">
      <div>
        <label htmlFor={`${ids}-sid`} className="text-sm font-semibold text-ink">
          Student ID
        </label>
        <input
          id={`${ids}-sid`}
          name="studentId"
          value={studentId}
          onChange={(e) => setStudentId(e.target.value)}
          placeholder="e.g. KTE22CS001"
          autoComplete="off"
          autoCapitalize="characters"
          spellCheck={false}
          required
          className="mt-1.5 w-full rounded-xl border border-black/10 bg-white/80 px-3.5 py-2.5 text-[0.95rem] uppercase tracking-wide outline-none transition placeholder:normal-case placeholder:tracking-normal placeholder:text-muted focus:border-indigo focus:ring-4 focus:ring-indigo/15"
        />
      </div>
      <div>
        <label htmlFor={`${ids}-email`} className="text-sm font-semibold text-ink">
          Email
        </label>
        <input
          id={`${ids}-email`}
          name="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="The email on your college record"
          autoComplete="email"
          required
          aria-describedby={`${ids}-email-hint`}
          className="mt-1.5 w-full rounded-xl border border-black/10 bg-white/80 px-3.5 py-2.5 text-[0.95rem] outline-none transition placeholder:text-muted focus:border-indigo focus:ring-4 focus:ring-indigo/15"
        />
        <p id={`${ids}-email-hint`} className="mt-1.5 text-xs text-muted">
          Must match the email your college registered for your student ID.
        </p>
      </div>

      {/* Honeypot — hidden from people and assistive tech. */}
      <div aria-hidden className="absolute -left-[9999px] h-px w-px overflow-hidden">
        <label>
          Company
          <input
            tabIndex={-1}
            autoComplete="off"
            value={company}
            onChange={(e) => setCompany(e.target.value)}
          />
        </label>
      </div>

      {error && (
        <p
          role="alert"
          className="flex items-start gap-2 rounded-xl bg-peach/15 px-3.5 py-2.5 text-sm text-[#a5522a]"
        >
          <Icon name="shield" className="mt-0.5 h-4 w-4 shrink-0" />
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending || !studentId.trim() || !email.trim()}
        className="btn-primary flex w-full items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold disabled:pointer-events-none disabled:opacity-60"
      >
        {pending ? (
          <>
            <Spinner />
            Registering…
          </>
        ) : (
          <>
            Register for this event
            <Icon name="arrow" className="h-4 w-4" />
          </>
        )}
      </button>

      <p className="text-center text-xs text-muted">
        Have an account?{' '}
        <Link
          href={`/login?redirect=${encodeURIComponent(`/dashboard/events/${eventId}`)}`}
          className="font-semibold text-indigo hover:underline"
        >
          Log in to register
        </Link>
      </p>
    </form>
  )
}

function Confirmation({
  result,
  studentId,
  eventTitle,
  calendarUrl,
  points,
  hasCertificate,
}: {
  result: GuestRegistrationResult
  studentId: string
  eventTitle: string
  calendarUrl: string
  points: number
  hasCertificate: boolean
}) {
  const greeting = result.firstName ? `, ${result.firstName}` : ''
  return (
    <div className="space-y-5" role="status" aria-live="polite">
      <div className="text-center">
        <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-mint/20 text-[#178f6f]">
          <Icon name="check" className="h-7 w-7" />
        </span>
        <h3 className="mt-3 font-display text-xl font-bold">
          {result.alreadyRegistered ? 'Already registered' : `You're in${greeting}!`}
        </h3>
        <p className="mt-1 text-sm text-ink-soft">
          {result.alreadyRegistered
            ? `Your seat for ${eventTitle} is already saved.`
            : `Your seat for ${eventTitle} is confirmed. Bring your student ID card.`}
        </p>
      </div>

      <a
        href={calendarUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="btn-ghost flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold"
      >
        <Icon name="calendar" className="h-4 w-4" />
        Add to Google Calendar
      </a>

      {result.hasAccount ? (
        <Link
          href="/dashboard/events"
          className="btn-primary flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold"
        >
          View in your dashboard
          <Icon name="arrow" className="h-4 w-4" />
        </Link>
      ) : (
        <div className="rounded-2xl border border-indigo/15 bg-indigo/[0.05] p-4">
          <p className="text-sm font-semibold text-ink">
            Collect what you earn here
          </p>
          <ul className="mt-2 space-y-1.5 text-sm text-ink-soft">
            {hasCertificate && (
              <li className="flex items-center gap-2">
                <Icon name="certificate" className="h-4 w-4 shrink-0 text-indigo" />
                Your certificate unlocks with an account
              </li>
            )}
            {points > 0 && (
              <li className="flex items-center gap-2">
                <Icon name="trophy" className="h-4 w-4 shrink-0 text-indigo" />
                {points} activity points on the leaderboard
              </li>
            )}
            <li className="flex items-center gap-2">
              <Icon name="spark" className="h-4 w-4 shrink-0 text-indigo" />
              This registration moves to your account automatically
            </li>
          </ul>
          <Link
            href={`/signup?id=${encodeURIComponent(studentId)}`}
            className="btn-primary mt-4 flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold"
          >
            Create my account
            <Icon name="arrow" className="h-4 w-4" />
          </Link>
          <p className="mt-2 text-center text-xs text-muted">
            Takes about a minute. We&apos;ll email you a code.
          </p>
        </div>
      )}
    </div>
  )
}

function Spinner() {
  return (
    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity="0.3" strokeWidth="3" />
      <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  )
}
