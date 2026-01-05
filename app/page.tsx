'use client'

import { useEffect, useState } from 'react'
import { saveMemo } from './actions/saveMemo'
import { useSearchParams } from 'next/navigation'
import CaseForm from '@/components/CaseForm'

export default function Home() {
  const sp = useSearchParams()
  const memoId = sp.get('memo') ?? undefined

  const [messages, setMessages] = useState<string[]>([])
  const [input, setInput] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    // 次工程で「選択メモの過去内容を表示」に進化
    setMessages([])
  }, [memoId])

  const send = async () => {
    if (!input.trim()) return

    setSaving(true)
    const res = await saveMemo(input)
    setSaving(false)

    if (res?.error) {
      alert(res.error)
      return
    }

    setMessages((prev) => [...prev, input])
    setInput('')
  }

  return (
    <div className="flex h-full">
      {/* 中央 */}
      <main className="flex-1 flex flex-col border-r">
        <div className="border-b p-4">
          <div className="text-sm text-gray-500">
            選択中スレッド: {memoId ?? '（未選択）'}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-3">
          {messages.length === 0 && (
            <div className="text-sm text-gray-500">
              {memoId
                ? 'このスレッドの内容表示は次工程で実装します（案件フォームは右で編集可能）'
                : '左のスレッドを選ぶと右に案件フォームが出ます。'}
            </div>
          )}

          {messages.map((m, i) => (
            <div key={i} className="bg-gray-100 p-3 rounded">
              {m}
            </div>
          ))}
        </div>

        <div className="border-t p-4 flex gap-2">
          <input
            className="flex-1 border p-2 rounded"
            placeholder="案件メモを入力…"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={saving}
          />
          <button
            onClick={send}
            disabled={saving}
            className="bg-black text-white px-4 rounded"
          >
            保存
          </button>
        </div>
      </main>

      {/* 右 */}
      <aside className="w-96 p-4">
        <CaseForm memoId={memoId} />
      </aside>
    </div>
  )
}

