'use server'

import { createSupabaseServerClient } from '@/lib/supabaseServer'

export async function signIn(email: string, password: string) {
  const supabase = await createSupabaseServerClient()
  const { error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) return { error: error.message }
  return { success: true }
}
