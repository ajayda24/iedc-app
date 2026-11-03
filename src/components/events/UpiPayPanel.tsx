'use client'

import { useId, useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import Icon from '@/components/landing/Icon'
import { buildUpiLink, formatFee, isValidUtr, normalizeUtr } from '@/lib/events/upi'

// Pay-then-confirm panel for a paid event. Phones get a "Pay with UPI" button
// that opens the UPI app with everything prefilled; larger screens get a QR of
// the same link. Either way the student pastes the 12-digit UPI transaction ID
// (UTR) back here, which `onSubmit` sends to the server.
//
// Used by the dashboard register button and the public guest form, so it holds
// no registration logic of its own.
export default function UpiPayPanel({
  fee,
  upiId,
  payeeName,
  eventTitle,
  studentId,
  utr,
  onUtrChange,
}: {
  fee: number
  upiId: string
  payeeName: string | null
  eventTitle: string
  studentId?: string | null
  utr: string
  onUtrChange: (utr: string) => void
}) {
  const ids = useId()
  const [copied, setCopied] = useState(false)
  const link = buildUpiLink({
    upiId,
    payeeName,
    amount: fee,
    eventTitle,
    studentId,
  })
  const showUtrError = utr.trim().length > 0 && !isValidUtr(utr)

  async function copyUpiId() {
    try {
      await navigator.clipboard.writeText(upiId)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      // Clipboard blocked: the ID is visible and selectable anyway.
    }
  }

  return (
    <div className="space-y-3 rounded-2xl border border-indigo/15 bg-indigo/[0.04] p-3.5">
      <div className="flex items-baseline justify-between gap-2">
        <p className="text-sm font-semibold text-ink">
          Step 1 · Pay {formatFee(fee)}
        </p>
        {payeeName && (
          <p className="truncate text-xs text-muted">to {payeeName}</p>
        )}
      </div>

      {/* Phones: open the UPI app directly. */}
      <a
        href={link}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-ink text-white text-sm font-semibold py-2.5 hover:bg-ink/90 transition-colors sm:hidden"
      >
        <Icon name="phone" className="h-4 w-4" />
        Pay {formatFee(fee)} with UPI
      </a>

      {/* Larger screens: scan with a phone. */}
      <div className="hidden sm:flex items-center gap-3">
        <div className="rounded-xl bg-white p-2 shadow-sm shrink-0">
          <QRCodeSVG value={link} size={112} marginSize={0} />
        </div>
        <p className="text-xs text-ink-soft leading-relaxed">
          Scan with GPay, PhonePe or Paytm. The amount and a note with your
          details are filled in for you.
        </p>
      </div>

      <div className="flex items-center justify-between gap-2 rounded-xl bg-white/70 px-3 py-2 text-xs">
        <span className="min-w-0 truncate">
          <span className="text-muted">UPI ID </span>
          <span className="font-semibold text-ink select-all">{upiId}</span>
        </span>
        <button
          type="button"
          onClick={copyUpiId}
          className="shrink-0 font-semibold text-indigo hover:underline"
        >
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>

      <div>
        <label
          htmlFor={`${ids}-utr`}
          className="text-sm font-semibold text-ink"
        >
          Step 2 · UPI transaction ID
        </label>
        <input
          id={`${ids}-utr`}
          value={utr}
          onChange={(e) => onUtrChange(e.target.value)}
          inputMode="numeric"
          autoComplete="off"
          placeholder="12-digit UTR, e.g. 412345678901"
          aria-invalid={showUtrError}
          aria-describedby={`${ids}-utr-hint`}
          className="mt-1.5 w-full rounded-xl border border-black/10 bg-white/80 px-3.5 py-2.5 text-sm tracking-wide outline-none transition placeholder:tracking-normal placeholder:text-muted focus:border-indigo focus:ring-4 focus:ring-indigo/15"
        />
        <p
          id={`${ids}-utr-hint`}
          className={`mt-1.5 text-xs ${showUtrError ? 'text-peach' : 'text-muted'}`}
        >
          {showUtrError
            ? `That's ${normalizeUtr(utr).length} characters — a UTR is 12 digits.`
            : 'Find it in your UPI app under the payment details ("UPI transaction ID" / "UTR"). We verify it before the event.'}
        </p>
      </div>
    </div>
  )
}
