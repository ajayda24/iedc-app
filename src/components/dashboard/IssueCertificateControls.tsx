'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  issueCertificateAction,
  revokeCertificateAction,
} from '@/lib/queries/certificate-actions'
import type { CertificateType } from '@/lib/supabase/database.types'
import Icon from '@/components/landing/Icon'

const TYPES: { key: CertificateType; label: string }[] = [
  { key: 'participation', label: 'Participation' },
  { key: 'winner', label: 'Winner' },
  { key: 'runnerup', label: 'Runner-up' },
  { key: 'volunteer', label: 'Volunteer' },
]

// Per-attendee certificate control on the registrations page. Two states:
//   - not yet issued -> a type dropdown + "Issue" button
//   - already issued -> the type badge, a "View" link, and a revoke button
// Only rendered for attended registrants of a completed event (the parent gates
// this); the server action re-checks both as the real boundary.
export default function IssueCertificateControls({
  eventId,
  profileId,
  existing,
}: {
  eventId: string
  profileId: string
  existing: { id: string; type: CertificateType; serial: string } | null
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  // Participation is auto-issued on attendance, so the manual picker defaults to
  // the next most common case: a winner certificate.
  const [type, setType] = useState<CertificateType>('winner')

  function issue() {
    setError(null)
    startTransition(async () => {
      const res = await issueCertificateAction({
        eventId,
        profileId,
        certificateType: type,
      })
      if (res.ok) router.refresh()
      else setError(res.error ?? 'Something went wrong.')
    })
  }

  function revoke() {
    if (!existing) return
    setError(null)
    startTransition(async () => {
      const res = await revokeCertificateAction(existing.id, eventId)
      if (res.ok) router.refresh()
      else setError(res.error ?? 'Could not revoke.')
    })
  }

  if (existing) {
    return (
      <div className="flex flex-col items-end gap-1">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-mint/15 px-2.5 py-1 text-xs font-semibold text-mint">
            <Icon name="check" className="w-3.5 h-3.5" />
            {TYPES.find((t) => t.key === existing.type)?.label}
          </span>
          <Link
            href={`/certificates/${existing.serial}`}
            className="text-xs font-semibold text-indigo hover:underline"
          >
            View
          </Link>
          <button
            type="button"
            onClick={revoke}
            disabled={pending}
            className="text-muted hover:text-peach transition-colors disabled:opacity-50"
            aria-label="Revoke certificate"
          >
            <Icon name="trash" className="w-4 h-4" />
          </button>
        </div>
        {error && <span className="text-xs text-peach">{error}</span>}
      </div>
    )
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex items-center gap-2">
        <select
          value={type}
          onChange={(e) => setType(e.target.value as CertificateType)}
          disabled={pending}
          className="rounded-lg bg-white/70 border border-black/10 px-2.5 py-1.5 text-xs font-semibold text-ink-soft focus:outline-none focus:ring-2 focus:ring-indigo/40"
          aria-label="Certificate type"
        >
          {TYPES.map((t) => (
            <option key={t.key} value={t.key}>
              {t.label}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={issue}
          disabled={pending}
          className="btn-primary inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold disabled:opacity-60"
        >
          <Icon name="certificate" className="w-3.5 h-3.5" />
          {pending ? 'Issuing…' : 'Issue'}
        </button>
      </div>
      {error && <span className="text-xs text-peach">{error}</span>}
    </div>
  )
}
