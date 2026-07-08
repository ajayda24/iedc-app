'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Icon from '@/components/landing/Icon'
import { deleteEventAction } from '@/lib/queries/manage-actions'
import ConfirmDialog from './ConfirmDialog'

// Header shortcuts on the event overview page: edit link + delete button.
// Delete confirms, then redirects back to the manage list (the event no longer
// exists, so staying on its overview would 404).
export default function EventOverviewActions({
  eventId,
  title,
}: {
  eventId: string
  title: string
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function confirmDelete() {
    setError(null)
    startTransition(async () => {
      const res = await deleteEventAction(eventId)
      if (res.ok) {
        setConfirmOpen(false)
        router.push('/dashboard/manage')
      } else {
        setError(res.error ?? 'Could not delete the event.')
      }
    })
  }

  return (
    <div className="flex items-center gap-2">
      <Link
        href={`/dashboard/manage/${eventId}/edit`}
        className="inline-flex items-center gap-1.5 rounded-2xl border border-black/10 bg-white/70 text-sm font-semibold text-ink-soft px-3.5 py-2 hover:bg-white transition-colors"
      >
        <Icon name="edit" className="w-4 h-4" />
        Edit
      </Link>
      <button
        type="button"
        onClick={() => {
          setError(null)
          setConfirmOpen(true)
        }}
        disabled={pending}
        className="inline-flex items-center gap-1.5 rounded-2xl border border-peach/30 bg-peach/10 text-sm font-semibold text-peach px-3.5 py-2 hover:bg-peach/15 transition-colors disabled:opacity-50"
      >
        <Icon name="trash" className="w-4 h-4" />
        Delete
      </button>

      {error && <span className="text-xs text-peach">{error}</span>}

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
