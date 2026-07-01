import { requireProfile } from '@/lib/auth/queries'
import { Sidebar, BottomNav } from '@/components/dashboard/DashboardNav'
import DashboardHeader from '@/components/dashboard/DashboardHeader'
import SearchProvider from '@/components/dashboard/SearchProvider'

// The dashboard shell. requireProfile() redirects to /login when unauthenticated,
// so every nested page can assume a logged-in user. The profile fetched here is
// re-fetched cheaply per page as needed (RLS-scoped, cached within a request).
export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const profile = await requireProfile()

  return (
    <SearchProvider>
      <div className="min-h-screen lg:flex">
        <Sidebar role={profile.role} />

        <div className="flex-1 min-w-0 flex flex-col">
          <DashboardHeader profile={profile} />

          {/* pb-24 leaves room for the mobile bottom nav */}
          <main className="flex-1 px-4 sm:px-6 py-5 pb-24 lg:pb-8">
            {children}
          </main>
        </div>

        <BottomNav role={profile.role} />
      </div>
    </SearchProvider>
  )
}
