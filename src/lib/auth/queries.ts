import 'server-only'

// Server-side auth/session helpers. These are the real security boundary —
// call them inside Server Components, Server Actions, and Route Handlers.
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { ProfileCurrent, UserRole } from '@/lib/supabase/database.types'

// The authenticated auth user, validated against the Supabase auth server.
export async function getUser() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  return user
}

// The current user's profile (with derived year / is_active) or null.
export async function getProfile(): Promise<ProfileCurrent | null> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  // maybeSingle (not single): a missing profile is an expected state (e.g. a
  // brand-new auth user mid-signup), not an error to throw on. PGRST116 from
  // single() previously masked real RLS failures behind a generic null.
  const { data, error } = await supabase
    .from('profiles_current')
    .select('*')
    .eq('id', user.id)
    .maybeSingle()

  if (error) {
    console.error('[getProfile] failed to read profiles_current:', error.message)
  }

  return (data as ProfileCurrent) ?? null
}

// Require a logged-in user; redirect to /login otherwise. Returns the profile.
export async function requireProfile(): Promise<ProfileCurrent> {
  const profile = await getProfile()
  if (!profile) redirect('/login')
  return profile
}

// Require one of the given roles; redirect if not permitted.
export async function requireRole(
  roles: UserRole[]
): Promise<ProfileCurrent> {
  const profile = await requireProfile()
  if (!roles.includes(profile.role)) redirect('/dashboard')
  return profile
}

export const requireStaff = () => requireRole(['coordinator', 'admin'])
export const requireAdmin = () => requireRole(['admin'])
