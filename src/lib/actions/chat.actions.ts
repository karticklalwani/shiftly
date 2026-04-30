'use server'
import { createServerSupabaseClient } from '../supabase/server'
import { requireSession } from '../auth'
import { revalidatePath } from 'next/cache'

export async function getConversations() {
  const session = await requireSession()
  const supabase = createServerSupabaseClient()

  const { data: memberships } = await supabase
    .from('conversation_members')
    .select('conversation_id')
    .eq('user_id', session.profile.id)

  if (!memberships?.length) return { data: [], error: null }

  const convIds = memberships.map(m => m.conversation_id)

  const { data, error } = await supabase
    .from('conversations')
    .select(`
      *,
      members:conversation_members(
        profile:profiles(id,full_name,role)
      )
    `)
    .in('id', convIds)
    .eq('company_id', session.profile.company_id)
    .order('created_at', { ascending: false })

  return { data, error: error?.message ?? null }
}

export async function getOrCreateConversation(otherProfileId: string) {
  const session = await requireSession()
  const supabase = createServerSupabaseClient()

  // Buscar conversación existente entre los dos
  const { data: myConvs } = await supabase
    .from('conversation_members')
    .select('conversation_id')
    .eq('user_id', session.profile.id)

  if (myConvs?.length) {
    const myConvIds = myConvs.map(c => c.conversation_id)
    const { data: match } = await supabase
      .from('conversation_members')
      .select('conversation_id')
      .eq('user_id', otherProfileId)
      .in('conversation_id', myConvIds)
      .limit(1)
      .single()

    if (match) return { conversationId: match.conversation_id, error: null }
  }

  // Crear nueva conversación
  const { data: conv, error } = await supabase
    .from('conversations')
    .insert({ company_id: session.profile.company_id })
    .select()
    .single()

  if (error || !conv) return { conversationId: null, error: error?.message ?? 'Error creando conversación' }

  await supabase.from('conversation_members').insert([
    { conversation_id: conv.id, user_id: session.profile.id },
    { conversation_id: conv.id, user_id: otherProfileId },
  ])

  return { conversationId: conv.id, error: null }
}

export async function getMessages(conversationId: string) {
  const session = await requireSession()
  const supabase = createServerSupabaseClient()

  // Verificar que el usuario es miembro de la conversación
  const { data: membership } = await supabase
    .from('conversation_members')
    .select('id')
    .eq('conversation_id', conversationId)
    .eq('user_id', session.profile.id)
    .single()

  if (!membership) return { data: null, error: 'Sin acceso a esta conversación' }

  const { data, error } = await supabase
    .from('messages')
    .select('*, sender:profiles!sender_id(id,full_name)')
    .eq('conversation_id', conversationId)
    .order('created_at')

  return { data, error: error?.message ?? null }
}

export async function sendMessage(conversationId: string, text: string) {
  const session = await requireSession()
  const supabase = createServerSupabaseClient()

  // Verificar membresía
  const { data: membership } = await supabase
    .from('conversation_members')
    .select('id')
    .eq('conversation_id', conversationId)
    .eq('user_id', session.profile.id)
    .single()

  if (!membership) return { data: null, error: 'Sin acceso' }

  // Obtener el otro miembro para receiver_id
  const { data: other } = await supabase
    .from('conversation_members')
    .select('user_id')
    .eq('conversation_id', conversationId)
    .neq('user_id', session.profile.id)
    .single()

  const { data, error } = await supabase
    .from('messages')
    .insert({
      conversation_id: conversationId,
      sender_id: session.profile.id,
      receiver_id: other?.user_id ?? null,
      message: text.trim(),
    })
    .select('*, sender:profiles!sender_id(id,full_name)')
    .single()

  if (error) return { data: null, error: error.message }

  // Notificación al receptor
  if (other?.user_id) {
    await supabase.from('notifications').insert({
      company_id: session.profile.company_id,
      user_id: other.user_id,
      type: 'new_message',
      title: 'Nuevo mensaje',
      message: `${session.profile.full_name}: ${text.slice(0, 80)}`,
    })
  }

  revalidatePath('/')
  return { data, error: null }
}

export async function markMessagesRead(conversationId: string) {
  const session = await requireSession()
  const supabase = createServerSupabaseClient()

  await supabase
    .from('messages')
    .update({ read_at: new Date().toISOString() })
    .eq('conversation_id', conversationId)
    .eq('receiver_id', session.profile.id)
    .is('read_at', null)
}
