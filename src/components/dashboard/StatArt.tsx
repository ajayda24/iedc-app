// Decorative, self-contained SVG graphics that blend into the stat cards
// (see the dashboard). Each is a soft, filled pastel illustration anchored to
// the card's lower-right, tinted to the card color — echoing the reference
// dashboard. No external assets; `currentColor` follows the wrapper's text
// color so the tint matches the card.
//
// To revert the dashboard art: drop the `art` prop from <StatCard> usages and
// (optionally) delete this file — StatCard renders fine without it.

type ArtProps = { className?: string }

// Soft rising hump with a dot on the crest — "Events Joined". Filled pastel
// area that bleeds off the bottom edge, like the reference lavender curve.
export function AreaCurveArt({ className = '' }: ArtProps) {
  return (
    <svg
      viewBox="0 0 200 110"
      preserveAspectRatio="none"
      className={className}
      aria-hidden="true"
      fill="none"
    >
      <defs>
        <linearGradient id="art-area-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="currentColor" stopOpacity="0.5" />
          <stop offset="100%" stopColor="currentColor" stopOpacity="0.05" />
        </linearGradient>
      </defs>
      {/* A gentle bump: flat-ish, rises to a crest around x=140, dips slightly. */}
      <path
        d="M0 96 C46 92 74 90 104 70 C126 55 132 40 150 40 C168 40 182 52 200 58 L200 110 L0 110 Z"
        fill="url(#art-area-fill)"
      />
      <path
        d="M0 96 C46 92 74 90 104 70 C126 55 132 40 150 40 C168 40 182 52 200 58"
        stroke="currentColor"
        strokeOpacity="0.85"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <circle cx="150" cy="40" r="6" fill="currentColor" />
    </svg>
  )
}

// Steep saturated climb with a star at the crest — "Points Earned".
export function PointsArt({ className = '' }: ArtProps) {
  return (
    <svg
      viewBox="0 0 200 110"
      preserveAspectRatio="none"
      className={className}
      aria-hidden="true"
      fill="none"
    >
      <defs>
        <linearGradient id="art-points-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="currentColor" stopOpacity="0.5" />
          <stop offset="100%" stopColor="currentColor" stopOpacity="0.05" />
        </linearGradient>
      </defs>
      {/* Flat, then a sharp climb to a peak near the right edge. */}
      <path
        d="M0 100 C36 98 60 96 88 86 C112 78 122 58 138 40 C152 26 168 20 186 16 L200 20 L200 110 L0 110 Z"
        fill="url(#art-points-fill)"
      />
      <path
        d="M0 100 C36 98 60 96 88 86 C112 78 122 58 138 40 C152 26 168 20 186 16"
        stroke="currentColor"
        strokeOpacity="0.9"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      {/* Filled star sitting on the peak. */}
      <path
        d="M186 4 l2.7 5.5 6 .9 -4.4 4.2 1 6 -5.3-2.8 -5.3 2.8 1-6 -4.4-4.2 6-.9 Z"
        fill="currentColor"
      />
    </svg>
  )
}

// Upright certificate/document with a ribbon — "Certificates". Solid pastel
// fill so it reads as an illustration, not a wireframe.
export function CertificateArt({ className = '' }: ArtProps) {
  return (
    <svg
      viewBox="0 0 100 110"
      className={className}
      aria-hidden="true"
      fill="none"
    >
      {/* Back sheet (peeking, lighter). */}
      <rect
        x="30"
        y="16"
        width="52"
        height="66"
        rx="7"
        fill="currentColor"
        fillOpacity="0.18"
      />
      {/* Front sheet. */}
      <rect
        x="20"
        y="22"
        width="52"
        height="66"
        rx="7"
        fill="currentColor"
        fillOpacity="0.28"
      />
      {/* Text lines. */}
      <g stroke="#ffffff" strokeWidth="3.5" strokeLinecap="round" strokeOpacity="0.75">
        <path d="M30 40h32M30 52h32M30 64h18" />
      </g>
      {/* Seal + ribbon. */}
      <circle cx="60" cy="80" r="13" fill="currentColor" />
      <circle cx="60" cy="80" r="6" fill="#ffffff" fillOpacity="0.7" />
      <path d="M52 90 l-4 16 12-6 12 6 -4-16" fill="currentColor" />
    </svg>
  )
}

// Soft 3-bar podium with a flag on the tallest bar — "Rank".
export function PodiumArt({ className = '' }: ArtProps) {
  return (
    <svg
      viewBox="0 0 110 100"
      className={className}
      aria-hidden="true"
      fill="none"
    >
      {/* Bars (tallest in the middle). */}
      <rect x="10" y="58" width="28" height="42" rx="6" fill="currentColor" fillOpacity="0.35" />
      <rect x="72" y="68" width="28" height="32" rx="6" fill="currentColor" fillOpacity="0.25" />
      <rect x="41" y="42" width="28" height="58" rx="6" fill="currentColor" fillOpacity="0.5" />
      {/* Flag planted on the middle bar. */}
      <path d="M55 42V14" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" />
      <path d="M55 16 h20 l-6 7 6 7 h-20 Z" fill="currentColor" />
    </svg>
  )
}

// Map from a key to the matching art — keeps StatCard usage terse.
export const STAT_ART = {
  area: AreaCurveArt,
  points: PointsArt,
  certificate: CertificateArt,
  podium: PodiumArt,
} as const

export type StatArtKey = keyof typeof STAT_ART
