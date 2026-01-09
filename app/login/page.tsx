'use client'

import { useState } from 'react'
import { signIn } from '../actions/auth'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const onLogin = async () => {
    setLoading(true)
    const res = await signIn(email, password)
    setLoading(false)

    if (res?.error) {
      alert(res.error)
      return
    }

    router.push('/')
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="w-80 space-y-4">
        <h1 className="text-xl font-bold">ログイン</h1>
        <input
          className="w-full border p-2"
          placeholder="email"
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          className="w-full border p-2"
          type="password"
          placeholder="password"
          onChange={(e) => setPassword(e.target.value)}
        />
        <button
          onClick={onLogin}
          disabled={loading}
          className="w-full bg-black text-white p-2"
        >
          ログイン
        </button>
      </div>
    </div>
  )
}
