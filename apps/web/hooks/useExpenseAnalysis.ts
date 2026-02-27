'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import type { AdviceItem, AdviceLog } from '@lifebalance/shared/types'

import { adviceApi } from '@/lib/api'

const FALLBACK_TREND: AdviceItem = {
  title: '支出データの蓄積を続けましょう',
  body: '記録が増えるほど傾向の精度が高まり、より具体的な改善案を作れます。',
}

const FALLBACK_IDEA: AdviceItem = {
  title: '固定費の見直しから着手',
  body: '通信費やサブスクの整理は、無理なく毎月の支出を下げやすい改善策です。',
}

const FALLBACK_NEXT_ACTION = '週に1回、カテゴリ別の支出を確認する'

export type ExpenseAnalysis = {
  month: string
  generated_at: string
  trend: AdviceItem
  idea: AdviceItem
  next_action: string
}

function toExpenseAnalysis(advice: AdviceLog): ExpenseAnalysis {
  const trend = advice.content.urgent[0] ?? advice.content.suggestions[0] ?? FALLBACK_TREND
  const idea =
    advice.content.suggestions.find((item) => item.title !== trend.title || item.body !== trend.body) ??
    advice.content.suggestions[0] ??
    advice.content.urgent[1] ??
    FALLBACK_IDEA

  return {
    month: advice.month,
    generated_at: advice.generated_at,
    trend,
    idea,
    next_action: advice.content.next_month_goals[0] ?? FALLBACK_NEXT_ACTION,
  }
}

export function useExpenseAnalysis(month: string) {
  const [analysis, setAnalysis] = useState<ExpenseAnalysis | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const requestIdRef = useRef(0)

  const load = useCallback(async () => {
    const requestId = requestIdRef.current + 1
    requestIdRef.current = requestId

    setLoading(true)
    setError(null)
    setAnalysis(null)

    try {
      const advice = await adviceApi.generate({ month, force: false })
      if (requestId !== requestIdRef.current) {
        return
      }
      setAnalysis(toExpenseAnalysis(advice))
    } catch (requestError) {
      if (requestId !== requestIdRef.current) {
        return
      }
      setError(requestError instanceof Error ? requestError.message : '分析の生成に失敗しました')
    } finally {
      if (requestId === requestIdRef.current) {
        setLoading(false)
      }
    }
  }, [month])

  const refresh = useCallback(async () => {
    const requestId = requestIdRef.current + 1
    requestIdRef.current = requestId

    try {
      setRefreshing(true)
      setError(null)
      const advice = await adviceApi.generate({ month, force: true })
      if (requestId !== requestIdRef.current) {
        return
      }
      setAnalysis(toExpenseAnalysis(advice))
    } catch (requestError) {
      if (requestId !== requestIdRef.current) {
        return
      }
      setError(requestError instanceof Error ? requestError.message : '分析の再生成に失敗しました')
    } finally {
      setRefreshing(false)
    }
  }, [month])

  useEffect(() => {
    void load()
  }, [load])

  return {
    analysis,
    loading,
    refreshing,
    error,
    refresh,
  }
}
