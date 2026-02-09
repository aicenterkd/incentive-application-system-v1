import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import type { Database } from './types'

// Lazy-initialized clients to avoid crashing when env vars are missing
let _supabaseBrowser: SupabaseClient<Database> | null = null
let _supabaseAdmin: SupabaseClient<Database> | null = null

export function isSupabaseConfigured(): boolean {
  return !!(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )
}

// Client for browser usage (with anon key) – created on first access
export function getSupabaseBrowser(): SupabaseClient<Database> {
  if (!_supabaseBrowser) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!url || !anonKey) {
      throw new Error('Supabase browser client requires NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY')
    }
    _supabaseBrowser = createClient<Database>(url, anonKey)
  }
  return _supabaseBrowser
}

// Client for server/API routes (with service role key) – created on first access
export function getSupabaseAdmin(): SupabaseClient<Database> {
  if (!_supabaseAdmin) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!url || !serviceKey) {
      throw new Error('Supabase admin client requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY')
    }
    _supabaseAdmin = createClient<Database>(url, serviceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })
  }
  return _supabaseAdmin
}

// Backward-compatible named exports using getters so existing code still works
// e.g. `import { supabaseAdmin } from './client'`
export const supabaseBrowser = new Proxy({} as SupabaseClient<Database>, {
  get(_target, prop) {
    return Reflect.get(getSupabaseBrowser(), prop)
  },
})

export const supabaseAdmin = new Proxy({} as SupabaseClient<Database>, {
  get(_target, prop) {
    return Reflect.get(getSupabaseAdmin(), prop)
  },
})
