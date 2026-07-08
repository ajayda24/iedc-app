'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { issueAllCertificatesAction } from '@/lib/queries/certificate-actions'
import Icon from '@/components/landing/Icon'

// Bulk-issues participation certificates to every attended registrant of a
// completed event who doesn't already have one. Shown in the registrations page
// header. Winner/runner-up remain per-person via IssueCertificateControls.
export default function IssueAllCertificatesButton({
  eventId,
  pendingCount,
}: {
  eventId: string
  // How many attendees still lack a certificate — drives the label + disabled.
  pendingCount: number
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [msg, setMsg] = useState<string | null>(null)

  function run() {
    setMsg(null)
    startTransition(async () => {
      const res = await issueAllCertificatesAction({ eventId })
      if (res.ok) {
        setMsg(
          res.issued && res.issued > 0
            ? `Issued ${res.issued} certificate${res.issued === 1 ? '' : 's'}.`
            : 'Everyone already has one.'
        )
        router.refresh()
      } else {
        setMsg(res.error ?? 'Something went wrong.')
      }
    })
  }

  return (
    <div className="flex flex-col items-start sm:items-end gap-1">
      <button
        type="button"
        onClick={run}
        disabled={pending || pendingCount === 0}
        className="btn-primary inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold disabled:opacity-60"
      >
        <Icon name="certificate" className="w-4 h-4" />
        {pending
          ? 'Issuing…'
          : pendingCount === 0
            ? 'All issued'
            : `Issue participation to ${pendingCount}`}
      </button>
      {msg && <span className="text-xs text-muted">{msg}</span>}
    </div>
  )
}
