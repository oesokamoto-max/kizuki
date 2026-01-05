'use server'

import { createSupabaseServerClient } from '@/lib/supabaseServer'

export async function fetchLatestMemos(limit = 5) {
  const supabase = await createSupabaseServerClient()

  const { data: auth } = await supabase.auth.getUser()
  if (!auth?.user) return []

  const { data, error } = await supabase
    .from('memos')
    .select('id, title, display_key, created_at')
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error || !data) return []
  return data
}
