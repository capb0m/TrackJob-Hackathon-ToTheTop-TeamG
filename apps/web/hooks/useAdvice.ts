'use client'

import { useCallback, useEffect, useState } from 'react'
import type { AdviceHistoryItem, AdviceLog } from '@lifebalance/shared/types'

import { adviceApi, ApiError } from '@/lib/api'

function getCurrentYearMonth() {
  return new Date().toISOString().slice(0, 7)
}

export function useAdvice() {
  const [advice, setAdvice] = useState<AdviceLog | null>(null)
  const [history, setHistory] = useState<AdviceHistoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const month = getCurrentYearMonth()

      let latestAdvice: AdviceLog
      try {
        latestAdvice = await adviceApi.get(month)
      } catch (requestError) {
        if (!(requestError instanceof ApiError) || requestError.code !== 'NOT_FOUND') {
          throw requestError
        }
        latestAdvice = await adviceApi.generate({ month, force: false })
      }

      const scoreHistory = await adviceApi.history(6)
      setAdvice(latestAdvice)
      setHistory(scoreHistory)
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'アドバイスの取得に失敗しました')
    } finally {
      setLoading(false)
    }
  }, [])

  const refresh = useCallback(async () => {
    try {
      setRefreshing(true)
      setError(null)
      const month = getCurrentYearMonth()
      const [latestAdvice, scoreHistory] = await Promise.all([
        adviceApi.generate({ month, force: true }),
        adviceApi.history(6),
      ])
      setAdvice(latestAdvice)
      setHistory(scoreHistory)
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'アドバイスの更新に失敗しました')
    } finally {
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  return {
    advice,
    history,
    loading,
    refreshing,
    error,
    refresh,
  }
}
