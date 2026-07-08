import type { CertificatePublic } from '@/lib/supabase/database.types'
import type { CertificateData } from '@/components/certificates/types'
import { CERT_ORG, CERT_SIGNATORY } from './config'

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
    signatory: { name: CERT_SIGNATORY.name, role: CERT_SIGNATORY.role },
    org: {
      name: CERT_ORG.name,
      tagline: CERT_ORG.tagline,
      logoUrl: CERT_ORG.logoUrl,
    },
  }
}
