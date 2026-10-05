import Image from 'next/image'
import type {
  CertificateData,
  CertificateTypeVariant,
} from '@/components/certificates/types'
import type { CertificateType } from '@/lib/supabase/database.types'

// Meridian — a formal, high-contrast alternative to Aurora. Same A4 landscape
// geometry and the same CertificateData contract, so it drops into the existing
// pipeline (canvas, export, template registry) without any other change.
//
// The design rule that separates it from Aurora: THE RECIPIENT NAME IS ALWAYS
// DEEP INK. Aurora tinted the name with the per-type accent, which works for
// indigo/mint but collapses for winner and runner-up — a pale gold or silver
// gradient used as text fill on white lands around 1.4:1 contrast, so the most
// important element on the page nearly vanishes.
//
// Meridian instead treats metallics as SURFACES, never as text fills: the foil
// rule under the kicker, the corner filigree, and the underline flourish are
// where gold and silver actually read. Prestige comes from the frame;
// legibility is never traded for it.
//
// Server-safe (no hooks). Sizes in cqw so export == preview.

const VARIANTS: Record<CertificateType, CertificateTypeVariant> = {
  participation: {
    accent: '#3358D4', // deep indigo — darkened for contrast on white
    accent2: '#6C8CFF',
    highlightColor: '#2F4FC0',
    // Ink, not accent: see the header note.
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
    // Bronze-gold rather than yellow. Dark enough to read as text where it is
    // used (kicker, highlights) while still unmistakably gold on the foil.
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
    // Deep slate instead of the old washed-out #7C879A / #D9E1EC pair.
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
    accent: '#0E8C68', // deepened mint
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

function accentVars(v: CertificateTypeVariant): React.CSSProperties {
  return {
    ['--a' as string]: v.accent,
    ['--a2' as string]: v.accent2,
    ['--hi' as string]: v.highlightColor ?? v.accent,
    ['--name-grad' as string]: v.nameGradient ?? '#0B1220',
  }
}

export default function Meridian({ data }: { data: CertificateData }) {
  const v = VARIANTS[data.type]

  const hi = (text: string) => <strong className="mrd-hi">{text}</strong>

  const hasEvent = Boolean(data.eventTitle)
  const eventNode = hasEvent
    ? hi(data.eventTitle as string)
    : 'the activities of the IEDC Hub'
  const dateNode = data.eventDate ? hi(data.eventDate) : null

  return (
    <div className="mrd-cert" style={accentVars(v)}>
      {/* Double rule frame + metallic corner filigree. */}
      <span className="mrd-frame" aria-hidden />
      <span className="mrd-corner mrd-corner-tl" aria-hidden />
      <span className="mrd-corner mrd-corner-tr" aria-hidden />
      <span className="mrd-corner mrd-corner-bl" aria-hidden />
      <span className="mrd-corner mrd-corner-br" aria-hidden />

      {data.watermark.src && (
        <Image
          src={data.watermark.src}
          alt=""
          width={800}
          height={800}
          className="mrd-watermark"
          style={{
            opacity: data.watermark.opacity,
            width: `${data.watermark.scale * 100}cqw`,
          }}
        />
      )}

      <div className="mrd-inner">
        {/* header: crest + org, serial on the right */}
        <div className="mrd-top">
          <div className="mrd-brand">
            {data.org.logoUrl && (
              <Image
                src={data.org.logoUrl}
                alt=""
                width={50}
                height={50}
                className="mrd-crest-img"
              />
            )}
            <div className="mrd-brand-text">
              <div className="mrd-org-name">{data.org.name}</div>
              <div className="mrd-org-sub">{data.org.tagline}</div>
            </div>
          </div>
          <div className="mrd-serial">
            <div className="mrd-serial-k">Certificate No.</div>
            <div className="mrd-serial-v">{data.serial}</div>
          </div>
        </div>

        {/* center — everything centered, unlike Aurora's left-aligned body */}
        <div className="mrd-body">
          <span className="mrd-kicker">{v.kicker}</span>
          <span className="mrd-foil" aria-hidden />
          <p className="mrd-lead">{v.lead}</p>
          <div className="mrd-recipient">{data.recipientName}</div>
          <div className="mrd-underline" aria-hidden />
          <p className="mrd-cite">
            {v.citation({ event: eventNode, date: dateNode, hasEvent, hi })}
          </p>
        </div>

        {/* footer: signatures flanking the centered logo strip, same structure
            as Aurora so config.ts drives both templates identically. */}
        <div className="mrd-foot">
          {data.signatories.map((s, i) => {
            const sig = (
              <div className="mrd-sig" key={`sig-${i}`}>
                {s.signatureUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={s.signatureUrl} alt="" className="mrd-sig-img" />
                ) : (
                  <div className="mrd-sig-scribble" aria-hidden />
                )}
                <div className="mrd-sig-line" />
                <div className="mrd-sig-name">{s.name}</div>
                <div className="mrd-sig-role">{s.role}</div>
              </div>
            )
            if (i === 0 && data.logos.length > 0) {
              return [
                sig,
                <div className="mrd-logos" aria-hidden key="logos">
                  {data.logos.map((logo, j) => (
                    <Image
                      key={j}
                      src={logo.src}
                      alt={logo.alt}
                      width={120}
                      height={80}
                      className="mrd-logo-img"
                    />
                  ))}
                </div>,
              ]
            }
            return sig
          })}
        </div>
      </div>
    </div>
  )
}
