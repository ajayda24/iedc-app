import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getUser } from '@/lib/auth/queries'
import Icon from '@/components/landing/Icon'
import LoginForm from '@/components/auth/LoginForm'

// Reads the session cookie on every request; never serve a cached snapshot,
// otherwise the "already logged in" redirect below won't run on direct nav.
export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Log in — IEDC Hub',
  description: 'Log in to your IEDC Hub account.',
}

export default async function LoginPage() {
  // A valid session means the user is logged in — send them to the app. Use the
  // session (getUser), not getProfile: a failing profile query must not strand a
  // logged-in user on the login form.
  const user = await getUser()
  if (user) redirect('/dashboard')

  return (
    <main className="relative min-h-dvh overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background:
            'radial-gradient(700px 500px at 8% -10%, rgba(122,108,255,0.16), transparent 60%), radial-gradient(700px 500px at 108% 8%, rgba(116,208,255,0.14), transparent 55%), radial-gradient(700px 700px at 100% 110%, rgba(95,227,192,0.12), transparent 55%)',
        }}
      />

      <div className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-5 py-10">
        <Link
          href="/"
          className="mb-6 inline-flex items-center gap-2 self-start text-sm font-medium text-ink-soft transition hover:text-ink"
        >
          <Icon name="logo" className="h-6 w-6 text-indigo" />
          IEDC Hub
        </Link>

        <LoginForm />

        <p className="mt-6 text-center text-sm text-ink-soft">
          New here?{' '}
          <Link href="/signup" className="font-semibold text-indigo hover:underline">
            Create an account
          </Link>
        </p>
      </div>
    </main>
  )
}
