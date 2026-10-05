import type { Metadata } from 'next'
import Link from 'next/link'
import Icon from '@/components/landing/Icon'
import ActivityLookup from '@/components/public/ActivityLookup'
import VerifyCertificateForm from '@/components/public/VerifyCertificateForm'

export const metadata: Metadata = {
  title: 'Certificates',
  description:
    'Check your IEDC event registrations and certificates with your student ID, or verify a certificate code.',
}

const STEPS = [
  {
    icon: 'calendar',
    title: 'Register',
    text: 'Pick an event and register with your student ID and email.',
  },
  {
    icon: 'check',
    title: 'Attend',
    text: 'Organisers mark your attendance on the day.',
  },
  {
    icon: 'user',
    title: 'Create your account',
    text: 'Verify your email once. Your past events move in automatically.',
  },
  {
    icon: 'certificate',
    title: 'Download & share',
    text: 'Get verified certificates you can share on LinkedIn.',
  },
]

export default function CertificatesPage() {
  return (
    <>
      <section className="relative overflow-hidden">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10"
          style={{
            background:
              'radial-gradient(700px 360px at 85% 0%, rgba(122,108,255,0.16), transparent 70%), radial-gradient(600px 340px at 10% 30%, rgba(95,227,192,0.14), transparent 70%)',
          }}
        />
        <div className="mx-auto max-w-4xl px-4 pb-8 pt-12 sm:px-6 sm:pt-16">
          <p className="eyebrow">Certificates</p>
          <h1 className="mt-3 font-display text-4xl font-bold tracking-tight sm:text-5xl">
            Your events, <span className="text-grad">on record</span>
          </h1>
          <p className="mt-4 max-w-xl text-ink-soft sm:text-lg">
            See everything you&apos;ve registered for and attended. Certificates are
            issued to your IEDC Hub account, so create one to download them.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-4 sm:px-6">
        <div className="glass rounded-3xl p-6 sm:p-8">
          <h2 className="font-display text-xl font-semibold">Check my activity</h2>
          <p className="mt-1 text-sm text-ink-soft">
            Use the same student ID and email you register for events with.
          </p>
          <div className="mt-5">
            <ActivityLookup />
          </div>
        </div>

        {/* How it works */}
        <div className="mt-14">
          <h2 className="font-display text-xl font-semibold">How certificates work</h2>
          <ol className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((s, i) => (
              <li key={s.title} className="glass rounded-2xl p-5">
                <div className="flex items-center justify-between">
                  <span className="grid h-10 w-10 place-items-center rounded-xl bg-indigo/10 text-indigo">
                    <Icon name={s.icon} className="h-5 w-5" />
                  </span>
                  <span className="font-display text-sm font-bold text-muted">
                    0{i + 1}
                  </span>
                </div>
                <p className="mt-4 font-semibold">{s.title}</p>
                <p className="mt-1 text-sm text-ink-soft">{s.text}</p>
              </li>
            ))}
          </ol>
        </div>

        {/* Verify + account */}
        <div className="mt-14 grid gap-5 md:grid-cols-2">
          <div className="glass rounded-3xl p-6">
            <h2 className="flex items-center gap-2 font-display text-lg font-semibold">
              <Icon name="shield" className="h-5 w-5 text-indigo" />
              Verify a certificate
            </h2>
            <p className="mt-1 text-sm text-ink-soft">
              Employers and colleges can confirm any IEDC certificate using the
              code printed on it.
            </p>
            <div className="mt-4">
              <VerifyCertificateForm />
            </div>
          </div>
          <div className="glass flex flex-col rounded-3xl p-6">
            <h2 className="flex items-center gap-2 font-display text-lg font-semibold">
              <Icon name="lock" className="h-5 w-5 text-indigo" />
              Already have an account?
            </h2>
            <p className="mt-1 text-sm text-ink-soft">
              All your certificates, points and event history are in your
              dashboard.
            </p>
            <div className="mt-auto flex flex-wrap gap-2 pt-4">
              <Link
                href="/login?redirect=%2Fdashboard%2Fcertificates"
                className="btn-primary inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold"
              >
                Log in
                <Icon name="arrow" className="h-4 w-4" />
              </Link>
              <Link
                href="/signup"
                className="btn-ghost inline-flex items-center rounded-xl px-4 py-2.5 text-sm font-semibold"
              >
                Create account
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
