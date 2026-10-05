import type { CertificateType } from '@/lib/supabase/database.types'
import type { CertificateData } from '@/components/certificates/types'
import {
  CERT_ORG,
  CERT_SIGNATORIES,
  CERT_LOGOS,
  CERT_WATERMARK,
} from './config'

// Build CertificateData from hand-entered form values, for certificates that
// have no database row — events run before the site launched (see
// app/certificate-generate/page.tsx).
//
// The sibling of render-data.ts's toCertificateData(): same output shape, same
// org/signatory/logo/watermark config, so a manually generated certificate is
// visually identical to an issued one. Only the source of the recipient/event
// fields differs — a form instead of the `certificate_public` view.

export interface ManualCertificateInput {
  recipientName: string
  eventTitle: string
  /** ISO date (yyyy-mm-dd) from a date input, or '' when the event has no date. */
  eventDate: string
  type: CertificateType
  /** ISO date (yyyy-mm-dd). Defaults to today when empty. */
  issuedDate: string
  /** Optional override; a manual serial is minted when blank. */
  serial: string
}

// Match render-data.ts's certDate(): "05 July 2026".
function certDate(iso: string): string {
  if (!iso) return ''
  // A bare yyyy-mm-dd parses as UTC midnight, which shifts back a day in
  // negative-offset zones. Append a time so it's read in local time instead.
  const d = new Date(/^\d{4}-\d{2}-\d{2}$/.test(iso) ? `${iso}T00:00:00` : iso)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })
}

// Mint a serial for a certificate that has no database row.
//
// Issued certificates get `IEDC-<YYYY>-<6 hex>` from a Postgres trigger, keyed
// off the row's uuid (see supabase/certificates-module.sql). A manual serial
// must never look like one of those, because `/certificates/<serial>` would
// 404: there is no row to verify against. So we mint `IEDC-<YYYY>-M<5 hex>` —
// the `M` marks it manual and keeps it outside the trigger's pure-hex space,
// so the two can never collide.
export function makeManualSerial(year = new Date().getFullYear()): string {
  const hex = Array.from({ length: 5 }, () =>
    Math.floor(Math.random() * 16)
      .toString(16)
      .toUpperCase()
  ).join('')
  return `IEDC-${year}-M${hex}`
}

export function toManualCertificateData(
  input: ManualCertificateInput
): CertificateData {
  const issuedIso = input.issuedDate || new Date().toISOString().slice(0, 10)
  const eventTitle = input.eventTitle.trim()

  return {
    recipientName: input.recipientName.trim(),
    // Null (not '') when absent — templates branch on it to swap in the
    // generic "the activities of the IEDC Hub" citation.
    eventTitle: eventTitle || null,
    eventDate: certDate(input.eventDate),
    type: input.type,
    issuedDate: certDate(issuedIso),
    serial: input.serial.trim() || makeManualSerial(),
    // Manual certificates have no database row, so `/certificates/<serial>`
    // would 404 — there is nothing to verify against. Empty rather than a dead
    // link. (Aurora's verify footer is currently commented out, so this prints
    // nothing; a template that does render it should treat '' as "omit".)
    verifyUrl: '',
    signatories: CERT_SIGNATORIES.map((s) => ({
      name: s.name,
      role: s.role,
      signatureUrl: s.signatureUrl,
    })),
    logos: CERT_LOGOS.map((l) => ({ src: l.src, alt: l.alt })),
    watermark: {
      src: CERT_WATERMARK.src,
      alt: CERT_WATERMARK.alt,
      opacity: CERT_WATERMARK.opacity,
      scale: CERT_WATERMARK.scale,
    },
    org: {
      name: CERT_ORG.name,
      tagline: CERT_ORG.tagline,
      logoUrl: CERT_ORG.logoUrl,
    },
  }
}
