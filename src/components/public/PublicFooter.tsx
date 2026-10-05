import Image from 'next/image'
import Link from 'next/link'

// Footer shared by the public pages.
export default function PublicFooter() {
  return (
    <footer className="mt-24 border-t border-ink/5">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          <Link href="/" className="flex items-end gap-2.5">
            <Image
              src="/logo-transparent.png"
              alt=""
              width={371}
              height={371}
              className="h-7 w-auto"
            />
            <span className="font-display text-lg font-bold tracking-tight">HUB</span>
          </Link>
          <p className="mt-3 max-w-xs text-sm leading-relaxed text-ink-soft">
            The Innovation and Entrepreneurship Development Cell. Workshops,
            hackathons and talks for every student who wants to build.
          </p>
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">
            Explore
          </p>
          <ul className="mt-3 space-y-2 text-sm">
            <li>
              <Link href="/events" className="text-ink-soft hover:text-ink">
                Upcoming events
              </Link>
            </li>
            <li>
              <Link href="/events?view=past" className="text-ink-soft hover:text-ink">
                Past events
              </Link>
            </li>
            <li>
              <Link href="/certificates" className="text-ink-soft hover:text-ink">
                Find or verify a certificate
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">
            Your account
          </p>
          <ul className="mt-3 space-y-2 text-sm">
            <li>
              <Link href="/signup" className="text-ink-soft hover:text-ink">
                Create an account
              </Link>
            </li>
            <li>
              <Link href="/login" className="text-ink-soft hover:text-ink">
                Log in
              </Link>
            </li>
            <li>
              <Link href="/dashboard" className="text-ink-soft hover:text-ink">
                Dashboard
              </Link>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-ink/5">
        <p className="mx-auto max-w-6xl px-4 py-5 text-xs text-muted sm:px-6">
          © {new Date().getFullYear()} IEDC Hub. Build. Innovate. Compete.
        </p>
      </div>
    </footer>
  )
}
