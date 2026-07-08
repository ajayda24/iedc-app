import 'server-only'

// User + role administration (admin-only). Reads the profiles_current view so we
// get the derived year/is_active alongside the role. Writes go through
// roleActions with requireAdmin(); RLS (profiles_admin_all) is the backstop, and
// column grants stop non-admins from touching `role` at all.
import { createClient } from '@/lib/supabase/server'
import type { ProfileCurrent, UserRole } from '@/lib/supabase/database.types'

// A directory row — the fields the Users & Roles list needs.
export type DirectoryUser = Pick<
  ProfileCurrent,
  | 'id'
  | 'name'
  | 'email'
  | 'student_id'
  | 'department'
  | 'year'
  | 'role'
  | 'avatar'
  | 'is_active'
>

// Everyone with a profile, for the admin directory. Ordered by name; the page
// splits them into role sections.
export async function listUsers(): Promise<DirectoryUser[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('profiles_current')
    .select('id, name, email, student_id, department, year, role, avatar, is_active')
    .order('name', { ascending: true })
  if (error) throw error
  return (data as DirectoryUser[]) ?? []
}

// How many admins exist — used to block removing the last one.
export async function countAdmins(): Promise<number> {
  const supabase = await createClient()
  const { count, error } = await supabase
    .from('profiles')
    .select('id', { count: 'exact', head: true })
    .eq('role', 'admin')
  if (error) throw error
  return count ?? 0
}

// Change one profile's role. Admin-only at the action layer; RLS enforces it too.
export async function setUserRole(id: string, role: UserRole): Promise<void> {
  const supabase = await createClient()
  const { error } = await supabase
    .from('profiles')
    .update({ role })
    .eq('id', id)
  if (error) throw error
}
