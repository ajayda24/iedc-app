'use server'

// Server Actions for the Users & Roles page (admin only). requireAdmin() is the
// real security boundary; RLS (profiles_admin_all) + column grants are the
// backstop. Guardrails prevent an admin from locking everyone out of admin.
import { revalidatePath } from 'next/cache'
import { requireAdmin } from '@/lib/auth/queries'
import { setUserRole, countAdmins } from './users'
import { createClient } from '@/lib/supabase/server'
import type { UserRole } from '@/lib/supabase/database.types'

const ROLES: UserRole[] = ['student', 'coordinator', 'admin']

export interface ActionResult {
  ok: boolean
  error?: string
}

// Change a user's role, with two safety rails:
//   1. an admin can't demote themselves (avoids self-lockout),
//   2. the last remaining admin can't be demoted (avoids org-wide lockout).
export async function setUserRoleAction(
  userId: string,
  role: UserRole
): Promise<ActionResult> {
  const me = await requireAdmin()

  if (!ROLES.includes(role)) {
    return { ok: false, error: 'Invalid role.' }
  }

  // Read the target's current role to decide whether a guardrail applies.
  const supabase = await createClient()
  const { data: target } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .maybeSingle()
  if (!target) return { ok: false, error: 'User not found.' }

  const currentRole = (target as { role: UserRole }).role
  if (currentRole === role) return { ok: true } // no-op

  const demotingFromAdmin = currentRole === 'admin' && role !== 'admin'

  if (demotingFromAdmin) {
    if (userId === me.id) {
      return {
        ok: false,
        error: "You can't remove your own admin role. Ask another admin.",
      }
    }
    const admins = await countAdmins()
    if (admins <= 1) {
      return {
        ok: false,
        error: 'This is the last admin — promote someone else first.',
      }
    }
  }

  try {
    await setUserRole(userId, role)
  } catch {
    return { ok: false, error: 'Could not update the role. Try again.' }
  }

  revalidatePath('/dashboard/users')
  return { ok: true }
}
