import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

// Cliente server-side con sesión del usuario (usa anon key + cookies de sesión)
export function createServerSupabaseClient() {
  const cookieStore = cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) { return cookieStore.get(name)?.value },
        set(name: string, value: string, options: Record<string, unknown>) {
          try { cookieStore.set({ name, value, ...options } as Parameters<typeof cookieStore.set>[0]) } catch {}
        },
        remove(name: string, options: Record<string, unknown>) {
          try { cookieStore.set({ name, value: '', ...options } as Parameters<typeof cookieStore.set>[0]) } catch {}
        },
      },
    }
  )
}
