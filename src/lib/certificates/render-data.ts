import type { CertificatePublic } from '@/lib/supabase/database.types'
import type { CertificateData } from '@/components/certificates/types'
import {
  CERT_ORG,
  CERT_SIGNATORIES,
  CERT_LOGOS,
  CERT_WATERMARK,
} from './config'

// "5 July 2026" — the human date printed on certificates. Distinct from the
// dashboard's fullDate() (which includes the weekday); a certificate reads
// cleaner without it.
function certDate(iso: string | null): string {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })
}

// Build the props a template renders from the anon-safe public view row.
// `origin` is the site origin (e.g. "https://iedchub.app") used to form the
// absolute verify URL; pass '' for a relative link.
export function toCertificateData(
  row: CertificatePublic,
  origin = ''
): CertificateData {
  return {
    recipientName: row.recipient_name,
    eventTitle: row.event_title,
    eventDate: certDate(row.event_date),
    type: row.certificate_type,
    issuedDate: certDate(row.issued_at),
    serial: row.serial,
    verifyUrl: `${origin}/certificates/${row.serial}`,
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
