'use server'
import { createServerSupabaseClient } from '../supabase/server'
import { createAdminClient } from '../supabase/admin'
import { requireRole } from '../session'
import { revalidatePath } from 'next/cache'
import type { Role } from '@/types'

export async function getEmployees() {
  const session = await requireRole('manager')
  const supabase = createServerSupabaseClient()

  const { data, error } = await supabase
    .from('profiles')
    .select('*, department:departments(id,name), store:stores(id,name)')
    .eq('company_id', session.profile.company_id)
    .order('full_name')

  return { data, error: error?.message ?? null }
}

export async function createEmployee(payload: {
  full_name: string
  login_code: string
  password: string
  role: Role
  department_id?: string | null
  store_id?: string | null
}) {
  const session = await requireRole('admin')
  const admin = createAdminClient()
  const supabase = createServerSupabaseClient()

  // 1. Crear usuario en Supabase Auth con email sintético
  const email = `${payload.login_code}@em-fundgrube.local`
  const { data: authUser, error: authError } = await admin.auth.admin.createUser({
    email,
    password: payload.password,
    email_confirm: true,
  })
  if (authError) return { data: null, error: authError.message }

  // 2. Crear profile vinculado
  const { data, error } = await supabase
    .from('profiles')
    .insert({
      user_id: authUser.user.id,
      company_id: session.profile.company_id,
      store_id: payload.store_id ?? null,
      department_id: payload.department_id ?? null,
      full_name: payload.full_name,
      login_code: payload.login_code,
      role: payload.role,
    })
    .select()
    .single()

  if (error) {
    // Rollback: eliminar usuario Auth si falla el profile
    await admin.auth.admin.deleteUser(authUser.user.id)
    return { data: null, error: error.message }
  }

  revalidatePath('/')
  return { data, error: null }
}

export async function updateEmployee(id: string, payload: {
  full_name?: string
  role?: Role
  department_id?: string | null
  store_id?: string | null
}) {
  const session = await requireRole('admin')
  const supabase = createServerSupabaseClient()

  const { data, error } = await supabase
    .from('profiles')
    .update(payload)
    .eq('id', id)
    .eq('company_id', session.profile.company_id)
    .select()
    .single()

  if (error) return { data: null, error: error.message }
  revalidatePath('/')
  return { data, error: null }
}

export async function deleteEmployee(id: string) {
  const session = await requireRole('admin')
  const supabase = createServerSupabaseClient()
  const admin = createAdminClient()

  // Obtener user_id antes de eliminar
  const { data: profile } = await supabase
    .from('profiles')
    .select('user_id')
    .eq('id', id)
    .eq('company_id', session.profile.company_id)
    .single()

  const { error } = await supabase
    .from('profiles')
    .delete()
    .eq('id', id)
    .eq('company_id', session.profile.company_id)

  if (error) return { error: error.message }

  // Eliminar también de Auth si tiene user_id
  if (profile?.user_id) {
    await admin.auth.admin.deleteUser(profile.user_id)
  }

  revalidatePath('/')
  return { error: null }
}
