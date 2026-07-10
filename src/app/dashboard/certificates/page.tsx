import { Suspense } from 'react'
import CertificatesView from '@/components/dashboard/CertificatesView'

// Thin server wrapper. The UI is a client component that renders its shell
// instantly and fetches certificates via SWR (cached, background-revalidated),
// so returning to this page is instant. Suspense satisfies useSearchParams().
export default function CertificatesPage() {
  return (
    <Suspense>
      <CertificatesView />
    </Suspense>
  )
}
