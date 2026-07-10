import Link from 'next/link'
import Icon from '@/components/landing/Icon'
import UserMenu from './UserMenu'
import NotificationsMenu from './NotificationsMenu'
import { SearchBar, SearchIconButton } from './SearchTriggers'
import { listMyNotifications } from '@/lib/queries'
import type { ProfileCurrent } from '@/lib/supabase/database.types'

// Top bar. On mobile it shows a compact logo + actions; on desktop the sidebar
// carries the brand, so we lead with the search field instead.
export default async function DashboardHeader({
  profile,
}: {
  profile: ProfileCurrent
}) {
  const notifications = await listMyNotifications(8)

  return (
    <header
      className="dash-header relative top-0 z-30  px-4 sm:px-6 py-3 flex items-center gap-3"
    >
      {/* Mobile brand (sidebar hidden) */}
      <Link href="/dashboard" className="flex items-center gap-2 lg:hidden">
        <span className="grid place-items-center w-8 h-8 rounded-lg btn-primary">
          <Icon name="logo" className="w-4 h-4" />
        </span>
        <span className="font-display font-bold tracking-tight">IEDC Hub</span>
      </Link>

      {/* Desktop search — prominent command-style bar */}
      <SearchBar />

      <div className="flex items-center gap-1.5 ml-auto">
        <SearchIconButton />
        <NotificationsMenu notifications={notifications} />
        <UserMenu profile={profile} />
      </div>
    </header>
  )
}
