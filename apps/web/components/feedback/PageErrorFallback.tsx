'use client'

import { Button } from '@/components/ui/button'

interface PageErrorFallbackProps {
  title?: string
  message?: string
  onRetry?: () => void
}

export function PageErrorFallback({
  title = 'ページの表示でエラーが発生しました',
  message = '時間をおいて再度お試しください。',
  onRetry,
}: PageErrorFallbackProps) {
  return (
    <div className="mx-auto mt-20 max-w-md rounded-xl border border-red-400/30 bg-red-500/10 p-6 text-center">
      <h2 className="mb-2 font-display text-xl font-bold text-red-200">{title}</h2>
      <p className="mb-4 text-sm text-red-100/80">{message}</p>
      {onRetry ? (
        <Button onClick={onRetry} variant="ghost">
          再試行
        </Button>
      ) : null}
    </div>
  )
}
