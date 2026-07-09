import 'server-only'

// Server-side auth/session helpers. These are the real security boundary —
// call them inside Server Components, Server Actions, and Route Handlers.
import { cache } from 'react'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { ProfileCurrent, UserRole } from '@/lib/supabase/database.types'

// The authenticated auth user, validated against the Supabase auth server.
//
// Wrapped in React `cache()` so it runs AT MOST ONCE per request: a single
// dashboard render used to fire 3–6 separate auth.getUser() network round-trips
// (proxy → layout → each query helper), ~200ms each and sequential. cache()
// collapses them into one shared in-flight promise per request, halving typical
// navigation latency. Still validates against the auth server once — no change
// to security. Other query files should call THIS, not supabase.auth.getUser()
// directly, to share the cache.
export const getUser = cache(async () => {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  return user
})

// The current user's profile (with derived year / is_active) or null. Also
// cached per request — the layout and multiple pages/queries read it.
export const getProfile = cache(async (): Promise<ProfileCurrent | null> => {
  const user = await getUser()
  if (!user) return null

  const supabase = await createClient()
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
})

// Any profile by id (for viewing someone else's profile page). RLS lets any
// authenticated user read any profile row (profiles_select). Returns null if
// not found or not permitted.
export async function getProfileById(
  id: string
): Promise<ProfileCurrent | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('profiles_current')
    .select('*')
    .eq('id', id)
    .maybeSingle()

  if (error) {
    console.error('[getProfileById] failed:', error.message)
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
