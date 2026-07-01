'use client'

import { useState, useRef, useEffect } from 'react'
import Icon from '@/components/landing/Icon'
import { logout } from '@/lib/auth/actions'
import { useMountTransition } from './use-mount-transition'
import type { ProfileCurrent } from '@/lib/supabase/database.types'

const ROLE_LABEL: Record<string, string> = {
  student: 'Student',
  coordinator: 'Coordinator',
  admin: 'Admin',
}

function initials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('')
}

export default function UserMenu({ profile }: { profile: ProfileCurrent }) {
  const [open, setOpen] = useState(false)
  const { mounted, show } = useMountTransition(open)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2.5 rounded-full pl-1 pr-2.5 py-1 hover:bg-white/70 transition-colors"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        {profile.avatar ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={profile.avatar}
            alt=""
            className="w-9 h-9 rounded-full object-cover"
          />
        ) : (
          <span className="grid place-items-center w-9 h-9 rounded-full btn-primary text-sm font-semibold">
            {initials(profile.name)}
          </span>
        )}
        <span className="hidden sm:flex flex-col items-start leading-tight">
          <span className="text-sm font-semibold">{profile.name}</span>
          <span className="text-xs text-muted">
            {ROLE_LABEL[profile.role]} · {profile.department}
          </span>
        </span>
        <Icon name="chevron-down" className="w-4 h-4 text-muted hidden sm:block" />
      </button>

      {mounted && (
        <div
          role="menu"
          data-show={show}
          className="anim-pop absolute right-0 mt-2 w-56 rounded-2xl p-2 z-50 bg-white border border-black/10 shadow-[0_24px_60px_-20px_rgba(40,52,92,0.32)]"
        >
          <div className="px-3 py-2 border-b border-black/5 mb-1">
            <p className="text-sm font-semibold truncate">{profile.name}</p>
            <p className="text-xs text-muted truncate">{profile.email}</p>
          </div>
          <form action={logout}>
            <button
              type="submit"
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm text-ink-soft hover:bg-white/70 transition-colors"
            >
              <Icon name="log-out" className="w-4 h-4" />
              Sign out
            </button>
          </form>
        </div>
      )}
    </div>
  )
}
