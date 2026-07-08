import type { Metadata } from 'next'
import { headers } from 'next/headers'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getPublicCertificate } from '@/lib/queries'
import { toCertificateData } from '@/lib/certificates/render-data'
import CertificateCanvas from '@/components/certificates/CertificateCanvas'
import CertificateActions from '@/components/certificates/CertificateActions'
import Icon from '@/components/landing/Icon'

// Public, anon-readable certificate verify + view page. Reachable at
// /certificates/<serial> or /certificates/<uuid>. Reads only the narrow
// `certificate_public` view, so no login is required and nothing sensitive
// leaks. Shareable (e.g. on LinkedIn) — hence the rich metadata below.

const CERT_LABEL: Record<string, string> = {
  participation: 'Participation',
  winner: 'Winner',
  runnerup: 'Runner-up',
  volunteer: 'Volunteer',
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  const { id } = await params
  const cert = await getPublicCertificate(id)
  if (!cert) return { title: 'Certificate not found — IEDC Hub' }

  const what = cert.event_title ?? CERT_LABEL[cert.certificate_type]
  const title = `${cert.recipient_name} — ${what} · IEDC Hub`
  const description = `${CERT_LABEL[cert.certificate_type]} certificate issued to ${cert.recipient_name}${
    cert.event_title ? ` for ${cert.event_title}` : ''
  }. Verify ${cert.serial}.`

  return {
    title,
    description,
    openGraph: { title, description, type: 'profile' },
  }
}

export default async function CertificatePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const [cert, h] = await Promise.all([getPublicCertificate(id), headers()])
  if (!cert) notFound()

  // Absolute origin from the request, so the verify URL / copy-link work when
  // shared. Falls back to a relative path if the proxy strips these headers.
  const host = h.get('x-forwarded-host') ?? h.get('host')
  const proto = h.get('x-forwarded-proto') ?? 'https'
  const origin = host ? `${proto}://${host}` : ''

  const data = toCertificateData(cert, origin)

  return (
    <main className="min-h-screen px-4 py-8 sm:py-12">
      <div className="mx-auto max-w-4xl flex flex-col gap-6">
        {/* header strip */}
        <div className="flex items-center justify-between gap-4">
          <Link
            href="/"
            className="flex items-center gap-2 font-display font-bold text-lg"
          >
            <Icon name="logo" className="w-7 h-7 text-indigo" />
            IEDC Hub
          </Link>
          <span className="inline-flex items-center gap-2 rounded-full bg-mint/15 px-3 py-1 text-sm font-semibold text-mint">
            <Icon name="shield" className="w-4 h-4" />
            Verified credential
          </span>
        </div>

        {/* the certificate */}
        <CertificateCanvas data={data} templateId={cert.certificate_template} />

        {/* actions + facts */}
        <div className="glass rounded-3xl p-5 flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <dl className="grid grid-cols-2 gap-x-8 gap-y-3 text-sm">
            <div>
              <dt className="text-muted">Awarded to</dt>
              <dd className="font-semibold">{data.recipientName}</dd>
            </div>
            <div>
              <dt className="text-muted">Type</dt>
              <dd className="font-semibold">
                {CERT_LABEL[cert.certificate_type]}
              </dd>
            </div>
            {cert.event_title && (
              <div>
                <dt className="text-muted">Event</dt>
                <dd className="font-semibold">{cert.event_title}</dd>
              </div>
            )}
            <div>
              <dt className="text-muted">Certificate No.</dt>
              <dd className="font-semibold font-mono tabular-nums">
                {data.serial}
              </dd>
            </div>
          </dl>

          <CertificateActions
            serial={data.serial}
            verifyUrl={data.verifyUrl}
            recipientName={data.recipientName}
          />
        </div>
      </div>
    </main>
  )
}
