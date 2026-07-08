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
    kicker: 'Certificate of Participation',
    lead: 'This certifies that',
    citation: (e) =>
      `has actively participated in ${e}, demonstrating initiative, collaboration, and a genuine commitment to building.`,
  },
  winner: {
    accent: '#e6b34a', // gold
    accent2: '#ffb088', // peach
    kicker: 'Certificate of Achievement',
    lead: 'Awarded to',
    citation: (e) =>
      `for securing 1st place at ${e} — an outstanding result achieved through skill, originality, and execution.`,
  },
  runnerup: {
    accent: '#74d0ff', // sky
    accent2: '#7a6cff', // indigo
    kicker: 'Certificate of Excellence',
    lead: 'Awarded to',
    citation: (e) =>
      `for securing a runner-up position at ${e}, standing among the very best of the cohort.`,
  },
  volunteer: {
    accent: '#5fe3c0', // mint
    accent2: '#74d0ff', // sky
    kicker: 'Certificate of Appreciation',
    lead: 'Presented to',
    citation: (e) =>
      `in grateful recognition of outstanding service as a volunteer for ${e}, whose effort behind the scenes made the event possible.`,
  },
}

// Reusable style vars keyed off the resolved accent.
function accentVars(v: CertificateTypeVariant): React.CSSProperties {
  return {
    // consumed by the CSS below via var(--a) / var(--a2)
    ['--a' as string]: v.accent,
    ['--a2' as string]: v.accent2,
  }
}

export default function Aurora({ data }: { data: CertificateData }) {
  const v = VARIANTS[data.type]
  // When there's no event, the citation still reads well.
  const eventPhrase = data.eventTitle
    ? `${data.eventTitle}${data.eventDate ? `, held on ${data.eventDate}` : ''}`
    : 'the activities of the IEDC Hub'

  return (
    <div
      className="aurora-cert"
      style={accentVars(v)}
      // A4 landscape @96dpi. Fixed so export == preview.
      // container-type lets children size in cqw.
    >
      <span className="aurora-blob aurora-blob-a" />
      <span className="aurora-blob aurora-blob-b" />

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
          <p className="aurora-cite">{v.citation(eventPhrase)}</p>
        </div>

        {/* footer: signature + date + seal */}
        <div className="aurora-foot">
          <div className="aurora-sig">
            <div className="aurora-sig-line" />
            <div className="aurora-sig-name">{data.signatory.name}</div>
            <div className="aurora-sig-role">{data.signatory.role}</div>
          </div>

          <div className="aurora-meta">
            <div className="aurora-meta-k">Issued</div>
            <div className="aurora-meta-v">{data.issuedDate}</div>
          </div>

          <div className="aurora-seal" aria-hidden>
            <svg viewBox="0 0 100 100" className="aurora-seal-ring">
              <defs>
                <path
                  id="aurora-ring-path"
                  d="M50,50 m-38,0 a38,38 0 1,1 76,0 a38,38 0 1,1 -76,0"
                />
              </defs>
              <text className="aurora-seal-text">
                <textPath href="#aurora-ring-path" startOffset="0">
                  · VERIFIED CREDENTIAL · IEDC HUB · INNOVATE · BUILD · LEAD
                </textPath>
              </text>
            </svg>
            <div className="aurora-seal-core">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.4"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M20 6 9 17l-5-5" />
              </svg>
            </div>
          </div>
        </div>

        <div className="aurora-verify">
          Verify at {data.verifyUrl.replace(/^https?:\/\//, '')}
        </div>
      </div>
    </div>
  )
}
