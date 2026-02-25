'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { getSupabaseBrowserClient } from '@/lib/supabase'

export default function RegisterPage() {
  const router = useRouter()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleRegister(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLoading(true)
    setError('')

    try {
      const supabase = getSupabaseBrowserClient()
      const { error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/login`,
        },
      })

      if (signUpError) {
        setError(signUpError.message)
        return
      }

      router.push('/verify-email')
    } catch (registerError) {
      setError(registerError instanceof Error ? registerError.message : '登録に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-[0_10px_28px_rgba(35,55,95,0.06)]">
        <h1 className="font-display text-2xl font-bold">新規登録</h1>
        <p className="mt-1 text-sm text-text2">メールアドレスとパスワードを入力してアカウントを作成してください。</p>

        <form onSubmit={handleRegister} className="mt-6 space-y-4">
          <div>
            <label className="text-xs text-text2" htmlFor="email">
              メールアドレス
            </label>
            <Input id="email" type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
          </div>
          <div>
            <label className="text-xs text-text2" htmlFor="password">
              パスワード
            </label>
            <Input id="password" type="password" autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} required />
          </div>

          {error ? <p className="text-sm text-danger">{error}</p> : null}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? '登録中...' : '登録する'}
          </Button>
        </form>

        <p className="mt-4 text-sm text-text2">
          すでにアカウントをお持ちの方は{' '}
          <Link className="text-accent underline" href="/login">
            ログイン
          </Link>
        </p>
      </div>
    </main>
  )
}
