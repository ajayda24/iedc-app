'use client'

import { useEffect } from 'react'
import Icon from '@/components/landing/Icon'
import { useMountTransition } from './use-mount-transition'

// Design-system confirmation modal (replaces window.confirm). Controlled via
// `open`; calls onConfirm/onClose. Renders nothing while fully closed.
export default function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  tone = 'danger',
  pending = false,
  onConfirm,
  onClose,
}: {
  open: boolean
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  tone?: 'danger' | 'default'
  pending?: boolean
  onConfirm: () => void
  onClose: () => void
}) {
  const { mounted, show } = useMountTransition(open)

  // Close on Escape and lock body scroll while open.
  useEffect(() => {
    if (!open) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [open, onClose])

  if (!mounted) return null

  const danger = tone === 'danger'

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      {/* Backdrop */}
      <button
        aria-label="Close"
        data-show={show}
        className="anim-fade absolute inset-0 bg-ink/30 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Panel */}
      <div
        data-show={show}
        className="anim-modal relative w-full max-w-sm rounded-3xl bg-white border border-black/10 shadow-[0_30px_80px_-20px_rgba(40,52,92,0.4)] p-6"
      >
        <div
          className={`grid place-items-center w-12 h-12 rounded-2xl mb-4 ${
            danger ? 'bg-peach/15 text-peach' : 'bg-indigo/12 text-indigo'
          }`}
        >
          <Icon name={danger ? 'trash' : 'spark'} className="w-6 h-6" />
        </div>

        <h2 className="font-display font-semibold text-lg">{title}</h2>
        <p className="text-sm text-ink-soft mt-1.5">{message}</p>

        <div className="flex items-center justify-end gap-2.5 mt-6">
          <button
            type="button"
            onClick={onClose}
            disabled={pending}
            className="rounded-2xl border border-black/10 text-ink-soft text-sm font-semibold px-4 py-2.5 hover:bg-white/60 transition-colors disabled:opacity-60"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={pending}
            className={`rounded-2xl text-white text-sm font-semibold px-4 py-2.5 transition-colors disabled:opacity-60 ${
              danger ? 'bg-peach hover:bg-peach/90' : 'bg-indigo hover:bg-indigo/90'
            }`}
          >
            {pending ? 'Working…' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
