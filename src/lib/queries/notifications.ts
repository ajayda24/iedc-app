import 'server-only'

// Notifications. RLS (rls.sql) already filters rows to the ones targeting the
// current user (all / their department / their year / them individually), so a
// plain select returns exactly what they should see.
import { createClient } from '@/lib/supabase/server'
import type {
  Notification,
  NotificationTarget,
} from '@/lib/supabase/database.types'

export async function listMyNotifications(
  limit = 20
): Promise<Notification[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit)
  if (error) throw error
  return (data as Notification[]) ?? []
}

// Staff: broadcast a notification.
export async function createNotification(input: {
  title: string
  message: string
  targetType: NotificationTarget
  targetValue?: string
}): Promise<Notification> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data, error } = await supabase
    .from('notifications')
    .insert({
      title: input.title,
      message: input.message,
      target_type: input.targetType,
      target_value: input.targetValue ?? null,
      created_by: user?.id,
    })
    .select('*')
    .single()
  if (error) throw error
  return data as Notification
}
