'use server'

// Server Action for editing your OWN profile. requireProfile() is the security
// boundary; RLS (profiles_update_own + the column grant) is the backstop, so
// even a crafted request can only touch the caller's own safe columns.
import { revalidatePath } from 'next/cache'
import { requireProfile } from '@/lib/auth/queries'
import { createClient } from '@/lib/supabase/server'

export interface ActionResult {
  ok: boolean
  error?: string
}

// Trim to a non-empty string or null.
function text(fd: FormData, key: string): string | null {
  const v = (fd.get(key) as string)?.trim()
  return v ? v : null
}

// Normalise a URL-ish field: allow bare domains, coerce to https:// so links
// work. Empty -> null. Returns undefined on an obviously invalid value.
function link(fd: FormData, key: string): string | null | undefined {
  const v = (fd.get(key) as string)?.trim()
  if (!v) return null
  const withProto = /^https?:\/\//i.test(v) ? v : `https://${v}`
  try {
    return new URL(withProto).toString()
  } catch {
    return undefined
  }
}

export async function updateProfileAction(fd: FormData): Promise<ActionResult> {
  const profile = await requireProfile()

  const name = text(fd, 'name')
  if (!name) return { ok: false, error: 'Name is required.' }

  const github = link(fd, 'github')
  const linkedin = link(fd, 'linkedin')
  const website = link(fd, 'website')
  if (github === undefined || linkedin === undefined || website === undefined) {
    return { ok: false, error: 'One of the links is not a valid URL.' }
  }

  const supabase = await createClient()
  const { error } = await supabase
    .from('profiles')
    .update({
      name,
      phone: text(fd, 'phone'),
      avatar: text(fd, 'avatar'),
      bio: text(fd, 'bio'),
      github,
      linkedin,
      website,
    })
    .eq('id', profile.id)

  if (error) return { ok: false, error: error.message }

  revalidatePath('/dashboard/profile')
  revalidatePath('/dashboard')
  return { ok: true }
}
