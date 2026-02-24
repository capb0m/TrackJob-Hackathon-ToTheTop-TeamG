'use client'

import { useEffect, useRef, useState } from 'react'

import { ScoreHistoryChart } from '@/components/charts/ScoreHistoryChart'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { useAdvice } from '@/hooks/useAdvice'
import { chatApi } from '@/lib/api'

type Message = { role: 'user' | 'ai'; content: string }

function AiAvatar() {
  const [imgError, setImgError] = useState(false)
  if (imgError) {
    return (
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-accent to-accent2 text-sm">
        🤖
      </div>
    )
  }
  return (
    <img
      src="/ai-avatar.svg"
      alt="KakeAI"
      width={32}
      height={32}
      className="h-8 w-8 shrink-0 rounded-full object-cover"
      onError={() => setImgError(true)}
    />
  )
}

export default function AdvicePage() {
  const { advice, history, loading, refreshing, error, refresh } = useAdvice()
  const [question, setQuestion] = useState('')
  const [messages, setMessages] = useState<Message[]>([])
  const [sending, setSending] = useState(false)
  const [chatError, setChatError] = useState<string | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, sending])

  async function handleSend() {
    if (!question.trim() || sending) return
    const userMessage = question.trim()
    setQuestion('')
    setSending(true)
    setChatError(null)
    setMessages((prev) => [...prev, { role: 'user', content: userMessage }])
    try {
      const res = await chatApi.send([
        {
          role: 'user',
          content: `あなたは家計管理AIアシスタント「KakeAI」です。ユーザーの家計・節約・投資に関する質問にわかりやすく答えてください。\n\n質問: ${userMessage}`,
        },
      ])
      setMessages((prev) => [...prev, { role: 'ai', content: res.content }])
    } catch {
      setChatError('回答の取得に失敗しました。もう一度お試しください。')
    } finally {
      setSending(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-5">
        <h1 className="font-display text-2xl font-bold">AIアドバイス</h1>
        <p className="text-sm text-text2">読み込み中...</p>
      </div>
    )
  }

  if (!advice) {
    return (
      <div className="space-y-5">
        <h1 className="font-display text-2xl font-bold">AIアドバイス</h1>
        <p className="text-sm text-red-300">{error ?? 'アドバイスがありません。'}</p>
        <Button onClick={() => void refresh()} disabled={refreshing}>
          {refreshing ? '更新中...' : '再取得する'}
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold">AIアドバイス</h1>
          <p className="text-sm text-text2">改善効果に応じた家計アクションを確認できます</p>
        </div>
        <Button onClick={() => void refresh()} disabled={refreshing}>
          {refreshing ? '更新中...' : 'アドバイスを更新'}
        </Button>
      </div>

      {error ? <p className="text-sm text-red-300">{error}</p> : null}

      <div className="grid gap-5 lg:grid-cols-[3fr_2fr] lg:items-stretch">
        {/* Left: advice content */}
        <div className="space-y-4">
          {/* Score + 来月の目標 + chart */}
          <Card>
            <CardContent className="flex items-start gap-4 py-3">
              <div className="shrink-0 space-y-3">
                <div className="rounded-lg border border-accent2/30 bg-accent2/10 px-4 py-2 text-center">
                  <p className="text-xs text-text2">家計スコア</p>
                  <p className="font-display text-3xl font-bold leading-tight text-accent2">{advice.score}</p>
                  <p className="text-xs text-text2">/ 100点</p>
                </div>
                <div>
                  <p className="mb-1 text-xs font-semibold text-text">来月の目標</p>
                  <ul className="list-disc space-y-1 pl-4 text-xs text-text2">
                    {advice.content.next_month_goals.map((goal) => (
                      <li key={goal}>{goal}</li>
                    ))}
                  </ul>
                </div>
              </div>
              <div className="min-w-0 flex-1">
                <ScoreHistoryChart data={history} />
              </div>
            </CardContent>
          </Card>

          {/* 改善提案 + 継続中の良い点 */}
          <div className="grid gap-4 md:grid-cols-2">
            <AdviceSection title="改善提案" items={advice.content.suggestions} tone="border-warn/30 bg-warn/10" />
            <AdviceSection title="継続中の良い点" items={advice.content.positives} tone="border-accent/30 bg-accent/10" />
          </div>
        </div>

        {/* Right: KakeAI chat — stretches to full row height */}
        <Card className="flex flex-col">
          <CardHeader className="shrink-0">
            <CardTitle>🤖 KakeAIに質問する</CardTitle>
          </CardHeader>
          <CardContent className="flex min-h-0 flex-1 flex-col gap-3 pb-4">
            {/* Messages area */}
            <div
              className="min-h-0 flex-1 overflow-y-auto space-y-4 rounded-lg border border-white/10 bg-bg p-3"
              aria-live="polite"
            >
              {/* Initial greeting */}
              {messages.length === 0 ? (
                <div className="flex items-start gap-2">
                  <AiAvatar />
                  <div className="max-w-[85%] rounded-lg rounded-tl-none border border-accent/20 bg-accent/10 px-3 py-2 text-sm text-text">
                    家計・節約・投資について何でも質問してください！
                  </div>
                </div>
              ) : null}

              {messages.map((msg, i) =>
                msg.role === 'ai' ? (
                  <div key={i} className="flex items-start gap-2">
                    <AiAvatar />
                    <div className="max-w-[85%] rounded-lg rounded-tl-none border border-accent/20 bg-accent/10 px-3 py-2 text-sm text-text">
                      <p className="whitespace-pre-wrap">{msg.content}</p>
                    </div>
                  </div>
                ) : (
                  <div key={i} className="flex justify-end">
                    <div className="max-w-[85%] rounded-lg rounded-tr-none border border-white/10 bg-card px-3 py-2 text-sm text-text">
                      <p className="whitespace-pre-wrap">{msg.content}</p>
                    </div>
                  </div>
                ),
              )}

              {/* Loading dots */}
              {sending ? (
                <div className="flex items-start gap-2">
                  <AiAvatar />
                  <div className="rounded-lg rounded-tl-none border border-accent/20 bg-accent/10 px-3 py-2">
                    <span className="inline-flex gap-1">
                      <span className="animate-bounce text-accent" style={{ animationDelay: '0ms' }}>●</span>
                      <span className="animate-bounce text-accent" style={{ animationDelay: '150ms' }}>●</span>
                      <span className="animate-bounce text-accent" style={{ animationDelay: '300ms' }}>●</span>
                    </span>
                  </div>
                </div>
              ) : null}

              <div ref={bottomRef} />
            </div>

            {chatError ? <p className="shrink-0 text-xs text-red-300">{chatError}</p> : null}

            {/* Input form */}
            <form
              className="flex shrink-0 gap-2"
              onSubmit={(e) => {
                e.preventDefault()
                void handleSend()
              }}
            >
              <Input
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="質問を入力してください"
                disabled={sending}
                aria-label="質問入力"
              />
              <Button type="submit" disabled={!question.trim() || sending}>
                送信
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function AdviceSection({ title, items, tone }: { title: string; items: Array<{ title: string; body: string }>; tone: string }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {items.map((item) => (
          <article key={item.title} className={`rounded-lg border p-3 ${tone}`}>
            <h3 className="text-sm font-semibold">{item.title}</h3>
            <p className="mt-1 text-xs text-text2">{item.body}</p>
          </article>
        ))}
      </CardContent>
    </Card>
  )
}
