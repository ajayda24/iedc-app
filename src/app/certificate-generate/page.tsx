import type { Metadata } from 'next'
import CertificateGenerator from '@/components/certificates/CertificateGenerator'

// Standalone certificate generator for events that ran BEFORE the site
// launched. Those events have no rows in `events` / `certificates`, so the
// normal issue flow (dashboard → event → issue) has nothing to work from.
// This page skips the database entirely: staff type the details, see a live
// preview, and export PNG/PDF using the same template the real pipeline uses.
//
// Because nothing is persisted, these certificates carry a manual serial and
// are NOT verifiable at /certificates/<serial> — see lib/certificates/manual-data.ts.

export const metadata: Metadata = {
  title: 'Certificate Generator',
  description:
    'Generate a certificate by entering the details manually — for events held before the site launched.',
  // Not a public page; keep it out of search results.
  robots: { index: false, follow: false },
}

export default function CertificateGeneratePage() {
  return <CertificateGenerator />
}
