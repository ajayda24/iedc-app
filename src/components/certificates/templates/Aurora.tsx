import Image from 'next/image'
import type {
  CertificateData,
  CertificateTypeVariant,
} from '@/components/certificates/types'
import type { CertificateType } from '@/lib/supabase/database.types'

// Aurora — the flagship certificate template. Pastel/glass house style, A4
// landscape. One template covers all four certificate types: the accent
// gradient, kicker, lead line, and citation swap per `data.type` via VARIANTS.
//
// Server-safe (no hooks). Rendered inside CertificateCanvas at a fixed
// 1123×794 px so html-to-image / print produce a pixel-identical export.
// Sizing uses cqw units (container query width) so everything scales with the
// canvas — the canvas sets `container-type: inline-size`.

const VARIANTS: Record<CertificateType, CertificateTypeVariant> = {
  participation: {
    accent: '#7a6cff', // indigo
    accent2: '#6c8cff', // blue
    // Highlight color for event/date/placement in the citation.
    highlightColor: '#7a6cff',
    // Recipient name fill (gradient or a solid color).
    nameGradient: 'linear-gradient(100deg, #7a6cff, #6c8cff 70%)',
    kicker: 'Certificate of Participation',
    lead: 'This certifies that',
    citation: ({ event, date, hasEvent }) => (
      <>
        has actively participated in {event}
        {hasEvent && date ? <> held on {date}</> : null}, demonstrating
        initiative, collaboration, and a genuine commitment to building.
      </>
    ),
  },
  winner: {
    accent: '#e6b34a', // gold
    accent2: '#ffb088', // peach
    // Highlight color for event/date/placement in the citation.
    highlightColor: '#ffb088',
    // Recipient name fill (gradient or a solid color).
    nameGradient: 'linear-gradient(100deg, #e6b34a, #ffb088 70%)',
    kicker: 'Certificate of Achievement',
    lead: 'Awarded to',
    citation: ({ event, date, hasEvent, hi }) => (
      <>
        for securing {hi('1st place')} at {event}
        {hasEvent && date ? <> held on {date}</> : null} — an outstanding result
        achieved through skill, originality, and execution.
      </>
    ),
  },
  runnerup: {
    accent: '#74d0ff', // sky
    accent2: '#7a6cff', // indigo
    // Highlight color for event/date/placement in the citation.
    highlightColor: '#74d0ff',
    // Recipient name fill (gradient or a solid color).
    nameGradient: 'linear-gradient(100deg, #74d0ff, #7a6cff 70%)',
    kicker: 'Certificate of Excellence',
    lead: 'Awarded to',
    citation: ({ event, date, hasEvent, hi }) => (
      <>
        for securing a {hi('runner-up position')} at {event}
        {hasEvent && date ? <> held on {date}</> : null}, standing among the very
        best of the cohort.
      </>
    ),
  },
  volunteer: {
    accent: '#5fe3c0', // mint
    accent2: '#74d0ff', // sky
    // Highlight color for event/date/placement in the citation.
    highlightColor: '#5fe3c0',
    // Recipient name fill (gradient or a solid color).
    nameGradient: 'linear-gradient(100deg, #5fe3c0, #74d0ff 70%)',
    kicker: 'Certificate of Appreciation',
    lead: 'Presented to',
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

// Reusable style vars keyed off the resolved accent. The highlight color and
// the recipient-name gradient fall back to the accent scheme unless a variant
// overrides them (see `highlightColor` / `nameGradient` in VARIANTS).
function accentVars(v: CertificateTypeVariant): React.CSSProperties {
  return {
    // consumed by the CSS below via var(--a) / var(--a2)
    ['--a' as string]: v.accent,
    ['--a2' as string]: v.accent2,
    // citation highlight color (event / date / placement)
    ['--hi' as string]: v.highlightColor ?? v.accent,
    // recipient name fill (gradient or solid color)
    ['--name-grad' as string]:
      v.nameGradient ?? `linear-gradient(100deg, ${v.accent}, ${v.accent2} 70%)`,
  }
}

export default function Aurora({ data }: { data: CertificateData }) {
  const v = VARIANTS[data.type]

  // Highlight helper: renders a phrase in the accent color, bold. Used to
  // emphasize the event name, date, and placement inside the citation.
  const hi = (text: string) => <strong className="aurora-hi">{text}</strong>

  // The event name and date, pre-highlighted for the citation. When there's no
  // event, fall back to a generic (non-highlighted) phrase.
  const hasEvent = Boolean(data.eventTitle)
  const eventNode = hasEvent ? hi(data.eventTitle as string) : 'the activities of the IEDC Hub'
  const dateNode = data.eventDate ? hi(data.eventDate) : null

  return (
    <div
      className="aurora-cert"
      style={accentVars(v)}
      // A4 landscape @96dpi. Fixed so export == preview.
      // container-type lets children size in cqw.
    >
      <span className="aurora-blob aurora-blob-a" />
      <span className="aurora-blob aurora-blob-b" />

      {/* Faint centered watermark (e.g. university seal). Behind all content. */}
      {data.watermark.src && (
        <Image
          src={data.watermark.src}
          alt=""
          width={800}
          height={800}
          className="aurora-watermark"
          style={{
            opacity: data.watermark.opacity,
            width: `${data.watermark.scale * 100}cqw`,
          }}
        />
      )}

      <div className="aurora-inner">
        {/* header: crest + org + serial */}
        <div className="aurora-top">
          <div className="aurora-brand">
            <div className="aurora-crest">
              {data.org.logoUrl ? (
                <Image
                  src={data.org.logoUrl}
                  alt=""
                  width={80}
                  height={80}
                  className="aurora-crest-img"
                />
              ) : (
                data.org.name.charAt(0).toLowerCase()
              )}
            </div>
            <div>
              <div className="aurora-org-name">{data.org.name}</div>
              <div className="aurora-org-sub">{data.org.tagline}</div>
            </div>
          </div>
          <div className="aurora-serial">
            <div className="aurora-serial-k">Certificate No.</div>
            <div className="aurora-serial-v">{data.serial}</div>
          </div>
        </div>

        {/* center */}
        <div className="aurora-body">
          <span className="aurora-kicker">{v.kicker}</span>
          <p className="aurora-lead">{v.lead}</p>
          <div className="aurora-recipient">{data.recipientName}</div>
          <div className="aurora-rule" />
          <p className="aurora-cite">
            {v.citation({ event: eventNode, date: dateNode, hasEvent, hi })}
          </p>
        </div>

        {/* footer: signatures flanking a centered partner-logo strip.
            Everything here comes from lib/certificates/config.ts (signatories,
            logos) so the bottom section is tweakable without touching JSX. */}
        <div className="aurora-foot">
          {data.signatories.map((s, i) => (
            <div className="aurora-sig" key={i}>
              {s.signatureUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={s.signatureUrl}
                  alt=""
                  className="aurora-sig-img"
                />
              ) : (
                <div className="aurora-sig-scribble" aria-hidden />
              )}
              <div className="aurora-sig-line" />
              <div className="aurora-sig-name">{s.name}</div>
              <div className="aurora-sig-role">{s.role}</div>
            </div>
          ))}

          {/* Partner / affiliation logos, centered between the signatures. */}
          {data.logos.length > 0 && (
            <div className="aurora-logos" aria-hidden>
              {data.logos.map((logo, i) => (
                <Image
                  key={i}
                  src={logo.src}
                  alt={logo.alt}
                  width={120}
                  height={80}
                  className="aurora-logo-img"
                />
              ))}
            </div>
          )}
        </div>

        <div className="aurora-verify">
          Verify at {data.verifyUrl.replace(/^https?:\/\//, '')}
          <span className="aurora-verify-sep"> · </span>
          Certificate No. {data.serial}
          <span className="aurora-verify-sep"> · </span>
          Issued {data.issuedDate}
        </div>
      </div>
    </div>
  )
}
