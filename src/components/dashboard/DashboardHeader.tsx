import Link from 'next/link'
import Image from 'next/image'
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
      <Link href="/dashboard" className="flex items-end gap-2.5 lg:hidden">
        <Image
          src="/logo-transparent.png"
          alt=""
          width={371}
          height={371}
          className="h-7 w-auto "
          priority
        />
        <span className="font-display font-bold text-lg tracking-tight">
          HUB
        </span>
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
