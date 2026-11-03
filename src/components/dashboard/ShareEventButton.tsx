'use client'

import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import Icon from '@/components/landing/Icon'

// Share an event's PUBLIC page (/events/[id]) — the one guests can open and
// register from without an account. Phones get the native share sheet
// (WhatsApp, Telegram, …); elsewhere a small menu offers WhatsApp + copy link.
//
// The URL is built from the current origin so it's right on localhost, preview
// and production alike. Drafts aren't public, so callers hide this for them.
//
// The menu is portalled to <body> and fixed against the button: `.glass` cards
// use backdrop-filter (which traps fixed children) and overflow-hidden, so an
// in-place menu would be clipped. It opens below unless there's no room.
const MENU_HEIGHT = 96

type MenuPos = { top: number; right: number } | { bottom: number; right: number }

export default function ShareEventButton({
  eventId,
  title,
  variant = 'icon',
}: {
  eventId: string
  title: string
  // 'icon': compact square (cards, list rows). 'button': labelled pill.
  variant?: 'icon' | 'button'
}) {
  const [pos, setPos] = useState<MenuPos | null>(null)
  const [copied, setCopied] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const open = pos !== null

  // Close the menu on outside click, Escape, scroll or resize (a fixed menu
  // would otherwise drift away from its button).
  useEffect(() => {
    if (!open) return
    const close = () => setPos(null)
    function onDown(e: MouseEvent) {
      const t = e.target as Node
      if (!rootRef.current?.contains(t) && !menuRef.current?.contains(t)) close()
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') close()
    }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    window.addEventListener('scroll', close, true)
    window.addEventListener('resize', close)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
      window.removeEventListener('scroll', close, true)
      window.removeEventListener('resize', close)
    }
  }, [open])

  function toggleMenu(button: HTMLElement) {
    if (open) {
      setPos(null)
      return
    }
    const r = button.getBoundingClientRect()
    const right = window.innerWidth - r.right
    setPos(
      window.innerHeight - r.bottom >= MENU_HEIGHT + 8
        ? { top: r.bottom + 8, right }
        : { bottom: window.innerHeight - r.top + 8, right }
    )
  }

  function publicUrl() {
    return `${window.location.origin}/events/${eventId}`
  }
  const text = `${title} — register on IEDC Hub`

  async function share(e: React.MouseEvent) {
    // Cards wrap content in a Link; never let the click navigate.
    e.preventDefault()
    e.stopPropagation()
    const button = e.currentTarget as HTMLElement
    const url = publicUrl()
    // Native sheet only on touch devices; desktop share sheets are clunky.
    const touch = window.matchMedia('(pointer: coarse)').matches
    if (touch && navigator.share) {
      try {
        await navigator.share({ title, text, url })
        return
      } catch (err) {
        // User dismissed the sheet: nothing to do.
        if ((err as Error).name === 'AbortError') return
      }
    }
    toggleMenu(button)
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(publicUrl())
      setCopied(true)
      setTimeout(() => {
        setCopied(false)
        setPos(null)
      }, 1200)
    } catch {
      // Clipboard blocked — fall back to a prompt the user can copy from.
      window.prompt('Copy this link:', publicUrl())
    }
  }

  return (
    <div ref={rootRef} className="relative shrink-0">
      {variant === 'icon' ? (
        <button
          type="button"
          onClick={share}
          aria-label="Share event"
          title="Share public link"
          className="grid place-items-center w-8 h-8 rounded-xl text-ink-soft hover:bg-white/70 transition-colors"
        >
          <Icon name="link" className="w-4 h-4" />
        </button>
      ) : (
        <button
          type="button"
          onClick={share}
          className="inline-flex items-center gap-1.5 rounded-2xl border border-black/10 bg-white/70 text-sm font-semibold text-ink-soft px-3.5 py-2 hover:bg-white transition-colors"
        >
          <Icon name="link" className="w-4 h-4" />
          Share
        </button>
      )}

      {pos &&
        createPortal(
        <div
          ref={menuRef}
          role="menu"
          style={pos}
          className="fixed z-50 w-48 rounded-2xl border border-black/10 bg-white p-1.5 shadow-lg"
        >
          <a
            role="menuitem"
            href={`https://wa.me/?text=${encodeURIComponent(`${text}\n${publicUrl()}`)}`}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => setPos(null)}
            className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-ink-soft hover:bg-black/5"
          >
            <Icon name="phone" className="w-4 h-4 text-mint" />
            WhatsApp
          </a>
          <button
            type="button"
            role="menuitem"
            onClick={copy}
            className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-ink-soft hover:bg-black/5"
          >
            <Icon name={copied ? 'check' : 'link'} className="w-4 h-4 text-indigo" />
            {copied ? 'Link copied' : 'Copy link'}
          </button>
        </div>,
          document.body
        )}
    </div>
  )
}
