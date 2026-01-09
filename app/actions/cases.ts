'use server'

import { createSupabaseServerClient } from '@/lib/supabaseServer'

export type CaseRecord = {
  id: string
  memo_id: string | null
  property_name: string | null
  address: string | null
  period: string | null
  work_detail: string | null
  product_codes: string[] | null
  status: string | null
}

export async function getOrCreateCaseByMemo(memoId: string) {
  const supabase = await createSupabaseServerClient()
  const { data: auth } = await supabase.auth.getUser()
  if (!auth?.user) return { error: 'unauthorized' as const }

  // 既存取得
  const { data: existing } = await supabase
    .from('cases')
    .select('id, memo_id, property_name, address, period, work_detail, product_codes, status')
    .eq('user_id', auth.user.id)
    .eq('memo_id', memoId)
    .maybeSingle()

  if (existing) return { data: existing as CaseRecord }

  // 無ければ下書き作成（ユニーク制約があるので競合しても安全）
  const { data: created, error: createError } = await supabase
    .from('cases')
    .insert({
      user_id: auth.user.id,
      memo_id: memoId,
      status: 'draft',
      product_codes: [],
    })
    .select('id, memo_id, property_name, address, period, work_detail, product_codes, status')
    .single()

  if (createError || !created) return { error: createError?.message ?? 'create_failed' }
  return { data: created as CaseRecord }
}

export async function updateCase(caseId: string, patch: Partial<CaseRecord>) {
  const supabase = await createSupabaseServerClient()
  const { data: auth } = await supabase.auth.getUser()
  if (!auth?.user) return { error: 'unauthorized' as const }

  const { data, error } = await supabase
    .from('cases')
    .update({
      property_name: patch.property_name ?? null,
      address: patch.address ?? null,
      period: patch.period ?? null,
      work_detail: patch.work_detail ?? null,
      product_codes: patch.product_codes ?? null,
      status: patch.status ?? null,
    })
    .eq('id', caseId)
    .select('id, memo_id, property_name, address, period, work_detail, product_codes, status')
    .single()

  if (error || !data) return { error: error?.message ?? 'update_failed' }
  return { data: data as CaseRecord }
}
