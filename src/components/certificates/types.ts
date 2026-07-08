import type { CertificateType } from '@/lib/supabase/database.types'

// The normalized data a certificate template renders. Built once (see
// lib/certificates/render-data.ts) from a certificate row + its joined event and
// recipient, so templates stay pure and presentational — they receive strings,
// never query anything.
export interface CertificateData {
  /** Full name printed as the recipient. */
  recipientName: string
  /** Event this certificate is for. May be null for standalone certificates. */
  eventTitle: string | null
  /** Human-readable event date, e.g. "5 July 2026". Empty when no event. */
  eventDate: string
  /** participation | winner | runnerup | volunteer. Drives accent + wording. */
  type: CertificateType
  /** Human-readable issue date, e.g. "07 July 2026". */
  issuedDate: string
  /** Public verification code, e.g. "IEDC-2026-0A7F3C". */
  serial: string
  /** Absolute or relative URL this certificate verifies at (for the QR / footer). */
  verifyUrl: string
  /** Signatory block. App-level config for now; wire to org settings later. */
  signatory: { name: string; role: string }
  /** Org identity shown in the header/seal. */
  org: { name: string; tagline: string; logoUrl: string | null }
}

// A per-type visual + copy variant. One template covers all four certificate
// types by switching accents, the kicker, the title line, and how the citation
// sentence reads.
export interface CertificateTypeVariant {
  /** Primary accent (hex or CSS var). */
  accent: string
  /** Secondary accent for gradients. */
  accent2: string
  /** Uppercase kicker, e.g. "Certificate of Participation". */
  kicker: string
  /** Lead-in line above the name, e.g. "This certifies that". */
  lead: string
  /**
   * Builds the citation sentence under the name. Receives the resolved event
   * title (already falls back to a sensible phrase when there's no event).
   */
  citation: (eventTitle: string) => string
}

// A certificate template: an id, display metadata, and a pure React component.
// Registered in components/certificates/templates/index.ts.
export interface CertificateTemplate {
  id: string
  label: string
  /** Short description shown when staff pick a template for an event. */
  description: string
  Component: React.ComponentType<{ data: CertificateData }>
}

// Fixed print geometry shared by every template: A4 landscape at 96dpi. The
// canvas renders at this pixel size and is scaled to fit its container, so the
// on-screen preview is identical to the exported PNG/PDF.
export const CERT_WIDTH = 1123
export const CERT_HEIGHT = 794
