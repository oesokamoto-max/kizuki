import './globals.css'
import type { ReactNode } from 'react'
import { fetchLatestMemos } from './actions/memos'
import LeftMenu from '@/components/LeftMenu'

export default async function RootLayout({ children }: { children: ReactNode }) {
  const memos = await fetchLatestMemos(5)

  return (
    <html lang="ja">
      <body className="h-screen overflow-hidden">
        <div className="flex h-full">
          {/* 左メニュー */}
          <aside className="w-60 border-r p-4">
            <LeftMenu memos={memos as any} />
          </aside>

          {/* 右を含むメイン領域は children に任せる */}
          <div className="flex-1 overflow-hidden">{children}</div>
        </div>
      </body>
    </html>
  )
}

