'use client'

import { PageErrorFallback } from '@/components/feedback/PageErrorFallback'

export default function Error({ reset }: { reset: () => void }) {
  return <PageErrorFallback onRetry={reset} />
}
