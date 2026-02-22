import { useCallback } from 'react'

import { useToastStore, type ToastVariant } from '@/stores/toastStore'

export function useToast() {
  const pushToast = useToastStore((state) => state.pushToast)

  const toast = useCallback(
    ({
      title,
      description,
      variant = 'default',
    }: {
      title: string
      description?: string
      variant?: ToastVariant
    }) => {
      pushToast({ title, description, variant })
    },
    [pushToast],
  )

  return { toast }
}
