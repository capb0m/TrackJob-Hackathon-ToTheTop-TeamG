'use client'

import { useMemo } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { type CreateTransactionBody, transactionsApi, type ListTransactionsParams } from '@/lib/api'
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

export function useCreateTransaction() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: (body: CreateTransactionBody) => transactionsApi.create(body),
    onSuccess: (_transaction, payload) => {
      const yearMonth = payload.transacted_at.slice(0, 7)
      void Promise.all([
        queryClient.invalidateQueries({ queryKey: ['transactions'] }),
        queryClient.invalidateQueries({ queryKey: queryKeys.transactionSummary(yearMonth) }),
        queryClient.invalidateQueries({ queryKey: ['budgets'] }),
      ])
    },
    onError: (error) => {
      toast({
        title: getApiErrorMessage(error, '支出の保存に失敗しました。'),
        variant: 'error',
      })
    },
  })
}
