'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { markAttendanceAction } from '@/lib/queries/manage-actions'
import type { RegistrationStatus } from '@/lib/supabase/database.types'

// Attended/Absent toggle for a single registrant. Disabled for cancelled
// registrations. Refreshes after a successful mark so counts update.
export default function AttendanceControls({
  registrationId,
  eventId,
  status,
}: {
  registrationId: string
  eventId: string
  status: RegistrationStatus
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  if (status === 'cancelled') {
    return <span className="text-xs text-muted">Cancelled</span>
  }

  function mark(next: 'attended' | 'absent') {
    setError(null)
    startTransition(async () => {
      const res = await markAttendanceAction(registrationId, eventId, next)
      if (res.ok) router.refresh()
      else setError(res.error ?? 'Something went wrong.')
    })
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex rounded-xl bg-black/5 p-0.5 text-xs font-semibold">
        <button
          type="button"
          onClick={() => mark('attended')}
          disabled={pending}
          className={`px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50 ${
            status === 'attended'
              ? 'bg-mint/90 text-white shadow-sm'
              : 'text-muted hover:text-ink-soft'
          }`}
        >
          Present
        </button>
        <button
          type="button"
          onClick={() => mark('absent')}
          disabled={pending}
          className={`px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50 ${
            status === 'absent'
              ? 'bg-peach/90 text-white shadow-sm'
              : 'text-muted hover:text-ink-soft'
          }`}
        >
          Absent
        </button>
      </div>
      {error && <span className="text-xs text-peach">{error}</span>}
    </div>
  )
}
