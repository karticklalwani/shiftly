'use server'
import { createServerSupabaseClient } from '../supabase/server'
import { requireRole, requireSession } from '../auth'
import { revalidatePath } from 'next/cache'
import type { ShiftStatus } from '@/types'

function calcHours(start: string, end: string, breakMin: number, lunchMin: number) {
  const [sh, sm] = start.split(':').map(Number)
  const [eh, em] = end.split(':').map(Number)
  const total = (eh * 60 + em) - (sh * 60 + sm) - breakMin - lunchMin
  return Math.round((total / 60) * 100) / 100
}

export async function getShifts(filters?: {
  week_start?: string
  employee_id?: string
  department_id?: string
  store_id?: string
}) {
  const session = await requireSession()
  const supabase = createServerSupabaseClient()

  let q = supabase
    .from('schedule_events')
    .select(`*, employee:profiles!employee_id(id,full_name,department_id), department:departments(id,name)`)
    .eq('company_id', session.profile.company_id)
    .order('shift_date').order('start_time')

  if (session.profile.role === 'employee') q = q.eq('employee_id', session.profile.id)
  if (filters?.week_start) {
    const end = new Date(filters.week_start)
    end.setDate(end.getDate() + 6)
    q = q.gte('shift_date', filters.week_start).lte('shift_date', end.toISOString().split('T')[0])
  }
  if (filters?.employee_id) q = q.eq('employee_id', filters.employee_id)
  if (filters?.department_id) q = q.eq('department_id', filters.department_id)
  if (filters?.store_id) q = q.eq('store_id', filters.store_id)

  const { data, error } = await q
  return { data, error: error?.message ?? null }
}

export async function createShift(payload: {
  employee_id: string
  department_id?: string | null
  store_id?: string | null
  title: string
  shift_date: string
  start_time: string
  end_time: string
  break_minutes: number
  lunch_minutes: number
  notes?: string
  status: ShiftStatus
}) {
  const session = await requireRole('manager')
  const supabase = createServerSupabaseClient()

  const total_hours = calcHours(payload.start_time, payload.end_time, payload.break_minutes, payload.lunch_minutes)

  const { data, error } = await supabase
    .from('schedule_events')
    .insert({
      ...payload,
      company_id: session.profile.company_id,
      manager_id: session.profile.id,
      total_hours,
      notes: payload.notes ?? '',
    })
    .select()
    .single()

  if (error) return { data: null, error: error.message }
  revalidatePath('/')
  return { data, error: null }
}

export async function updateShift(id: string, payload: {
  title?: string
  shift_date?: string
  start_time?: string
  end_time?: string
  break_minutes?: number
  lunch_minutes?: number
  notes?: string
  status?: ShiftStatus
  department_id?: string | null
}) {
  const session = await requireRole('manager')
  const supabase = createServerSupabaseClient()

  const extra: Record<string, unknown> = { updated_at: new Date().toISOString() }
  if (payload.start_time && payload.end_time) {
    extra.total_hours = calcHours(
      payload.start_time, payload.end_time,
      payload.break_minutes ?? 0, payload.lunch_minutes ?? 0
    )
  }

  const { data, error } = await supabase
    .from('schedule_events')
    .update({ ...payload, ...extra })
    .eq('id', id)
    .eq('company_id', session.profile.company_id)
    .select()
    .single()

  if (error) return { data: null, error: error.message }
  revalidatePath('/')
  return { data, error: null }
}

export async function deleteShift(id: string) {
  const session = await requireRole('manager')
  const supabase = createServerSupabaseClient()

  const { error } = await supabase
    .from('schedule_events')
    .delete()
    .eq('id', id)
    .eq('company_id', session.profile.company_id)

  if (error) return { error: error.message }
  revalidatePath('/')
  return { error: null }
}
