import type { UserRole } from '@/lib/supabase/database.types'

// Dashboard navigation model. `roles` gates visibility; omit to show for all.
// Icons map to keys in components/landing/Icon.tsx.
export interface NavItem {
  href: string
  label: string
  icon: string
  // Which roles may see this link. Undefined = everyone (student+).
  roles?: UserRole[]
  // Show in the mobile bottom bar (space is limited to ~5 slots).
  mobile?: boolean
}

export const NAV_ITEMS: NavItem[] = [
  { href: '/dashboard', label: 'Dashboard', icon: 'home', mobile: true },
  { href: '/dashboard/events', label: 'Events', icon: 'calendar', mobile: true },
  {
    href: '/dashboard/leaderboard',
    label: 'Leaderboard',
    icon: 'trophy',
    mobile: true,
  },
  {
    href: '/dashboard/certificates',
    label: 'Certificates',
    icon: 'certificate',
    mobile: true,
  },
  // --- Coordinator + admin ---
  {
    href: '/dashboard/manage',
    label: 'Manage Events',
    icon: 'compass',
    roles: ['coordinator', 'admin'],
  },
  {
    href: '/dashboard/analytics',
    label: 'Analytics',
    icon: 'chart',
    roles: ['coordinator', 'admin'],
  },
  // --- Admin only ---
  {
    href: '/dashboard/roster',
    label: 'Roster',
    icon: 'team',
    roles: ['admin'],
  },
  {
    href: '/dashboard/users',
    label: 'Users & Roles',
    icon: 'shield',
    roles: ['admin'],
  },
]

// Filter the nav for a given role.
export function navForRole(role: UserRole): NavItem[] {
  return NAV_ITEMS.filter((item) => !item.roles || item.roles.includes(role))
}

// The (up to 4) primary items shown in the mobile bottom bar for a role.
// (A 5th "More" slot is added by the nav when extra items exist.)
export function mobileNavForRole(role: UserRole): NavItem[] {
  return navForRole(role)
    .filter((item) => item.mobile)
    .slice(0, 4)
}

// Role-visible items that DON'T fit in the bottom bar — surfaced via the mobile
// "More" sheet (e.g. Manage Events, Analytics, Roster, Users for staff/admin).
export function mobileMoreForRole(role: UserRole): NavItem[] {
  const inBar = new Set(mobileNavForRole(role).map((i) => i.href))
  return navForRole(role).filter((item) => !inBar.has(item.href))
}
