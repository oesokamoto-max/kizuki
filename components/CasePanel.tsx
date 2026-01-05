import { createSupabaseServerClient } from '@/lib/supabaseServer'

export default async function CasePanel({ memoId }: { memoId?: string }) {
  if (!memoId) {
    return (
      <div>
        <h2 className="font-bold mb-3">案件情報</h2>
        <p className="text-sm text-gray-500">
          左の最新メモから1件選ぶと、右に案件フォームが表示されます。
        </p>
      </div>
    )
  }

  const supabase = await createSupabaseServerClient()
  const { data, error } = await supabase
    .from('memos')
    .select('title, display_key, created_at')
    .eq('id', memoId)
    .single()

  return (
    <div>
      <h2 className="font-bold mb-3">案件情報</h2>

      {error || !data ? (
        <p className="text-sm text-red-600">メモが見つかりません</p>
      ) : (
        <div className="space-y-2">
          <div className="text-sm font-medium">{data.title ?? '(no title)'}</div>
          <div className="text-xs text-gray-500">{data.display_key}</div>
          <div className="text-xs text-gray-500">
            {new Date(data.created_at).toLocaleString()}
          </div>

          <div className="mt-4 text-sm text-gray-500">
            次の工程（6）で、ここを案件フォームに置き換えます。
          </div>
        </div>
      )}
    </div>
  )
}
