'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Icon from '@/components/landing/Icon'
import {
  setEventStatusAction,
  deleteEventAction,
} from '@/lib/queries/manage-actions'
import ConfirmDialog from './ConfirmDialog'
import type { EventStatus } from '@/lib/supabase/database.types'

// Row actions for a managed event: edit link, a primary status transition, and
// delete. Coordinators and admins see the same set (both are staff in RLS).
export default function ManageEventActions({
  eventId,
  title,
  status,
}: {
  eventId: string
  title: string
  status: EventStatus
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function setStatus(next: EventStatus) {
    setError(null)
    startTransition(async () => {
      const res = await setEventStatusAction(eventId, next)
      // revalidatePath alone won't repaint this client tree — refresh so the
      // row's status/actions update immediately.
      if (res.ok) router.refresh()
      else setError(res.error ?? 'Something went wrong.')
    })
  }

  function confirmDelete() {
    setError(null)
    startTransition(async () => {
      const res = await deleteEventAction(eventId)
      if (res.ok) {
        setConfirmOpen(false)
        router.refresh()
      } else {
        setError(res.error ?? 'Could not delete the event.')
      }
    })
  }

  return (
    <div className="flex flex-wrap items-center justify-end gap-1.5">
      {status === 'draft' && (
        <ActionButton
          onClick={() => setStatus('published')}
          disabled={pending}
          tint="indigo"
        >
          Publish
        </ActionButton>
      )}
      {status === 'published' && (
        <>
          <ActionButton
            onClick={() => setStatus('completed')}
            disabled={pending}
            tint="mint"
          >
            Complete
          </ActionButton>
          <ActionButton
            onClick={() => setStatus('draft')}
            disabled={pending}
            tint="muted"
          >
            Unpublish
          </ActionButton>
        </>
      )}
      {(status === 'draft' || status === 'published') && (
        <ActionButton
          onClick={() => setStatus('cancelled')}
          disabled={pending}
          tint="peach"
        >
          Cancel
        </ActionButton>
      )}

      <Link
        href={`/dashboard/manage/${eventId}/overview`}
        aria-label="View event overview"
        className="grid place-items-center w-8 h-8 rounded-xl text-ink-soft hover:bg-white/70 transition-colors"
      >
        <Icon name="team" className="w-4 h-4" />
      </Link>
      <Link
        href={`/dashboard/manage/${eventId}/edit`}
        aria-label="Edit event"
        className="grid place-items-center w-8 h-8 rounded-xl text-ink-soft hover:bg-white/70 transition-colors"
      >
        <Icon name="edit" className="w-4 h-4" />
      </Link>
      <button
        onClick={() => {
          setError(null)
          setConfirmOpen(true)
        }}
        disabled={pending}
        aria-label="Delete event"
        className="grid place-items-center w-8 h-8 rounded-xl text-peach hover:bg-peach/10 transition-colors disabled:opacity-50"
      >
        <Icon name="trash" className="w-4 h-4" />
      </button>

      {error && (
        <p className="w-full text-right text-xs text-peach">{error}</p>
      )}

      <ConfirmDialog
        open={confirmOpen}
        title="Delete event"
        message={`“${title}” and its registrations will be permanently removed. This cannot be undone.`}
        confirmLabel="Delete"
        pending={pending}
        onConfirm={confirmDelete}
        onClose={() => !pending && setConfirmOpen(false)}
      />
    </div>
  )
}

const TINTS: Record<string, string> = {
  indigo: 'text-indigo hover:bg-indigo/10',
  mint: 'text-mint hover:bg-mint/10',
  peach: 'text-peach hover:bg-peach/10',
  muted: 'text-muted hover:bg-black/5',
}

function ActionButton({
  children,
  onClick,
  disabled,
  tint,
}: {
  children: React.ReactNode
  onClick: () => void
  disabled?: boolean
  tint: keyof typeof TINTS
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`text-xs font-semibold px-2.5 py-1.5 rounded-xl transition-colors disabled:opacity-50 ${TINTS[tint]}`}
    >
      {children}
    </button>
  )
}
