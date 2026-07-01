'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import Icon from '@/components/landing/Icon'
import type { UserRole } from '@/lib/supabase/database.types'
import {
  navForRole,
  mobileNavForRole,
  mobileMoreForRole,
  type NavItem,
} from './nav-items'
import { useMountTransition } from './use-mount-transition'

function isActive(pathname: string, href: string): boolean {
  if (href === '/dashboard') return pathname === '/dashboard'
  return pathname === href || pathname.startsWith(href + '/')
}

// ---------------------------------------------------------------------------
// Desktop sidebar (hidden on mobile)
// ---------------------------------------------------------------------------
export function Sidebar({ role }: { role: UserRole }) {
  const pathname = usePathname()
  const items = navForRole(role)

  return (
    <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:shrink-0 lg:h-screen lg:sticky lg:top-0 px-4 py-6 gap-2">
      <Link href="/dashboard" className="flex items-center gap-2.5 px-3 mb-6">
        <span className="grid place-items-center w-9 h-9 rounded-xl btn-primary">
          <Icon name="logo" className="w-5 h-5" />
        </span>
        <span className="font-display font-bold text-lg tracking-tight">
          IEDC Hub
        </span>
      </Link>

      <nav className="flex flex-col gap-1">
        {items.map((item) => {
          const active = isActive(pathname, item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                active
                  ? 'btn-primary'
                  : 'text-ink-soft hover:bg-white/70'
              }`}
            >
              <Icon name={item.icon} className="w-5 h-5 shrink-0" />
              {item.label}
            </Link>
          )
        })}
      </nav>

      <div className="mt-auto glass-soft rounded-2xl p-4 text-sm text-ink-soft">
        <div className="flex items-center gap-2 font-medium text-ink">
          <Icon name="rocket" className="w-4 h-4 text-indigo" />
          Keep building
        </div>
        <p className="mt-1 text-xs leading-relaxed">
          Join events, earn points, climb the leaderboard.
        </p>
      </div>
    </aside>
  )
}

// ---------------------------------------------------------------------------
// Mobile bottom navigation (hidden on desktop)
// ---------------------------------------------------------------------------
export function BottomNav({ role }: { role: UserRole }) {
  const pathname = usePathname()
  const items = mobileNavForRole(role)
  const moreItems = mobileMoreForRole(role)
  const [moreOpen, setMoreOpen] = useState(false)

  // Highlight "More" when the active route lives inside the extra items.
  const moreActive = moreItems.some((i) => isActive(pathname, i.href))

  return (
    <>
      <nav
        className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-white border-t border-black/5 px-2 pb-[env(safe-area-inset-bottom)]"
        aria-label="Primary"
      >
        <ul className="flex items-stretch justify-around">
          {items.map((item) => {
            const active = isActive(pathname, item.href)
            return (
              <li key={item.href} className="flex-1">
                <Link
                  href={item.href}
                  className={`flex flex-col items-center gap-1 py-1.5 text-[0.65rem] font-medium transition-colors ${
                    active ? 'text-indigo' : 'text-muted'
                  }`}
                >
                  <span
                    className={`grid place-items-center w-9 h-9 rounded-xl transition-colors ${
                      active ? 'bg-indigo/12' : ''
                    }`}
                  >
                    <Icon name={item.icon} className="w-5 h-5" />
                  </span>
                  {item.label}
                </Link>
              </li>
            )
          })}

          {moreItems.length > 0 && (
            <li className="flex-1">
              <button
                onClick={() => setMoreOpen(true)}
                aria-haspopup="dialog"
                aria-expanded={moreOpen}
                className={`w-full flex flex-col items-center gap-1 py-1.5 text-[0.65rem] font-medium transition-colors ${
                  moreActive ? 'text-indigo' : 'text-muted'
                }`}
              >
                <span
                  className={`grid place-items-center w-9 h-9 rounded-xl transition-colors ${
                    moreActive ? 'bg-indigo/12' : ''
                  }`}
                >
                  <Icon name="grid" className="w-5 h-5" />
                </span>
                More
              </button>
            </li>
          )}
        </ul>
      </nav>

      <MoreSheet
        open={moreOpen}
        onClose={() => setMoreOpen(false)}
        items={moreItems}
        pathname={pathname}
      />
    </>
  )
}

// Bottom sheet listing the role's extra (non-bar) navigation items.
function MoreSheet({
  open,
  onClose,
  items,
  pathname,
}: {
  open: boolean
  onClose: () => void
  items: NavItem[]
  pathname: string
}) {
  // Duration must be >= the .anim-drawer CSS transition (240ms) so the node
  // stays mounted until the slide-out finishes; otherwise it snaps away.
  const { mounted, show } = useMountTransition(open, 260)
  if (!mounted) return null

  return (
    <div className="lg:hidden fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label="More">
      {/* Backdrop */}
      <button
        aria-label="Close menu"
        data-show={show}
        onClick={onClose}
        className="anim-fade absolute inset-0 bg-ink/30 backdrop-blur-sm"
      />

      {/* Sheet */}
      <div
        data-show={show}
        className="anim-drawer absolute inset-x-0 bottom-0 bg-white rounded-t-3xl border-t border-black/10 shadow-[0_-20px_60px_-20px_rgba(40,52,92,0.35)] pb-[env(safe-area-inset-bottom)]"
      >
        <div className="flex items-center justify-between px-5 pt-4 pb-2">
          <h3 className="font-display font-semibold">More</h3>
          <button
            onClick={onClose}
            className="grid place-items-center w-8 h-8 rounded-full hover:bg-black/5"
            aria-label="Close"
          >
            <Icon name="chevron-down" className="w-5 h-5 text-muted" />
          </button>
        </div>
        <div className="mx-auto mb-1 h-1 w-10 rounded-full bg-black/10" />

        <ul className="p-3 grid grid-cols-2 gap-2">
          {items.map((item) => {
            const active = isActive(pathname, item.href)
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={onClose}
                  className={`flex items-center gap-3 rounded-2xl p-3 transition-colors ${
                    active
                      ? 'bg-indigo/12 text-indigo'
                      : 'bg-black/2 text-ink-soft hover:bg-black/5'
                  }`}
                >
                  <span
                    className={`grid place-items-center w-9 h-9 rounded-xl shrink-0 ${
                      active ? 'bg-indigo/15' : 'bg-white'
                    }`}
                  >
                    <Icon name={item.icon} className="w-5 h-5" />
                  </span>
                  <span className="text-sm font-medium">{item.label}</span>
                </Link>
              </li>
            )
          })}
        </ul>
      </div>
    </div>
  )
}
