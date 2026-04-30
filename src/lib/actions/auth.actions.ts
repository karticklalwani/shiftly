'use server'

import { createServerSupabaseClient } from '../supabase/server'
import { redirect } from 'next/navigation'

export async function loginWithCode(
  _prevState: { error: string } | null,
  formData: FormData
): Promise<{ error: string }> {
  const code = (formData.get('code') as string)?.trim()
  const password = formData.get('password') as string

  if (!code || !password) {
    return { error: 'Introduce tu código y contraseña.' }
  }

  const email = `${code}@em-fundgrube.local`
  const supabase = createServerSupabaseClient()

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    return { error: `Supabase: ${error.message}` }
  }

  redirect('/')
}

export async function logout() {
  const supabase = createServerSupabaseClient()
  await supabase.auth.signOut()
  redirect('/login')
}