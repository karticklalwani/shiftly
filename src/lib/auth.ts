import { createServerSupabaseClient } from './supabase/server'
import type { AppSession, Profile, Company } from '@/types'
import { hasRole } from './roles'

export { hasRole, ROLE_RANK } from './roles'

export async function getSession(): Promise<AppSession | null> {
  try {
    const supabase = createServerSupabaseClient()

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) return null

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (profileError || !profile) return null

    const { data: company, error: companyError } = await supabase
      .from('companies')
      .select('*')
      .eq('id', profile.company_id)
      .single()

    if (companyError || !company) return null

    return {
      userId: user.id,
      profile: profile as Profile,
      company: company as Company,
    }
  } catch {
    return null
  }
}

export async function requireSession(): Promise<AppSession> {
  const session = await getSession()
  if (!session) throw new Error('No autenticado')
  return session
}

export async function requireRole(minRole: string): Promise<AppSession> {
  const session = await requireSession()

  if (!hasRole(session.profile.role, minRole)) {
    throw new Error('Sin permisos suficientes')
  }

  return session
}