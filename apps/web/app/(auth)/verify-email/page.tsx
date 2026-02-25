'use client'

import Link from 'next/link'

export default function VerifyEmailPage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 text-center shadow-[0_10px_28px_rgba(35,55,95,0.06)]">
        <div className="mb-4 text-5xl">📧</div>
        <h1 className="font-display text-2xl font-bold">メールを確認してください</h1>
        <p className="mt-3 text-sm text-text2">
          確認メールを送信しました。
          <br />
          メール内のリンクをクリックして登録を完了してください。
        </p>
        <p className="mt-6 text-sm text-text2">
          確認後は{' '}
          <Link className="text-accent underline" href="/login">
            ログイン
          </Link>
          へお進みください。
        </p>
      </div>
    </main>
  )
}
