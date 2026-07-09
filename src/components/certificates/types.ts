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
  /** Signatory blocks printed in the footer (e.g. nodal officer + principal). */
  signatories: {
    name: string
    role: string
    signatureUrl: string | null
  }[]
  /** Partner / affiliation logos shown centered in the footer. */
  logos: { src: string; alt: string }[]
  /** Faint centered watermark (e.g. university seal). `src` null = disabled. */
  watermark: {
    src: string | null
    alt: string
    opacity: number
    scale: number
  }
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
  /**
   * Color of the highlighted phrases in the citation (event name, date, the
   * placement). Optional — defaults to `accent` when omitted.
   */
  highlightColor?: string
  /**
   * CSS gradient (or any CSS color) for the recipient's name. Optional —
   * defaults to `linear-gradient(100deg, accent, accent2 70%)` when omitted.
   * e.g. 'linear-gradient(100deg, #7a6cff, #6c8cff 70%)' or a solid '#0e1525'.
   */
  nameGradient?: string
  /** Uppercase kicker, e.g. "Certificate of Participation". */
  kicker: string
  /** Lead-in line above the name, e.g. "This certifies that". */
  lead: string
  /**
   * Builds the citation sentence under the name as JSX. Receives helpers so
   * each variant can emphasize the meaningful bits (event name, date, the
   * placement) via `hi(...)` — which renders them in the accent, bold.
   */
  citation: (parts: CitationParts) => React.ReactNode
}

// Helpers passed to a variant's `citation()` so it can compose a sentence with
// selected phrases highlighted.
export interface CitationParts {
  /** The event title, already highlighted (or a fallback phrase if no event). */
  event: React.ReactNode
  /** The event date, already highlighted (empty node when there's no date). */
  date: React.ReactNode
  /** True when this certificate has a real event (vs. the generic fallback). */
  hasEvent: boolean
  /** Wrap any text to render it highlighted (accent color, bold). */
  hi: (text: string) => React.ReactNode
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
