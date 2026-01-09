'use client'

import { useEffect, useState } from 'react'
import { getOrCreateCaseByMemo, updateCase, type CaseRecord } from '@/app/actions/cases'

export default function CaseForm({ memoId }: { memoId?: string }) {
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [caseRec, setCaseRec] = useState<CaseRecord | null>(null)

  const [propertyName, setPropertyName] = useState('')
  const [address, setAddress] = useState('')
  const [period, setPeriod] = useState('')
  const [workDetail, setWorkDetail] = useState('')
  const [productCodesText, setProductCodesText] = useState('')

  useEffect(() => {
    const run = async () => {
      setCaseRec(null)
      if (!memoId) return

      setLoading(true)
      const res = await getOrCreateCaseByMemo(memoId)
      setLoading(false)

      if ('error' in res) {
        alert(res.error)
        return
      }

      const c = res.data
      setCaseRec(c)
      setPropertyName(c.property_name ?? '')
      setAddress(c.address ?? '')
      setPeriod(c.period ?? '')
      setWorkDetail(c.work_detail ?? '')
      setProductCodesText((c.product_codes ?? []).join(', '))
    }

    run()
  }, [memoId])

  const onSave = async () => {
    if (!caseRec) return
    setSaving(true)

    const codes = productCodesText
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)

    const res = await updateCase(caseRec.id, {
      property_name: propertyName,
      address,
      period,
      work_detail: workDetail,
      product_codes: codes,
      status: 'draft',
    })

    setSaving(false)

    if ('error' in res) {
      alert(res.error)
      return
    }

    setCaseRec(res.data)
    alert('案件を保存しました')
  }

  if (!memoId) {
    return (
      <div>
        <h2 className="font-bold mb-3">案件情報</h2>
        <p className="text-sm text-gray-500">左のスレッドを選択してください。</p>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      <div className="mb-3">
        <h2 className="font-bold">案件情報</h2>
        <div className="text-xs text-gray-500">memo: {memoId}</div>
      </div>

      {loading && <div className="text-sm text-gray-500">読み込み中…</div>}

      {!loading && !caseRec && (
        <div className="text-sm text-gray-500">案件を準備中…</div>
      )}

      {!loading && caseRec && (
        <div className="flex-1 overflow-y-auto space-y-3">
          <div>
            <label className="text-xs text-gray-500">物件名</label>
            <input
              className="w-full border rounded p-2"
              value={propertyName}
              onChange={(e) => setPropertyName(e.target.value)}
            />
          </div>

          <div>
            <label className="text-xs text-gray-500">住所</label>
            <input
              className="w-full border rounded p-2"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
            />
          </div>

          <div>
            <label className="text-xs text-gray-500">工期</label>
            <input
              className="w-full border rounded p-2"
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
            />
          </div>

          <div>
            <label className="text-xs text-gray-500">施工内容</label>
            <textarea
              className="w-full border rounded p-2 min-h-24"
              value={workDetail}
              onChange={(e) => setWorkDetail(e.target.value)}
            />
          </div>

          <div>
            <label className="text-xs text-gray-500">品番（カンマ区切り）</label>
            <input
              className="w-full border rounded p-2"
              value={productCodesText}
              onChange={(e) => setProductCodesText(e.target.value)}
            />
          </div>
        </div>
      )}

      <div className="pt-3 border-t">
        <button
          onClick={onSave}
          disabled={!caseRec || saving}
          className="w-full bg-black text-white rounded p-2"
        >
          {saving ? '保存中…' : '案件を保存'}
        </button>
      </div>
    </div>
  )
}
