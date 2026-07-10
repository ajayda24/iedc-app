import DashboardView from '@/components/dashboard/DashboardView'

// Thin server wrapper. The overview is a client component that renders its shell
// instantly and fetches data via SWR (cached, background-revalidated), so
// returning to the dashboard is instant instead of blocking on a server render.
export default function DashboardPage() {
  return <DashboardView />
}
