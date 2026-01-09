'use client'

import { useRouter, useSearchParams } from 'next/navigation'

type MemoItem = {
  id: string
  title: string | null
  display_key: string
  created_at: string
}

export default function LeftMenu({ memos }: { memos: MemoItem[] }) {
  const router = useRouter()
  const sp = useSearchParams()
  const selected = sp.get('memo')

  return (
    <div className="h-full flex flex-col">
      <div className="mb-4">
        <div className="text-base font-bold">メニュー</div>
        <div className="text-xs text-gray-500">最新メモ</div>
      </div>

      <div className="flex-1 overflow-y-auto space-y-2">
        {memos.length === 0 && (
          <div className="text-sm text-gray-500">メモがまだありません</div>
        )}

        {memos.map((m) => {
          const active = selected === m.id
          return (
            <button
              key={m.id}
              onClick={() => router.push(`/?memo=${m.id}`)}
              className={[
                'w-full text-left rounded px-2 py-2 border',
                active ? 'bg-black text-white' : 'bg-white hover:bg-gray-50',
              ].join(' ')}
            >
              <div className="text-sm font-medium line-clamp-2">
                {m.title ?? '(no title)'}
              </div>
              <div className="mt-1 text-[11px] opacity-80">
                {m.display_key}
              </div>
            </button>
          )
        })}
      </div>

      <div className="pt-3 border-t text-xs text-gray-500">
        クリックでメモを選択
      </div>
    </div>
  )
}
