import { Suspense } from 'react'
import LeaderboardView from '@/components/dashboard/LeaderboardView'

// Thin server wrapper. The actual UI is a client component that renders its
// shell instantly and fetches data via SWR (cached, background-revalidated), so
// navigating here — especially returning to it — is instant instead of blocking
// on a fresh server round-trip. Suspense satisfies useSearchParams()'s CSR-bail.
export default function LeaderboardPage() {
  return (
    <Suspense>
      <LeaderboardView />
    </Suspense>
  )
}
