'use client'

// Browser Supabase client. Uses the public anon key + the user's cookie session.
// RLS applies. Import this ONLY in Client Components.
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
