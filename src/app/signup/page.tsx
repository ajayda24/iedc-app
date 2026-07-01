import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getProfile } from '@/lib/auth/queries'
import Icon from '@/components/landing/Icon'
import SignupFlow from '@/components/auth/SignupFlow'

// Reads the session cookie on every request; never serve a cached snapshot,
// otherwise the profile-based redirect below won't run on direct nav.
export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Get started — IEDC Hub',
  description: 'Create your IEDC Hub account.',
}

export default async function SignupPage() {
  // Only skip signup if the account is fully set up (has a profile). A session
  // alone is not enough: it exists mid-flow, between OTP verify (step 2) and
  // password creation (step 3), and must NOT bounce the user off this page.
  const profile = await getProfile()
  if (profile) redirect('/dashboard')

  return (
    <main className="relative min-h-dvh overflow-hidden">
      {/* ambient blobs, matching the landing palette */}
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

        <SignupFlow />

        <p className="mt-6 text-center text-sm text-ink-soft">
          Already have an account?{' '}
          <Link href="/login" className="font-semibold text-indigo hover:underline">
            Log in
          </Link>
        </p>
      </div>
    </main>
  )
}
