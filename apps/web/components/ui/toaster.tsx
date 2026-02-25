'use client'

import { useEffect } from 'react'

import { cn } from '@/lib/utils'
import { useToastStore } from '@/stores/toastStore'

export function Toaster() {
  const toasts = useToastStore((state) => state.toasts)
  const removeToast = useToastStore((state) => state.removeToast)

  useEffect(() => {
    const timers = toasts.map((toast) =>
      window.setTimeout(() => {
        removeToast(toast.id)
      }, 3200),
    )

    return () => {
      timers.forEach((timer) => window.clearTimeout(timer))
    }
  }, [removeToast, toasts])

  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-[70] flex w-[300px] flex-col gap-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={cn(
            'pointer-events-auto rounded-lg border px-4 py-3 shadow-lg backdrop-blur-sm',
            toast.variant === 'success' && 'border-success/35 bg-success/15',
            toast.variant === 'error' && 'border-danger/35 bg-danger/15',
            (!toast.variant || toast.variant === 'default') && 'border-border bg-card/95',
          )}
        >
          <p className="text-sm font-semibold text-text">{toast.title}</p>
          {toast.description ? <p className="mt-1 text-xs text-text2">{toast.description}</p> : null}
        </div>
      ))}
    </div>
  )
}
