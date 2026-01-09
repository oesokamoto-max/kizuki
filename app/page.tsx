'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';

type MsgRole = 'user' | 'assistant';

type Message = {
  id: string;
  role: MsgRole;
  content: string;
  createdAt: number;
};

type CaseDraft = {
  projectName: string;
  address: string;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  productCode: string;
  workDetail: string;
  notes: string;
};

type Thread = {
  id: string;
  title: string;
  updatedAt: number;
  messages: Message[];
  draftText: string; // 入力途中（空なら「なかった事に」）
  caseDraft: CaseDraft;
};

function uid(prefix = 'id') {
  return `${prefix}_${Math.random().toString(16).slice(2)}_${Date.now().toString(16)}`;
}

function formatTime(ts: number) {
  const d = new Date(ts);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${y}/${m}/${day} ${hh}:${mm}`;
}

function deriveTitleFromText(text: string) {
  const oneLine = text.replace(/\s+/g, ' ').trim();
  if (!oneLine) return '新規メモ';
  // 先頭30文字くらい
  return oneLine.length > 30 ? `${oneLine.slice(0, 30)}…` : oneLine;
}

function simpleTagsFromThread(t: Thread): string[] {
  const joined = [
    t.title,
    t.caseDraft.projectName,
    t.caseDraft.address,
    t.caseDraft.productCode,
    t.caseDraft.workDetail,
    ...t.messages.map((m) => m.content),
  ]
    .join(' ')
    .toLowerCase();

  const tags: string[] = [];
  const push = (x: string) => {
    if (!tags.includes(x)) tags.push(x);
  };

  if (joined.includes('見積') || joined.includes('見積り') || joined.includes('estimate')) push('見積');
  if (joined.includes('受注') || joined.includes('発注')) push('受注/発注');
  if (joined.includes('納期') || joined.includes('期限')) push('納期');
  if (joined.includes('住所') || joined.includes('丁目') || joined.includes('市') || joined.includes('区')) push('住所');
  if (joined.includes('施工') || joined.includes('工事') || joined.includes('リフォーム')) push('施工');
  if (t.caseDraft.productCode.trim()) push('品番');

  return tags.slice(0, 6);
}

const EMPTY_CASE: CaseDraft = {
  projectName: '',
  address: '',
  startDate: '',
  endDate: '',
  productCode: '',
  workDetail: '',
  notes: '',
};

function seedThreads(): Thread[] {
  const now = Date.now();
  const t1: Thread = {
    id: uid('thr'),
    title: '新規メモ（サンプル）',
    updatedAt: now - 1000 * 60 * 10,
    draftText: '',
    messages: [
      { id: uid('msg'), role: 'user', content: '案件の情報をメモしたい。住所と工期を整理。', createdAt: now - 1000 * 60 * 12 },
      { id: uid('msg'), role: 'assistant', content: '了解です。住所・工期・施工内容を右のフォームに入れていきましょう。', createdAt: now - 1000 * 60 * 11 },
    ],
    caseDraft: {
      ...EMPTY_CASE,
      projectName: '〇〇ビル 201号室',
      address: '東京都渋谷区〇〇…',
      startDate: '',
      endDate: '',
      productCode: '',
      workDetail: 'クロス張替え、床補修',
      notes: '',
    },
  };

  const t2: Thread = {
    id: uid('thr'),
    title: '納期確認（サンプル）',
    updatedAt: now - 1000 * 60 * 40,
    draftText: '住所だけ先に書く…',
    messages: [{ id: uid('msg'), role: 'user', content: '納期がいつか、材料発注のタイミングも確認したい。', createdAt: now - 1000 * 60 * 42 }],
    caseDraft: { ...EMPTY_CASE },
  };

  return [t1, t2];
}

export default function Page() {
  const [threads, setThreads] = useState<Thread[]>(() => seedThreads());
  const [activeId, setActiveId] = useState<string>(() => seedThreads()[0]?.id ?? '');
  const [search, setSearch] = useState('');
  const [toast, setToast] = useState<string>('');

  // seedThreads() を2回呼ばないように初期化後に activeId を補正
  useEffect(() => {
    setThreads((prev) => {
      if (prev.length === 0) return seedThreads();
      return prev;
    });
  }, []);

  useEffect(() => {
    setActiveId((prev) => {
      const exists = threads.some((t) => t.id === prev);
      return exists ? prev : threads[0]?.id ?? '';
    });
  }, [threads]);

  const activeThread = useMemo(() => threads.find((t) => t.id === activeId) ?? null, [threads, activeId]);

  const filteredThreads = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return threads;
    return threads.filter((t) => {
      const hay = `${t.title} ${t.caseDraft.projectName} ${t.caseDraft.address}`.toLowerCase();
      return hay.includes(q);
    });
  }, [threads, search]);

  const latest5 = useMemo(() => {
    return [...threads].sort((a, b) => b.updatedAt - a.updatedAt).slice(0, 5);
  }, [threads]);

  const msgEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    // アクティブスレッド切替/送信時のスクロール
    msgEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeId, activeThread?.messages.length]);

  function updateThread(id: string, patch: Partial<Thread>) {
    setThreads((prev) =>
      prev.map((t) => (t.id === id ? { ...t, ...patch, updatedAt: patch.updatedAt ?? Date.now() } : t)),
    );
  }

  function createNewThread() {
    const now = Date.now();
    const t: Thread = {
      id: uid('thr'),
      title: '新規メモ',
      updatedAt: now,
      messages: [],
      draftText: '',
      caseDraft: { ...EMPTY_CASE },
    };
    setThreads((prev) => [t, ...prev]);
    setActiveId(t.id);
    setToast('新しいスレッドを作成しました');
  }

  function deleteThread(id: string) {
    const ok = window.confirm('このスレッドを削除しますか？（復元できません）');
    if (!ok) return;
    setThreads((prev) => prev.filter((t) => t.id !== id));
    setToast('スレッドを削除しました');
  }

  function sendMessage() {
    if (!activeThread) return;
    const text = activeThread.draftText.trim();
    if (!text) {
      // 空のままはなかった事に
      updateThread(activeThread.id, { draftText: '' });
      return;
    }

    const userMsg: Message = { id: uid('msg'), role: 'user', content: text, createdAt: Date.now() };

    const nextTitle =
      activeThread.title === '新規メモ' || activeThread.title === '新規メモ（サンプル）'
        ? deriveTitleFromText(text)
        : activeThread.title;

    // モックの「アシスタント返信」
    const assistantMsg: Message = {
      id: uid('msg'),
      role: 'assistant',
      content:
        '（モック）了解です。右の案件フォームに「案件名・住所・工期・施工内容」を入れると整理しやすいです。',
      createdAt: Date.now() + 5,
    };

    updateThread(activeThread.id, {
      title: nextTitle,
      messages: [...activeThread.messages, userMsg, assistantMsg],
      draftText: '',
      updatedAt: Date.now(),
    });
  }

  function saveCaseDraft() {
    setToast('案件フォーム（モック）を保存しました');
    // Supabase導入後はここで保存APIを呼ぶ想定
  }

  // 簡易トースト
  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(() => setToast(''), 1800);
    return () => window.clearTimeout(t);
  }, [toast]);

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900">
      {/* Top bar */}
      <header className="sticky top-0 z-20 border-b bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-[1400px] items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-neutral-900 text-white grid place-items-center text-sm font-semibold">
              KZ
            </div>
            <div>
              <div className="text-sm font-semibold leading-tight">kizuki（UIモック）</div>
              <div className="text-xs text-neutral-500 leading-tight">左: スレッド / 中: チャット / 右: 案件フォーム</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={createNewThread}
              className="rounded-xl bg-neutral-900 px-3 py-2 text-sm font-medium text-white hover:bg-neutral-800"
            >
              + 新規スレッド
            </button>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="mx-auto max-w-[1400px] px-4 py-4">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[280px_1fr_420px]">
          {/* Left: Threads */}
          <section className="rounded-2xl border bg-white shadow-sm">
            <div className="border-b px-4 py-3">
              <div className="text-sm font-semibold">スレッド</div>
              <div className="mt-2">
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="検索（タイトル/案件名/住所）"
                  className="w-full rounded-xl border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-neutral-200"
                />
              </div>
            </div>

            <div className="max-h-[55vh] overflow-auto p-2">
              {filteredThreads.length === 0 ? (
                <div className="p-4 text-sm text-neutral-500">該当するスレッドがありません。</div>
              ) : (
                <ul className="space-y-2">
                  {filteredThreads
                    .slice()
                    .sort((a, b) => b.updatedAt - a.updatedAt)
                    .map((t) => {
                      const isActive = t.id === activeId;
                      const isEditing = !!t.draftText.trim();
                      return (
                        <li key={t.id}>
                          <button
                            onClick={() => setActiveId(t.id)}
                            className={[
                              'w-full rounded-2xl border px-3 py-3 text-left transition',
                              isActive ? 'border-neutral-900 bg-neutral-50' : 'border-neutral-200 bg-white hover:bg-neutral-50',
                            ].join(' ')}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0">
                                <div className="truncate text-sm font-semibold">{t.title || '（無題）'}</div>
                                <div className="mt-1 flex flex-wrap items-center gap-2">
                                  <span className="text-xs text-neutral-500">{formatTime(t.updatedAt)}</span>
                                  {isEditing && (
                                    <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-800">
                                      編集中
                                    </span>
                                  )}
                                </div>
                              </div>
                              <span className="shrink-0 rounded-lg border px-2 py-1 text-xs text-neutral-500">
                                {t.messages.length}
                              </span>
                            </div>
                            {t.caseDraft.projectName.trim() && (
                              <div className="mt-2 truncate text-xs text-neutral-600">案件: {t.caseDraft.projectName}</div>
                            )}
                          </button>
                          <div className="mt-1 flex justify-end px-1">
                            <button
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                deleteThread(t.id);
                              }}
                              className="rounded-lg px-2 py-1 text-xs text-neutral-500 hover:bg-neutral-100"
                              title="削除"
                            >
                              削除
                            </button>
                          </div>
                        </li>
                      );
                    })}
                </ul>
              )}
            </div>

            <div className="border-t px-4 py-3">
              <div className="text-xs font-semibold text-neutral-700">最新5件</div>
              <div className="mt-2 flex flex-wrap gap-2">
                {latest5.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setActiveId(t.id)}
                    className="max-w-full truncate rounded-full border bg-white px-3 py-1 text-xs text-neutral-700 hover:bg-neutral-50"
                    title={t.title}
                  >
                    {t.title}
                  </button>
                ))}
              </div>
            </div>
          </section>

          {/* Center: Chat */}
          <section className="rounded-2xl border bg-white shadow-sm">
            <div className="border-b px-4 py-3">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="truncate text-sm font-semibold">{activeThread?.title ?? 'スレッドなし'}</div>
                  <div className="mt-1 text-xs text-neutral-500">
                    送信: Enter / 改行: Shift+Enter / 入力途中は左に「編集中」表示（空送信は破棄）
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {(activeThread ? simpleTagsFromThread(activeThread) : []).map((tag) => (
                    <span key={tag} className="rounded-full bg-neutral-100 px-2 py-0.5 text-xs text-neutral-700">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="h-[55vh] overflow-auto p-4">
              {activeThread?.messages.length ? (
                <div className="space-y-3">
                  {activeThread.messages
                    .slice()
                    .sort((a, b) => a.createdAt - b.createdAt)
                    .map((m) => (
                      <div key={m.id} className={m.role === 'user' ? 'flex justify-end' : 'flex justify-start'}>
                        <div
                          className={[
                            'max-w-[85%] rounded-2xl px-3 py-2 text-sm leading-relaxed shadow-sm',
                            m.role === 'user' ? 'bg-neutral-900 text-white' : 'bg-neutral-100 text-neutral-900',
                          ].join(' ')}
                        >
                          <div className="whitespace-pre-wrap">{m.content}</div>
                          <div className={['mt-1 text-[11px] opacity-70', m.role === 'user' ? 'text-white' : 'text-neutral-700'].join(' ')}>
                            {formatTime(m.createdAt)}
                          </div>
                        </div>
                      </div>
                    ))}
                  <div ref={msgEndRef} />
                </div>
              ) : (
                <div className="text-sm text-neutral-500">
                  まだメッセージがありません。中央の入力欄からメモを書き始めてください。
                </div>
              )}
            </div>

            <div className="border-t p-3">
              <textarea
                rows={3}
                value={activeThread?.draftText ?? ''}
                onChange={(e) => {
                  if (!activeThread) return;
                  updateThread(activeThread.id, { draftText: e.target.value, updatedAt: activeThread.updatedAt });
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage();
                  }
                }}
                placeholder="ここにメモ（チャット形式）…"
                className="w-full resize-none rounded-2xl border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-neutral-200"
              />
              <div className="mt-2 flex items-center justify-between">
                <div className="text-xs text-neutral-500">
                  空のまま送信すると破棄します。入力途中はスレッドに「編集中」表示。
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      if (!activeThread) return;
                      updateThread(activeThread.id, { draftText: '' });
                    }}
                    className="rounded-xl border px-3 py-2 text-sm hover:bg-neutral-50"
                  >
                    クリア
                  </button>
                  <button
                    onClick={sendMessage}
                    className="rounded-xl bg-neutral-900 px-3 py-2 text-sm font-medium text-white hover:bg-neutral-800"
                  >
                    送信
                  </button>
                </div>
              </div>
            </div>
          </section>

          {/* Right: Case form */}
          <section className="rounded-2xl border bg-white shadow-sm">
            <div className="border-b px-4 py-3">
              <div className="text-sm font-semibold">案件フォーム（モック）</div>
              <div className="mt-1 text-xs text-neutral-500">
                ここは後で Supabase 保存に置き換え可能。いまはUIと入力体験の固定に集中。
              </div>
            </div>

            <div className="p-4">
              {activeThread ? (
                <div className="space-y-4">
                  <Field
                    label="案件名"
                    value={activeThread.caseDraft.projectName}
                    placeholder="例）〇〇ビル 201号室"
                    onChange={(v) => updateThread(activeThread.id, { caseDraft: { ...activeThread.caseDraft, projectName: v } })}
                  />
                  <Field
                    label="住所"
                    value={activeThread.caseDraft.address}
                    placeholder="例）東京都…"
                    onChange={(v) => updateThread(activeThread.id, { caseDraft: { ...activeThread.caseDraft, address: v } })}
                  />
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    <Field
                      label="工期開始"
                      type="date"
                      value={activeThread.caseDraft.startDate}
                      onChange={(v) => updateThread(activeThread.id, { caseDraft: { ...activeThread.caseDraft, startDate: v } })}
                    />
                    <Field
                      label="工期終了"
                      type="date"
                      value={activeThread.caseDraft.endDate}
                      onChange={(v) => updateThread(activeThread.id, { caseDraft: { ...activeThread.caseDraft, endDate: v } })}
                    />
                  </div>
                  <Field
                    label="品番"
                    value={activeThread.caseDraft.productCode}
                    placeholder="例）ABC-123"
                    onChange={(v) => updateThread(activeThread.id, { caseDraft: { ...activeThread.caseDraft, productCode: v } })}
                  />
                  <TextArea
                    label="施工内容"
                    value={activeThread.caseDraft.workDetail}
                    placeholder="例）クロス張替え、床補修…"
                    onChange={(v) => updateThread(activeThread.id, { caseDraft: { ...activeThread.caseDraft, workDetail: v } })}
                  />
                  <TextArea
                    label="補足メモ"
                    value={activeThread.caseDraft.notes}
                    placeholder="注意点、担当、段取り…"
                    onChange={(v) => updateThread(activeThread.id, { caseDraft: { ...activeThread.caseDraft, notes: v } })}
                  />

                  <div className="flex items-center justify-between gap-3 pt-2">
                    <button
                      onClick={() => {
                        updateThread(activeThread.id, { caseDraft: { ...EMPTY_CASE } });
                        setToast('案件フォームをクリアしました（モック）');
                      }}
                      className="rounded-xl border px-3 py-2 text-sm hover:bg-neutral-50"
                    >
                      クリア
                    </button>
                    <button
                      onClick={saveCaseDraft}
                      className="rounded-xl bg-neutral-900 px-3 py-2 text-sm font-medium text-white hover:bg-neutral-800"
                    >
                      保存（モック）
                    </button>
                  </div>

                  <div className="rounded-2xl border bg-neutral-50 p-3">
                    <div className="text-xs font-semibold text-neutral-700">保存イメージ（後でDB化）</div>
                    <pre className="mt-2 overflow-auto text-xs text-neutral-700">
{JSON.stringify(
  {
    threadId: activeThread.id,
    title: activeThread.title,
    caseDraft: activeThread.caseDraft,
    updatedAt: activeThread.updatedAt,
  },
  null,
  2,
)}
                    </pre>
                  </div>
                </div>
              ) : (
                <div className="text-sm text-neutral-500">スレッドがありません。左上から新規スレッドを作成してください。</div>
              )}
            </div>
          </section>
        </div>
      </main>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-4 left-1/2 z-30 -translate-x-1/2">
          <div className="rounded-2xl bg-neutral-900 px-4 py-2 text-sm text-white shadow-lg">{toast}</div>
        </div>
      )}
    </div>
  );
}

function Field(props: {
  label: string;
  value: string;
  placeholder?: string;
  type?: 'text' | 'date';
  onChange: (v: string) => void;
}) {
  const { label, value, placeholder, type = 'text', onChange } = props;
  return (
    <label className="block">
      <div className="mb-1 text-xs font-semibold text-neutral-700">{label}</div>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-2xl border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-neutral-200"
      />
    </label>
  );
}

function TextArea(props: { label: string; value: string; placeholder?: string; onChange: (v: string) => void }) {
  const { label, value, placeholder, onChange } = props;
  return (
    <label className="block">
      <div className="mb-1 text-xs font-semibold text-neutral-700">{label}</div>
      <textarea
        rows={4}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="w-full resize-none rounded-2xl border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-neutral-200"
      />
    </label>
  );
}
