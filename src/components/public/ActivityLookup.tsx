'use client'

import { useId, useState, useTransition } from 'react'
import Link from 'next/link'
import Icon from '@/components/landing/Icon'
import { CATEGORY_LABEL, fullDate, REG_STATUS } from '@/components/dashboard/format'
import {
  lookupActivityAction,
  type ActivityItem,
  type ActivityResult,
} from '@/lib/public/actions'

// "Find my certificates": a student enters their ID + roster email and sees
// every event they registered for, what they attended, and which certificates
// are waiting. Certificates themselves only open from an account, so guests
// get a clear path to sign up.
export default function ActivityLookup() {
  const ids = useId()
  const [pending, startTransition] = useTransition()
  const [studentId, setStudentId] = useState('')
  const [email, setEmail] = useState('')
  const [company, setCompany] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<ActivityResult | null>(null)

  function submit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    startTransition(async () => {
      const res = await lookupActivityAction({ studentId, email, company })
      if (!res.ok) {
        setError(res.error)
        setResult(null)
        return
      }
      setResult(res.data)
    })
  }

  return (
    <div>
      <form onSubmit={submit} noValidate className="grid gap-3 sm:grid-cols-[1fr_1.3fr_auto] sm:items-end">
        <div>
          <label htmlFor={`${ids}-sid`} className="text-sm font-semibold">
            Student ID
          </label>
          <input
            id={`${ids}-sid`}
            value={studentId}
            onChange={(e) => setStudentId(e.target.value)}
            placeholder="e.g. KTE22CS001"
            autoComplete="off"
            autoCapitalize="characters"
            spellCheck={false}
            required
            className="mt-1.5 w-full rounded-xl border border-black/10 bg-white/80 px-3.5 py-2.5 uppercase tracking-wide outline-none transition placeholder:normal-case placeholder:tracking-normal placeholder:text-muted focus:border-indigo focus:ring-4 focus:ring-indigo/15"
          />
        </div>
        <div>
          <label htmlFor={`${ids}-email`} className="text-sm font-semibold">
            Email on your college record
          </label>
          <input
            id={`${ids}-email`}
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.edu"
            autoComplete="email"
            required
            className="mt-1.5 w-full rounded-xl border border-black/10 bg-white/80 px-3.5 py-2.5 outline-none transition placeholder:text-muted focus:border-indigo focus:ring-4 focus:ring-indigo/15"
          />
        </div>
        <div aria-hidden className="absolute -left-[9999px] h-px w-px overflow-hidden">
          <input
            tabIndex={-1}
            autoComplete="off"
            value={company}
            onChange={(e) => setCompany(e.target.value)}
          />
        </div>
        <button
          type="submit"
          disabled={pending || !studentId.trim() || !email.trim()}
          className="btn-primary inline-flex items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold disabled:pointer-events-none disabled:opacity-60 sm:h-[46px]"
        >
          {pending ? 'Checking…' : 'Check'}
          {!pending && <Icon name="search" className="h-4 w-4" />}
        </button>
      </form>

      {error && (
        <p
          role="alert"
          className="mt-4 flex items-start gap-2 rounded-xl bg-peach/15 px-3.5 py-2.5 text-sm text-[#a5522a]"
        >
          <Icon name="shield" className="mt-0.5 h-4 w-4 shrink-0" />
          {error}
        </p>
      )}

      {result && <Results result={result} />}
    </div>
  )
}

function Results({ result }: { result: ActivityResult }) {
  const attended = result.items.filter((i) => i.status === 'attended').length
  const issued = result.items.filter((i) => i.certificate?.kind === 'issued').length
  const signupHref = `/signup?id=${encodeURIComponent(result.studentId)}`

  return (
    <div className="mt-8 space-y-5" aria-live="polite">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h3 className="font-display text-xl font-bold">
            {result.firstName ? `Hi ${result.firstName},` : 'Your activity'}
          </h3>
          <p className="mt-0.5 text-sm text-ink-soft">
            {result.items.length === 0
              ? "You haven't registered for any events yet."
              : `${result.items.length} registration${result.items.length === 1 ? '' : 's'} · ${attended} attended`}
          </p>
        </div>
      </div>

      {/* Primary call to action */}
      {result.hasAccount ? (
        <div className="flex flex-col gap-3 rounded-2xl border border-mint/30 bg-mint/10 p-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm">
            <span className="font-semibold">You have an account.</span>{' '}
            {issued > 0
              ? `${issued} certificate${issued === 1 ? ' is' : 's are'} ready in your dashboard.`
              : 'Your certificates appear in your dashboard once issued.'}
          </p>
          <Link
            href="/login?redirect=%2Fdashboard%2Fcertificates"
            className="btn-primary inline-flex shrink-0 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold"
          >
            Log in to view
            <Icon name="arrow" className="h-4 w-4" />
          </Link>
        </div>
      ) : (
        <div className="relative overflow-hidden rounded-2xl border border-indigo/15 bg-gradient-to-br from-indigo/[0.08] to-sky/[0.08] p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-display text-lg font-semibold">
                {result.pendingCertificates > 0
                  ? `${result.pendingCertificates} certificate${result.pendingCertificates === 1 ? ' is' : 's are'} waiting for you`
                  : 'Create your account to collect certificates'}
              </p>
              <p className="mt-1 text-sm text-ink-soft">
                {result.points > 0
                  ? `Plus ${result.points} activity points. `
                  : ''}
                Everything above moves into your account the moment you sign up.
              </p>
            </div>
            <Link
              href={signupHref}
              className="btn-primary inline-flex shrink-0 items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold"
            >
              Create my account
              <Icon name="arrow" className="h-4 w-4" />
            </Link>
          </div>
        </div>
      )}

      {result.items.length > 0 ? (
        <ul className="glass divide-y divide-black/5 overflow-hidden rounded-3xl">
          {result.items.map((item) => (
            <ActivityRow key={item.eventId} item={item} />
          ))}
        </ul>
      ) : (
        <div className="glass rounded-3xl p-8 text-center">
          <p className="font-semibold">Nothing here yet</p>
          <p className="mt-1 text-sm text-ink-soft">
            Find an event you like and register in under a minute.
          </p>
          <Link
            href="/events"
            className="btn-ghost mt-4 inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold"
          >
            Browse events
          </Link>
        </div>
      )}
    </div>
  )
}

const STATUS_STYLE: Record<string, string> = {
  registered: 'bg-indigo/12 text-indigo',
  attended: 'bg-mint/15 text-[#178f6f]',
  absent: 'bg-peach/20 text-[#b85e30]',
  cancelled: 'bg-black/[0.05] text-ink-soft',
}

function ActivityRow({ item }: { item: ActivityItem }) {
  return (
    <li className="flex flex-wrap items-center gap-x-4 gap-y-3 px-5 py-4">
      <div className="min-w-0 flex-1">
        <Link
          href={`/events/${item.eventId}`}
          className="font-semibold text-ink hover:text-indigo"
        >
          {item.title}
        </Link>
        <p className="mt-0.5 text-sm text-muted">
          {CATEGORY_LABEL[item.category]} · {fullDate(item.startDate)}
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <span
          className={`rounded-full px-2.5 py-1 text-xs font-semibold ${STATUS_STYLE[item.status]}`}
        >
          {item.eventStatus === 'cancelled' ? 'Event cancelled' : REG_STATUS[item.status].label}
        </span>
        {item.certificate?.kind === 'issued' && (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo px-3 py-1 text-xs font-semibold text-white">
            <Icon name="certificate" className="h-3.5 w-3.5" />
            Certificate issued
          </span>
        )}
        {item.certificate?.kind === 'on-signup' && (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-indigo/25 px-3 py-1 text-xs font-semibold text-indigo">
            <Icon name="lock" className="h-3.5 w-3.5" />
            Certificate unlocks on sign-up
          </span>
        )}
      </div>
    </li>
  )
}
