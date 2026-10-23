import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined
const supabasePublishableKey =
  (import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined) ||
  (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined)

export const isSupabaseConfigured = Boolean(supabaseUrl && supabasePublishableKey)

if (supabaseUrl && !supabaseUrl.startsWith('https://')) {
  throw new Error('VITE_SUPABASE_URL precisa ser uma URL HTTPS válida.')
}

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl!, supabasePublishableKey!)
  : null
