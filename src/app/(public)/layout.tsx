import PublicHeader from '@/components/public/PublicHeader'
import PublicFooter from '@/components/public/PublicFooter'

// Shell for the public (no-login) pages: /events, /events/[id], /certificates.
// The landing page (/) keeps its own immersive layout; the dashboard stays
// behind auth. These pages let any student browse and register with just their
// student ID + email, and nudge them toward creating an account.
export default function PublicLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-dvh flex-col">
      <PublicHeader />
      <main className="flex-1">{children}</main>
      <PublicFooter />
    </div>
  )
}
