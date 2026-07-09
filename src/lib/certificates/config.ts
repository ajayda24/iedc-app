// App-level certificate identity: the issuing org, the signatories, the partner
// logo strip, and the centered watermark. These are the ONE place to tweak what
// every certificate shows — templates read them, never hard-code them.
//
// To add assets: drop files in public/certificates/ and reference them as
// '/certificates/logo.svg' etc. (Next serves /public at the site root.) SVG or
// transparent PNG work best for logos/signatures/watermark.

export const CERT_ORG = {
  name: 'IEDC Hub',
  tagline: 'Innovation & Entrepreneurship',
  // e.g. '/certificates/logo.svg' — null renders the lettermark fallback.
  logoUrl: null as string | null,
}

// A signature block printed at the bottom. Add/remove entries freely — the
// template lays them out across the footer (2 is the typical case: the nodal
// officer on the left, the principal on the right). `signatureUrl` is the
// scanned/handwritten signature image drawn above the name; null falls back to
// a ruled line so the layout still reads correctly without an image.
export interface CertSignatory {
  name: string
  role: string
  signatureUrl: string | null
}

export const CERT_SIGNATORIES: CertSignatory[] = [
  {
    name: 'Ms. Chithra V',
    role: 'Nodal Officer, IEDC IET',
    // e.g. '/certificates/sign-nodal.png'
    signatureUrl: null,
  },
  {
    name: 'Dr. Jaya C K',
    role: 'Principal, IET',
    // e.g. '/certificates/sign-principal.png'
    signatureUrl: null,
  },
]

// The partner / affiliation logo strip shown centered along the footer (between
// the signatures), mirroring the printed IEDC certificate: IIC, IEDC, Kerala
// Startup Mission (IEDC), etc. Add/remove/reorder freely — they lay out in a
// centered row and scale to fit. `src` points at a file in /public.
export interface CertLogo {
  src: string
  alt: string
}

export const CERT_LOGOS: CertLogo[] = [
  // Drop the real logo files in public/certificates/ and list them here, e.g.:
  // { src: '/certificates/iic.png', alt: "Institution's Innovation Council" },
  // { src: '/certificates/iedc.png', alt: 'IEDC IETCU' },
  // { src: '/certificates/ksum.png', alt: 'Kerala Startup Mission — IEDC' },
]

// A large, faint watermark centered behind the certificate body (e.g. the
// University of Calicut seal). Set `src` to a file in /public; `opacity`
// controls how faint it is (0.04–0.10 reads like a printed watermark). Set
// `src` to null to disable the watermark entirely.
export const CERT_WATERMARK = {
  // e.g. '/certificates/university-seal.png'
  src: null as string | null,
  alt: 'University seal',
  opacity: 0.06,
  // Watermark diameter as a share of the certificate width (0–1).
  scale: 0.42,
}
