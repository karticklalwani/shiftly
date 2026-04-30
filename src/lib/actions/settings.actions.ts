'use server'
import { createServerSupabaseClient } from '../supabase/server'
import { requireRole } from '../auth'
import { revalidatePath } from 'next/cache'

export async function updateCompany(payload: { name: string }) {
  const session = await requireRole('admin')
  const supabase = createServerSupabaseClient()

  const { data, error } = await supabase
    .from('companies')
    .update({ name: payload.name })
    .eq('id', session.profile.company_id)
    .select()
    .single()

  if (error) return { data: null, error: error.message }
  revalidatePath('/')
  return { data, error: null }
}

export async function getStores() {
  const session = await requireRole('manager')
  const supabase = createServerSupabaseClient()

  const { data, error } = await supabase
    .from('stores')
    .select('*')
    .eq('company_id', session.profile.company_id)
    .order('name')

  return { data, error: error?.message ?? null }
}

export async function createStore(name: string) {
  const session = await requireRole('admin')
  const supabase = createServerSupabaseClient()

  const { data, error } = await supabase
    .from('stores')
    .insert({ company_id: session.profile.company_id, name })
    .select()
    .single()

  if (error) return { data: null, error: error.message }
  revalidatePath('/')
  return { data, error: null }
}

export async function deleteStore(id: string) {
  const session = await requireRole('admin')
  const supabase = createServerSupabaseClient()

  const { error } = await supabase
    .from('stores')
    .delete()
    .eq('id', id)
    .eq('company_id', session.profile.company_id)

  if (error) return { error: error.message }
  revalidatePath('/')
  return { error: null }
}

export async function getDepartments() {
  const session = await requireRole('manager')
  const supabase = createServerSupabaseClient()

  const { data, error } = await supabase
    .from('departments')
    .select('*')
    .eq('company_id', session.profile.company_id)
    .order('name')

  return { data, error: error?.message ?? null }
}

export async function createDepartment(name: string, store_id?: string | null) {
  const session = await requireRole('admin')
  const supabase = createServerSupabaseClient()

  const { data, error } = await supabase
    .from('departments')
    .insert({ company_id: session.profile.company_id, name, store_id: store_id ?? null })
    .select()
    .single()

  if (error) return { data: null, error: error.message }
  revalidatePath('/')
  return { data, error: null }
}

export async function deleteDepartment(id: string) {
  const session = await requireRole('admin')
  const supabase = createServerSupabaseClient()

  const { error } = await supabase
    .from('departments')
    .delete()
    .eq('id', id)
    .eq('company_id', session.profile.company_id)

  if (error) return { error: error.message }
  revalidatePath('/')
  return { error: null }
}
