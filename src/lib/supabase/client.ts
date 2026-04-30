import { createBrowserClient } from '@supabase/ssr'

// Cliente para navegador y futura app Expo — usa solo NEXT_PUBLIC_*
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
