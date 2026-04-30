'use server'
import { createServerSupabaseClient } from '../supabase/server'
import { requireSession } from '../session'

export async function getNotifications() {
  const session = await requireSession()
  const supabase = createServerSupabaseClient()

  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', session.profile.id)
    .eq('company_id', session.profile.company_id)
    .order('created_at', { ascending: false })
    .limit(50)

  return { data, error: error?.message ?? null }
}

export async function markNotificationRead(id: string) {
  const session = await requireSession()
  const supabase = createServerSupabaseClient()

  await supabase
    .from('notifications')
    .update({ read_at: new Date().toISOString() })
    .eq('id', id)
    .eq('user_id', session.profile.id)
}

export async function markAllNotificationsRead() {
  const session = await requireSession()
  const supabase = createServerSupabaseClient()

  await supabase
    .from('notifications')
    .update({ read_at: new Date().toISOString() })
    .eq('user_id', session.profile.id)
    .is('read_at', null)
}
