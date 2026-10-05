'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import CertificateCanvas from './CertificateCanvas'
import CertificateActions from './CertificateActions'
import { TEMPLATE_LIST } from './templates'
import { DEFAULT_TEMPLATE } from '@/lib/certificates/template-map'
import {
  toManualCertificateData,
  makeManualSerial,
} from '@/lib/certificates/manual-data'
import type { CertificateType } from '@/lib/supabase/database.types'
import Icon from '@/components/landing/Icon'

// The form + live preview behind /certificate-generate. Every keystroke rebuilds
// CertificateData and re-renders the real template, so what staff see is exactly
// what the PNG/PDF export produces (both come from the same [data-cert-node]).

const TYPES: { value: CertificateType; label: string; hint: string }[] = [
  {
    value: 'participation',
    label: 'Participation',
    hint: 'Attended and took part',
  },
  { value: 'winner', label: 'Winner', hint: '1st place' },
  { value: 'runnerup', label: 'Runner-up', hint: 'Runner-up position' },
  { value: 'volunteer', label: 'Volunteer', hint: 'Helped run the event' },
]

const today = () => new Date().toISOString().slice(0, 10)

export default function CertificateGenerator() {
  const [recipientName, setRecipientName] = useState('')
  const [eventTitle, setEventTitle] = useState('')
  const [eventDate, setEventDate] = useState('')
  const [type, setType] = useState<CertificateType>('participation')
  const [issuedDate, setIssuedDate] = useState(today)
  const [serial, setSerial] = useState('')
  const [templateId, setTemplateId] = useState(DEFAULT_TEMPLATE)

  // Minted once per mount so the previewed serial matches the exported one —
  // regenerating it on every render would change the number mid-download.
  const [autoSerial, setAutoSerial] = useState(makeManualSerial)

  const trimmedName = recipientName.trim()
  const effectiveSerial = serial.trim() || autoSerial

  const data = useMemo(
    () =>
      toManualCertificateData({
        // Placeholder keeps the preview legible before anything is typed; the
        // export is gated on a real name below, so it never ships.
        recipientName: trimmedName || 'Recipient Name',
        eventTitle,
        eventDate,
        type,
        issuedDate,
        serial: effectiveSerial,
      }),
    [trimmedName, eventTitle, eventDate, type, issuedDate, effectiveSerial]
  )

  const ready = trimmedName.length > 0

  return (
    <main className="min-h-screen px-4 py-8 sm:py-12">
      <div className="mx-auto max-w-6xl flex flex-col gap-6">
        {/* header strip — mirrors the public certificate page */}
        <div className="flex items-center justify-between gap-4">
          <Link href="/" className="flex items-end gap-2.5">
            <Image
              src="/logo-transparent.png"
              alt=""
              width={371}
              height={371}
              className="h-7 w-auto"
              priority
            />
            <span className="font-display font-bold text-lg tracking-tight">
              HUB
            </span>
          </Link>
          <span className="inline-flex items-center gap-2 rounded-full bg-indigo/10 px-3 py-1 text-sm font-semibold text-indigo">
            <Icon name="certificate" className="w-4 h-4" />
            Manual generator
          </span>
        </div>

        <header className="flex flex-col gap-1.5">
          <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight">
            Certificate Generator
          </h1>
          <p className="text-sm text-ink-soft max-w-2xl">
            For events held before the site launched. Fill in the details, check
            the preview, then download. Nothing is saved — these certificates
            aren&apos;t verifiable online, so keep your own record of what you
            issued.
          </p>
        </header>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,340px)_minmax(0,1fr)] items-start">
          {/* ---- form ---- */}
          <form
            className="glass rounded-3xl p-5 flex flex-col gap-5 lg:sticky lg:top-6"
            onSubmit={(e) => e.preventDefault()}
          >
            <Field label="Recipient name" required>
              <input
                value={recipientName}
                onChange={(e) => setRecipientName(e.target.value)}
                placeholder="Ada Lovelace"
                autoFocus
                className={inputCls}
              />
            </Field>

            <Field label="Certificate type" required>
              <div className="grid grid-cols-2 gap-2">
                {TYPES.map((t) => {
                  const active = type === t.value
                  return (
                    <button
                      key={t.value}
                      type="button"
                      onClick={() => setType(t.value)}
                      aria-pressed={active}
                      title={t.hint}
                      className={`rounded-2xl border px-3 py-2.5 text-sm font-semibold text-left transition-colors ${
                        active
                          ? 'border-indigo/40 bg-indigo/10 text-indigo'
                          : 'border-black/10 bg-white/70 text-ink-soft hover:bg-white'
                      }`}
                    >
                      {t.label}
                    </button>
                  )
                })}
              </div>
            </Field>

            <Field label="Event name">
              <input
                value={eventTitle}
                onChange={(e) => setEventTitle(e.target.value)}
                placeholder="Ideathon 2025"
                className={inputCls}
              />
              <p className="text-xs text-muted">
                Leave blank for a general certificate with no specific event.
              </p>
            </Field>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Event date">
                <input
                  type="date"
                  value={eventDate}
                  onChange={(e) => setEventDate(e.target.value)}
                  className={inputCls}
                />
              </Field>
              <Field label="Issue date">
                <input
                  type="date"
                  value={issuedDate}
                  onChange={(e) => setIssuedDate(e.target.value)}
                  className={inputCls}
                />
              </Field>
            </div>

            <Field label="Certificate no.">
              <div className="flex gap-2">
                <input
                  value={serial}
                  onChange={(e) => setSerial(e.target.value)}
                  placeholder={autoSerial}
                  className={`${inputCls} font-mono tabular-nums`}
                />
                <button
                  type="button"
                  onClick={() => {
                    setSerial('')
                    setAutoSerial(makeManualSerial())
                  }}
                  title="Generate a new number"
                  className="shrink-0 rounded-2xl border border-black/10 bg-white/70 px-3 text-ink-soft hover:bg-white transition-colors"
                >
                  <Icon name="spark" className="w-4 h-4" />
                </button>
              </div>
              <p className="text-xs text-muted">
                Auto-generated. Manual numbers carry an{' '}
                <span className="font-mono">M</span> so they never clash with
                issued certificates.
              </p>
            </Field>

            {TEMPLATE_LIST.length > 1 && (
              <Field label="Template">
                <select
                  value={templateId}
                  onChange={(e) => setTemplateId(e.target.value)}
                  className={inputCls}
                >
                  {TEMPLATE_LIST.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </Field>
            )}
          </form>

          {/* ---- preview + export ---- */}
          <div className="flex flex-col gap-4 min-w-0">
            <CertificateCanvas data={data} templateId={templateId} />

            <div className="glass rounded-3xl p-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-sm">
                <p className="text-muted">Certificate No.</p>
                <p className="font-semibold font-mono tabular-nums">
                  {data.serial}
                </p>
              </div>

              {ready ? (
                <CertificateActions
                  serial={data.serial}
                  verifyUrl={data.verifyUrl}
                  recipientName={data.recipientName}
                />
              ) : (
                <p className="text-sm text-muted">
                  Enter a recipient name to download.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}

const inputCls =
  'w-full rounded-2xl border border-black/10 bg-white/70 px-3.5 py-2.5 text-sm outline-none focus:border-indigo/40 focus:bg-white transition-colors'

function Field({
  label,
  required,
  children,
}: {
  label: string
  required?: boolean
  children: React.ReactNode
}) {
  // A <div>, not a <label>: the type picker holds buttons, where a wrapping
  // label would double-fire clicks. Matches dashboard/EventForm.tsx.
  return (
    <div className="space-y-1.5">
      <span className="block text-sm font-medium text-ink-soft">
        {label}
        {required && <span className="text-peach"> *</span>}
      </span>
      {children}
    </div>
  )
}
