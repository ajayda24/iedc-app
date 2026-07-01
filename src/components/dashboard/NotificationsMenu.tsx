'use client'

import { useState, useRef, useEffect } from 'react'
import Icon from '@/components/landing/Icon'
import { relativeTime } from './format'
import { useMountTransition } from './use-mount-transition'
import type { Notification } from '@/lib/supabase/database.types'

export default function NotificationsMenu({
  notifications,
}: {
  notifications: Notification[]
}) {
  const [open, setOpen] = useState(false)
  const { mounted, show } = useMountTransition(open)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onClick)
      document.removeEventListener('keydown', onKey)
    }
  }, [])

  const count = notifications.length

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative grid place-items-center w-10 h-10 rounded-full hover:bg-white/70 transition-colors"
        aria-label="Notifications"
        aria-haspopup="dialog"
        aria-expanded={open}
      >
        <Icon name="bell" className="w-5 h-5 text-ink-soft" />
        {count > 0 && (
          <span className="absolute top-1.5 right-1.5 grid place-items-center min-w-[1.1rem] h-[1.1rem] px-1 rounded-full bg-indigo text-white text-[0.65rem] font-bold leading-none">
            {count > 9 ? '9+' : count}
          </span>
        )}
      </button>

      {mounted && (
        <>
          {/* Mobile-only tap-away backdrop (the click-outside handler covers the
              rest, but a backdrop makes the sheet feel intentional). */}
          <button
            aria-label="Close notifications"
            data-show={show}
            className="anim-fade sm:hidden fixed inset-0 z-40 bg-ink/20"
            onClick={() => setOpen(false)}
          />
          <div
            role="dialog"
            aria-label="Notifications"
            data-show={show}
            className="
              anim-sheet z-50 overflow-hidden bg-white border border-black/10
              shadow-[0_24px_60px_-20px_rgba(40,52,92,0.32)]
              fixed inset-x-3 top-16 rounded-2xl
              sm:absolute sm:inset-x-auto sm:right-0 sm:top-auto sm:mt-2 sm:w-88
            "
          >
          <div className="flex items-center justify-between px-4 py-3 border-b border-black/5">
            <h3 className="font-display font-semibold text-sm">Notifications</h3>
            {count > 0 && (
              <span className="text-xs text-muted">{count} recent</span>
            )}
          </div>

          {count === 0 ? (
            <div className="px-4 py-10 text-center">
              <span className="grid place-items-center w-11 h-11 rounded-2xl bg-black/5 text-muted mx-auto mb-3">
                <Icon name="bell" className="w-5 h-5" />
              </span>
              <p className="text-sm font-medium text-ink-soft">
                You&apos;re all caught up
              </p>
              <p className="text-xs text-muted mt-1">
                New updates will show up here.
              </p>
            </div>
          ) : (
            <ul className="max-h-[70vh] overflow-y-auto divide-y divide-black/5">
              {notifications.map((n) => (
                <li key={n.id} className="flex gap-3 px-4 py-3 hover:bg-black/2">
                  <span className="grid place-items-center w-8 h-8 rounded-xl bg-indigo/10 text-indigo shrink-0">
                    <Icon name="spark" className="w-4 h-4" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-medium">{n.title}</p>
                    <p className="text-xs text-ink-soft line-clamp-2">
                      {n.message}
                    </p>
                    <p className="text-[0.7rem] text-muted mt-0.5">
                      {relativeTime(n.created_at)}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
          </div>
        </>
      )}
    </div>
  )
}
