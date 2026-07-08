'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { deleteStudentAction } from '@/lib/queries/roster-actions'
import ConfirmDialog from './ConfirmDialog'
import { Pill } from './ui'
import { yearLabel } from './format'
import Icon from '@/components/landing/Icon'
import type { RosterStudent } from '@/lib/queries/roster'

// One roster row: identity + department/year, with an admin delete. Removing a
// roster entry does NOT delete an existing account (profiles key on student_id),
// but it will stop a not-yet-registered student from signing up.
export default function RosterRow({ student }: { student: RosterStudent }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function confirmDelete() {
    setError(null)
    startTransition(async () => {
      const res = await deleteStudentAction(student.id)
      if (res.ok) {
        setConfirmOpen(false)
        router.refresh()
      } else {
        setError(res.error ?? 'Could not remove.')
      }
    })
  }

  return (
    <li className="flex flex-wrap items-center gap-3 px-4 sm:px-5 py-3.5">
      <div className="min-w-0 flex-1">
        <p className="font-semibold truncate">{student.name}</p>
        <p className="text-sm text-muted truncate">
          {student.student_id} · {student.email}
        </p>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <Pill tint="indigo">{student.department}</Pill>
        {student.is_alumni ? (
          <Pill tint="muted">Alumni</Pill>
        ) : (
          <Pill tint="mint">{yearLabel(student.year)}</Pill>
        )}
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {error && <span className="text-xs text-peach">{error}</span>}
        <button
          type="button"
          onClick={() => {
            setError(null)
            setConfirmOpen(true)
          }}
          disabled={pending}
          aria-label={`Remove ${student.name}`}
          className="grid place-items-center w-8 h-8 rounded-xl text-peach hover:bg-peach/10 transition-colors disabled:opacity-50"
        >
          <Icon name="trash" className="w-4 h-4" />
        </button>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        title="Remove from roster"
        message={`Remove ${student.name} (${student.student_id}) from the roster? If they haven't signed up yet, they won't be able to. Existing accounts are unaffected.`}
        confirmLabel="Remove"
        pending={pending}
        onConfirm={confirmDelete}
        onClose={() => !pending && setConfirmOpen(false)}
      />
    </li>
  )
}
