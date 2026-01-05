'use server'

import { createSupabaseServerClient } from '@/lib/supabaseServer'
import { cookies } from 'next/headers'

export async function debugAuth() {
  const cookieStore = await cookies()
  const cookieNames = cookieStore.getAll().map((c) => c.name).filter((n) => n.startsWith('sb-'))

  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  return {
    sbCookieNames: cookieNames,
    hasUser: !!user,
    email: user?.email ?? null,
  }
}

