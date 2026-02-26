'use client'

import { useMemo } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import {
  type CreateTransactionBody,
  type ListTransactionsParams,
  transactionsApi,
  type UpdateTransactionBody,
} from '@/lib/api'
import { getApiErrorMessage } from '@/lib/api-error'
import { queryKeys } from '@/lib/query-keys'
import { getCurrentYearMonth } from '@/lib/utils'
import { useToast } from '@/hooks/useToast'

const DEFAULT_LIMIT = 20

export function useTransactions(params: ListTransactionsParams) {
  const normalized = useMemo(
    () => ({
      page: 1,
      limit: DEFAULT_LIMIT,
      order: 'desc' as const,
      sort: 'transacted_at' as const,
      ...params,
    }),
    [params],
  )

  const paramsKey = useMemo(() => JSON.stringify(normalized), [normalized])

  const query = useQuery({
    queryKey: queryKeys.transactions(paramsKey),
    queryFn: () => transactionsApi.list(normalized),
  })

  return {
    ...query,
    transactions: query.data?.data ?? [],
    pagination: query.data?.pagination ?? null,
  }
}

export function useTransactionSummary(yearMonth = getCurrentYearMonth()) {
  return useQuery({
    queryKey: queryKeys.transactionSummary(yearMonth),
    queryFn: () => transactionsApi.summary(yearMonth),
  })
}

export function useTransactionTrend(range: '1m' | '3m' | '1y') {
  return useQuery({
    queryKey: queryKeys.transactionTrend(range),
    queryFn: () => transactionsApi.trend(range),
  })
}

export function useRecordingStreak() {
  const query = useQuery({
    queryKey: queryKeys.transactionStreak(),
    queryFn: () => transactionsApi.streak(),
  })
  return {
    ...query,
    streakDays: query.data?.streak_days ?? 0,
  }
}

export function useCreateTransaction() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: (body: CreateTransactionBody) => transactionsApi.create(body),
    onSuccess: () => {
      void Promise.all([queryClient.invalidateQueries({ queryKey: ['transactions'] }), queryClient.invalidateQueries({ queryKey: ['budgets'] })])
    },
    onError: (error) => {
      toast({
        title: getApiErrorMessage(error, '支出の保存に失敗しました。'),
        variant: 'error',
      })
    },
  })
}

export function usePatchTransaction() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: (payload: { id: string; body: UpdateTransactionBody }) => transactionsApi.patch(payload.id, payload.body),
    onSuccess: () => {
      void Promise.all([queryClient.invalidateQueries({ queryKey: ['transactions'] }), queryClient.invalidateQueries({ queryKey: ['budgets'] })])
      toast({ title: '履歴を更新しました。', variant: 'success' })
    },
    onError: (error) => {
      toast({
        title: getApiErrorMessage(error, '履歴の更新に失敗しました。'),
        variant: 'error',
      })
    },
  })
}

export function useDeleteTransaction() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: (id: string) => transactionsApi.remove(id),
    onSuccess: () => {
      void Promise.all([queryClient.invalidateQueries({ queryKey: ['transactions'] }), queryClient.invalidateQueries({ queryKey: ['budgets'] })])
      toast({ title: '履歴を削除しました。', variant: 'success' })
    },
    onError: (error) => {
      toast({
        title: getApiErrorMessage(error, '履歴の削除に失敗しました。'),
        variant: 'error',
      })
    },
  })
}
