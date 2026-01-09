'use server'

import { createSupabaseServerClient } from '@/lib/supabaseServer'
import { generateDisplayKey, generateTitle } from '@/lib/memoUtils'

export async function saveMemo(content: string) {
  if (!content.trim()) return { error: 'empty' }

  const supabase = await createSupabaseServerClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (!user || authError) return { error: 'unauthorized' }

  const displayKey = generateDisplayKey()
  const title = generateTitle(content)

  const { error } = await supabase.from('memos').insert({
    user_id: user.id,
    content,
    title,
    display_key: displayKey,
  })

  if (error) return { error: error.message }
  return { success: true }
}

