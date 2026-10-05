import Image from 'next/image'
import type {
  CertificateData,
  CertificateTypeVariant,
} from '@/components/certificates/types'
import type { CertificateType } from '@/lib/supabase/database.types'

// Laurel — split-panel certificate. A deep, saturated vertical band on the
// right carries the seal and the credential facts; the left is clean paper for
// the citation. Drawn from the reference set: the rounded dark side panel and
// the ribbon-tailed seal straddling the seam, plus corner blocks and a ruled
// two-signature footer.
//
// Deliberately NOT copied from the references: they fill the panel with a
// paragraph of body copy. CertificateData has no such field, so the panel
// carries the seal, award type, date, and serial instead — real data rather
// than invented filler.
//
// Two constraints shape the palette:
//   1. The recipient name stays deep ink on the light side (Meridian's rule) —
//      the metallic-text-on-white failure is what made the old winner and
//      runner-up variants illegible.
//   2. org.logoUrl and data.logos are DARK marks on transparency, so they
//      cannot sit on the dark panel. All branding lives on the light side —
//      the org lockup in the header, the institution logos centered in the
//      signature row — and the panel gets the seal.
//
// Server-safe (no hooks). Sizes in cqw so export == preview.

// Per-type palette. `panel`/`panel2` build the side-band gradient; `accent` is
// the metallic used for the seal ring, rules, and corner blocks.
interface LaurelPalette {
  panel: string
  panel2: string
  sealRing: string
  sealRing2: string
}

const PALETTES: Record<CertificateType, LaurelPalette> = {
  // Indigo — matches the site's primary brand color.
  participation: {
    panel: '#1B2A6B',
    panel2: '#0C1236',
    sealRing: '#8FA6FF',
    sealRing2: '#4F7CFF',
  },
  // Midnight + true gold. The gold reads because it sits on a dark field.
  winner: {
    panel: '#241A05',
    panel2: '#0E0A02',
    sealRing: '#F2CE6B',
    sealRing2: '#C08A16',
  },
  // Graphite + bright steel — silver that actually looks like silver.
  runnerup: {
    panel: '#20293A',
    panel2: '#0B0F17',
    sealRing: '#D6E1F0',
    sealRing2: '#8FA3BC',
  },
  // Deep teal-green.
  volunteer: {
    panel: '#06382B',
    panel2: '#021611',
    sealRing: '#6FE7BE',
    sealRing2: '#12A87C',
  },
}

const VARIANTS: Record<CertificateType, CertificateTypeVariant> = {
  participation: {
    accent: '#2F4FC0',
    accent2: '#6C8CFF',
    highlightColor: '#2F4FC0',
    nameGradient: '#0B1220',
    kicker: 'Certificate of Participation',
    lead: 'This is to certify that',
    citation: ({ event, date, hasEvent }) => (
      <>
        has actively participated in {event}
        {hasEvent && date ? <> held on {date}</> : null}, demonstrating
        initiative, collaboration, and a genuine commitment to building.
      </>
    ),
  },
  winner: {
    accent: '#8A6410',
    accent2: '#D4A02C',
    highlightColor: '#7A5709',
    nameGradient: '#0B1220',
    kicker: 'Certificate of Achievement',
    lead: 'This is proudly awarded to',
    citation: ({ event, date, hasEvent, hi }) => (
      <>
        for securing {hi('First Place')} at {event}
        {hasEvent && date ? <> held on {date}</> : null} — an outstanding result
        achieved through skill, originality, and execution.
      </>
    ),
  },
  runnerup: {
    accent: '#4A5A72',
    accent2: '#94A6BF',
    highlightColor: '#3D4B60',
    nameGradient: '#0B1220',
    kicker: 'Certificate of Excellence',
    lead: 'This is proudly awarded to',
    citation: ({ event, date, hasEvent, hi }) => (
      <>
        for securing the {hi('Runner-up position')} at {event}
        {hasEvent && date ? <> held on {date}</> : null}, standing among the very
        best of the cohort.
      </>
    ),
  },
  volunteer: {
    accent: '#0B7A5A',
    accent2: '#3FCFA4',
    highlightColor: '#0B7A5A',
    nameGradient: '#0B1220',
    kicker: 'Certificate of Appreciation',
    lead: 'This is presented to',
    citation: ({ event, date, hasEvent }) => (
      <>
        in grateful recognition of outstanding service as a volunteer for{' '}
        {event}
        {hasEvent && date ? <> held on {date}</> : null}, whose effort behind the
        scenes made the event possible.
      </>
    ),
  },
}

// The panel's outline, in its own W x H viewBox coordinates.
//
// NOT a border-radius. The left boundary is a single diagonal sweep: it meets
// the top edge well right of the panel's own left side, curves down and to the
// left, and by roughly a third of the way down has settled onto a straight
// vertical line that runs unbroken to the bottom, where a small radius turns it
// into the bottom edge.
//
//   y   0..250  diagonal sweep, x=150 -> x=40
//   y 250..760  straight at x=40
//   y 760..794  small turn into the bottom edge
//
// Kink-free join: the sweep's second control point sits directly ABOVE the
// settle point, so its tangent is vertical where it meets the straight run.
// Move Y_SETTLE and that control point must move with it or a corner appears.
//
// W MUST match .lrl-panel's rendered width (31cqw of the 1123px card = 348).
// The svg uses preserveAspectRatio="none", so a mismatch does not error — it
// silently rescales every x below and the numbers stop describing the drawing.
const W = 348
const H = 794
const X_ENTRY = 150
// x of the straight run — the innermost point of the edge, and therefore what
// sets the panel's left padding.
const X_MID = 40
const Y_SETTLE = 250
const R_BOT = 34
const R_OUT = 26

const PANEL_EDGE =
  `M ${X_ENTRY} 0 ` +
  `C ${X_ENTRY - 58} 0, ${X_MID} 84, ${X_MID} ${Y_SETTLE} ` +
  `L ${X_MID} ${H - R_BOT} ` +
  `A ${R_BOT} ${R_BOT} 0 0 0 ${X_MID + R_BOT} ${H}`

// Closed shape: the swept left edge, then along the bottom, up the flush right
// side (the card's own 26px corners), and back along the top.
const PANEL_PATH =
  PANEL_EDGE +
  ` L ${W - R_OUT} ${H} ` +
  `A ${R_OUT} ${R_OUT} 0 0 0 ${W} ${H - R_OUT} ` +
  `L ${W} ${R_OUT} ` +
  `A ${R_OUT} ${R_OUT} 0 0 0 ${W - R_OUT} 0 Z`

// Short label shown on the seal and in the panel's award line.
const TYPE_LABEL: Record<CertificateType, string> = {
  participation: 'Participation',
  winner: 'First Place',
  runnerup: 'Runner-up',
  volunteer: 'Volunteer',
}

function vars(
  v: CertificateTypeVariant,
  p: LaurelPalette
): React.CSSProperties {
  return {
    ['--a' as string]: v.accent,
    ['--a2' as string]: v.accent2,
    ['--hi' as string]: v.highlightColor ?? v.accent,
    ['--name-grad' as string]: v.nameGradient ?? '#0B1220',
    ['--panel' as string]: p.panel,
    ['--panel2' as string]: p.panel2,
    ['--ring' as string]: p.sealRing,
    ['--ring2' as string]: p.sealRing2,
  }
}

export default function Laurel({ data }: { data: CertificateData }) {
  const v = VARIANTS[data.type]
  const p = PALETTES[data.type]

  const hi = (text: string) => <strong className="lrl-hi">{text}</strong>

  const hasEvent = Boolean(data.eventTitle)
  const eventNode = hasEvent
    ? hi(data.eventTitle as string)
    : 'the activities of the IEDC Hub'
  const dateNode = data.eventDate ? hi(data.eventDate) : null

  return (
    <div className="lrl-cert" style={vars(v, p)}>
      {/* corner blocks (ref. 3) — accent squares pinned to the light side */}
      <span className="lrl-corner lrl-corner-tl" aria-hidden />
      <span className="lrl-corner lrl-corner-bl" aria-hidden />

      {data.watermark.src && (
        <Image
          src={data.watermark.src}
          alt=""
          width={800}
          height={800}
          className="lrl-watermark"
          style={{
            opacity: data.watermark.opacity,
            width: `${data.watermark.scale * 100}cqw`,
          }}
        />
      )}

      {/* ---------- left: content ---------- */}
      <div className="lrl-main">
        <div className="lrl-brand">
          {data.org.logoUrl && (
            <Image
              src={data.org.logoUrl}
              alt=""
              width={60}
              height={60}
              className="lrl-brand-logo"
            />
          )}
          <div className="lrl-brand-text">
            <div className="lrl-org-name">{data.org.name}</div>
            <div className="lrl-org-sub">{data.org.tagline}</div>
          </div>
        </div>

        <div className="lrl-body">
          <div className="lrl-kicker-wrap">
            <span className="lrl-kicker">{v.kicker}</span>
            <span className="lrl-kicker-rule" aria-hidden />
          </div>

          <p className="lrl-lead">{v.lead}</p>
          <div className="lrl-recipient">{data.recipientName}</div>
          <div className="lrl-name-rule" aria-hidden />

          <p className="lrl-cite">
            {v.citation({ event: eventNode, date: dateNode, hasEvent, hi })}
          </p>
        </div>

        {/* signatures — ruled, two across, with the institution logos centered
            between them (same footer structure as Aurora/Meridian). The logos
            live here rather than on the panel because they are dark marks on
            transparency: on light paper they render in their original colors
            instead of being knocked to a flat white silhouette. */}
        <div className="lrl-foot">
          {data.signatories.map((s, i) => {
            const sig = (
              <div className="lrl-sig" key={`sig-${i}`}>
                {s.signatureUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={s.signatureUrl} alt="" className="lrl-sig-img" />
                ) : (
                  <div className="lrl-sig-gap" aria-hidden />
                )}
                <div className="lrl-sig-line" />
                <div className="lrl-sig-name">{s.name}</div>
                <div className="lrl-sig-role">{s.role}</div>
              </div>
            )
            if (i === 0 && data.logos.length > 0) {
              return [
                sig,
                <div className="lrl-logos" aria-hidden key="logos">
                  {data.logos.map((logo, j) => (
                    <Image
                      key={j}
                      src={logo.src}
                      alt={logo.alt}
                      width={120}
                      height={80}
                      className="lrl-logo-img"
                    />
                  ))}
                </div>,
              ]
            }
            return sig
          })}
        </div>
      </div>

      {/* ---------- right: dark panel ---------- */}
      <div className="lrl-panel">
        {/* The panel's shape is painted, not clipped. An SVG layer draws the
            organic left boundary — a diagonal sweep at the top settling into a
            straight run — which no border-radius can express. Painting rather
            than clipping means the seal can still overhang the boundary
            without being cut off.

            preserveAspectRatio="none" stretches the path to the panel's real
            size, so the geometry can stay in the W x H coordinate space above
            instead of needing absolute units the way clip-path: path() would. */}
        <svg
          className="lrl-panel-shape"
          viewBox={`0 0 ${W} ${H}`}
          preserveAspectRatio="none"
          aria-hidden
        >
          <defs>
            <linearGradient id="lrl-panel-grad" x1="0" y1="0" x2="0.6" y2="1">
              <stop offset="0%" stopColor="var(--panel)" />
              <stop offset="100%" stopColor="var(--panel2)" />
            </linearGradient>
            {/* Constellation dots, clipped to the shape by being painted as a
                second fill on the same path. */}
            <pattern
              id="lrl-panel-dots"
              width="84"
              height="84"
              patternUnits="userSpaceOnUse"
            >
              <circle cx="4" cy="4" r="1.1" fill="rgba(255,255,255,0.30)" />
              <circle cx="46" cy="34" r="0.8" fill="rgba(255,255,255,0.18)" />
              <circle cx="20" cy="62" r="0.8" fill="rgba(255,255,255,0.18)" />
              <circle cx="68" cy="72" r="1.1" fill="rgba(255,255,255,0.24)" />
            </pattern>
          </defs>
          <path d={PANEL_PATH} fill="url(#lrl-panel-grad)" />
          <path d={PANEL_PATH} fill="url(#lrl-panel-dots)" opacity="0.5" />
          {/* Hairline along the curve, catching the seal's metal. */}
          <path
            d={PANEL_EDGE}
            fill="none"
            stroke="var(--ring)"
            strokeOpacity="0.22"
            strokeWidth="1.5"
            vectorEffect="non-scaling-stroke"
          />
        </svg>

        {/* Masthead: the seal and the award headline read as ONE unit. They
            were previously separate flex children, so space-between pushed
            them apart and left the award stranded above a dead gap. */}
        <div className="lrl-panel-top">
          {/* seal with ribbon tail, straddling the seam */}
          <div className="lrl-seal">
            <span className="lrl-seal-ribbon" aria-hidden />
            <div className="lrl-seal-disc">
              <span className="lrl-seal-notch" aria-hidden />
              <div className="lrl-seal-inner">
                <span className="lrl-seal-type">{TYPE_LABEL[data.type]}</span>
                <span className="lrl-seal-div" aria-hidden />
                <span className="lrl-seal-org">IEDC</span>
              </div>
            </div>
          </div>

          {/* Award block — the panel's headline. Gives the upper panel a real
              focal point instead of the seal floating over empty space. */}
          <div className="lrl-award">
            <span className="lrl-award-k">Awarded</span>
            <span className="lrl-award-v">{TYPE_LABEL[data.type]}</span>
            {data.eventTitle && (
              <span className="lrl-award-ev">{data.eventTitle}</span>
            )}
          </div>
        </div>

        {/* Record: the credential facts and the issuer line belong together at
              the foot of the panel. */}
        <div className="lrl-panel-bottom">

          {/* Credential facts as ruled rows (key left, value right) — reads as a
              record, and fills the panel width instead of a ragged left stack. */}
          <div className="lrl-panel-facts">
            {data.eventDate && (
              <div className="lrl-fact">
                <span className="lrl-fact-k">Event date</span>
                <span className="lrl-fact-v">{data.eventDate}</span>
              </div>
            )}
            <div className="lrl-fact lrl-fact-stack">
              <span className="lrl-fact-k">Certificate no.</span>
              <span className="lrl-fact-v lrl-fact-mono">{data.serial}</span>
            </div>
          </div>

          {/* Panel footer: divider + issuer line. The institution logos moved to
              the signature footer on the light side, so this tier is now purely
              the attribution rule that closes the panel. */}
          <div className="lrl-panel-foot">
            <span className="lrl-panel-div" aria-hidden />
            <span className="lrl-panel-issuer">Issued by {data.org.name}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
