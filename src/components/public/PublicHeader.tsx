'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import Icon from '@/components/landing/Icon'
import { createClient } from '@/lib/supabase/client'

// Header for the public (no-login) pages. Session detection is client-side
// via the local cookie session (no network call), so public pages stay fast
// and the header just swaps "Log in / Create account" for "Dashboard".

const LINKS = [
  { href: '/', label: 'Home' },
  { href: '/events', label: 'Events' },
  { href: '/certificates', label: 'Certificates' },
]

export default function PublicHeader() {
  const pathname = usePathname()
  const [signedIn, setSignedIn] = useState(false)
  // The menu is "open for this path": navigating elsewhere closes it without
  // an effect, since the stored path no longer matches.
  const [menuPath, setMenuPath] = useState<string | null>(null)
  const open = menuPath === pathname
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    createClient()
      .auth.getSession()
      .then(({ data }) => setSignedIn(!!data.session))
      .catch(() => {})
  }, [])

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname.startsWith(href)

  return (
    <header
      className={`sticky top-0 z-50 transition-[background,box-shadow,border-color] duration-300 ${
        scrolled || open
          ? 'border-b border-black/5 bg-white/75 backdrop-blur-xl'
          : 'border-b border-transparent'
      }`}
    >
      <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link href="/" className="flex items-end gap-2.5" aria-label="IEDC Hub home">
          <Image
            src="/logo-transparent.png"
            alt=""
            width={371}
            height={371}
            className="h-7 w-auto"
            priority
          />
          <span className="font-display text-lg font-bold tracking-tight">HUB</span>
        </Link>

        <div className="hidden items-center gap-1 md:flex">
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              aria-current={isActive(l.href) ? 'page' : undefined}
              className={`rounded-xl px-3.5 py-2 text-sm font-medium transition-colors ${
                isActive(l.href)
                  ? 'bg-indigo/10 text-indigo'
                  : 'text-ink-soft hover:bg-black/[0.03] hover:text-ink'
              }`}
            >
              {l.label}
            </Link>
          ))}
        </div>

        <div className="hidden items-center gap-2 md:flex">
          {signedIn ? (
            <Link
              href="/dashboard"
              className="btn-primary inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold"
            >
              Dashboard
              <Icon name="arrow" className="h-4 w-4" />
            </Link>
          ) : (
            <>
              <Link
                href="/login"
                className="rounded-xl px-3.5 py-2 text-sm font-semibold text-ink-soft transition-colors hover:text-ink"
              >
                Log in
              </Link>
              <Link
                href="/signup"
                className="btn-primary rounded-xl px-4 py-2 text-sm font-semibold"
              >
                Create account
              </Link>
            </>
          )}
        </div>

        <button
          type="button"
          onClick={() => setMenuPath(open ? null : pathname)}
          className="grid h-10 w-10 place-items-center rounded-xl text-ink-soft transition-colors hover:bg-black/[0.04] md:hidden"
          aria-expanded={open}
          aria-controls="public-mobile-menu"
          aria-label={open ? 'Close menu' : 'Open menu'}
        >
          <svg
            viewBox="0 0 24 24"
            className="h-5 w-5"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.8}
            strokeLinecap="round"
            aria-hidden="true"
          >
            {open ? (
              <path d="M6 6l12 12M18 6 6 18" />
            ) : (
              <path d="M4 7h16M4 12h16M4 17h16" />
            )}
          </svg>
        </button>
      </nav>

      {open && (
        <div id="public-mobile-menu" className="border-t border-black/5 px-4 pb-5 pt-3 md:hidden">
          <div className="flex flex-col gap-1">
            {LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                aria-current={isActive(l.href) ? 'page' : undefined}
                className={`rounded-xl px-3 py-2.5 text-[0.95rem] font-medium ${
                  isActive(l.href) ? 'bg-indigo/10 text-indigo' : 'text-ink'
                }`}
              >
                {l.label}
              </Link>
            ))}
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2">
            {signedIn ? (
              <Link
                href="/dashboard"
                className="btn-primary col-span-2 rounded-xl px-4 py-2.5 text-center text-sm font-semibold"
              >
                Go to dashboard
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  className="btn-ghost rounded-xl px-4 py-2.5 text-center text-sm font-semibold"
                >
                  Log in
                </Link>
                <Link
                  href="/signup"
                  className="btn-primary rounded-xl px-4 py-2.5 text-center text-sm font-semibold"
                >
                  Create account
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  )
}
