import { createClient } from '@supabase/supabase-js'

// ⚠️  SOLO importar en Server Actions o API Routes — NUNCA en 'use client'
export function createAdminClient() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('[Admin] Faltan variables de entorno de Supabase')
  }
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}
