import { Suspense } from 'react'
import EventsView from '@/components/dashboard/EventsView'

// Thin server wrapper. The UI is a client component that renders its shell
// instantly and fetches events via SWR (cached, background-revalidated), so
// returning to this page is instant. Suspense satisfies useSearchParams().
export default function EventsPage() {
  return (
    <Suspense>
      <EventsView />
    </Suspense>
  )
}
