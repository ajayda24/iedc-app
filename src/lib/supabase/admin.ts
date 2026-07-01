import 'server-only'

// Service-role Supabase client. BYPASSES RLS. Never import this in client code
// and never expose SUPABASE_SERVICE_ROLE_KEY to the browser.
//
// Used by the signup flow to: verify a studentId against the roster, check for
// an existing profile, send OTP to the on-file email, and create the profile
// with roster-derived fields the user can't spoof.
import { createClient as createSupabaseClient } from '@supabase/supabase-js'

export function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  )
}
