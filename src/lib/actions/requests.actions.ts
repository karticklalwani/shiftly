'use server'
import { createServerSupabaseClient } from '../supabase/server'
import { requireRole, requireSession } from '../session'
import { revalidatePath } from 'next/cache'

export async function getRequests() {
  const session = await requireSession()
  const supabase = createServerSupabaseClient()

  let q = supabase
    .from('shift_change_requests')
    .select(`
      *,
      requester:profiles!requester_employee_id(id,full_name),
      target:profiles!target_employee_id(id,full_name),
      current_shift:schedule_events!current_shift_id(id,shift_date,start_time,end_time),
      requested_shift:schedule_events!requested_shift_id(id,shift_date,start_time,end_time)
    `)
    .eq('company_id', session.profile.company_id)
    .order('created_at', { ascending: false })

  if (session.profile.role === 'employee') {
    q = q.eq('requester_employee_id', session.profile.id)
  }

  const { data, error } = await q
  return { data, error: error?.message ?? null }
}

export async function createRequest(payload: {
  target_employee_id: string
  current_shift_id: string
  requested_shift_id: string
  requested_change_date: string
  reason: string
  additional_message?: string
}) {
  const session = await requireSession()
  const supabase = createServerSupabaseClient()

  const { data, error } = await supabase
    .from('shift_change_requests')
    .insert({
      ...payload,
      company_id: session.profile.company_id,
      requester_employee_id: session.profile.id,
      status: 'pendiente',
      additional_message: payload.additional_message ?? '',
    })
    .select()
    .single()

  if (error) return { data: null, error: error.message }

  // Crear notificación para managers
  await supabase.from('notifications').insert({
    company_id: session.profile.company_id,
    user_id: session.profile.id,
    type: 'new_request',
    title: 'Nueva solicitud de cambio',
    message: `${session.profile.full_name} ha solicitado un cambio de turno.`,
  })

  revalidatePath('/')
  return { data, error: null }
}

export async function reviewRequest(id: string, action: 'aprobada' | 'rechazada', response?: string) {
  const session = await requireRole('manager')
  const supabase = createServerSupabaseClient()

  const { data: req } = await supabase
    .from('shift_change_requests')
    .select('*')
    .eq('id', id)
    .eq('company_id', session.profile.company_id)
    .single()

  if (!req) return { error: 'Solicitud no encontrada' }

  const { data, error } = await supabase
    .from('shift_change_requests')
    .update({
      status: action,
      manager_response: response ?? null,
      reviewed_by: session.profile.id,
      reviewed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single()

  if (error) return { data: null, error: error.message }

  // Si aprobada, intercambiar turnos
  if (action === 'aprobada') {
    await supabase.from('schedule_events').update({ employee_id: req.target_employee_id }).eq('id', req.current_shift_id)
    await supabase.from('schedule_events').update({ employee_id: req.requester_employee_id }).eq('id', req.requested_shift_id)
  }

  // Notificar al solicitante
  await supabase.from('notifications').insert({
    company_id: session.profile.company_id,
    user_id: req.requester_employee_id,
    type: action === 'aprobada' ? 'request_approved' : 'request_rejected',
    title: action === 'aprobada' ? 'Solicitud aprobada' : 'Solicitud rechazada',
    message: response ?? (action === 'aprobada' ? 'Tu solicitud de cambio fue aprobada.' : 'Tu solicitud de cambio fue rechazada.'),
  })

  revalidatePath('/')
  return { data, error: null }
}
