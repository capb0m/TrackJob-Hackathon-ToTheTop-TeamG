'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { budgetsApi } from '@/lib/api'
import { getApiErrorMessage } from '@/lib/api-error'
import { queryKeys } from '@/lib/query-keys'
import { getCurrentYearMonth } from '@/lib/utils'
import { useToast } from '@/hooks/useToast'

export function useBudgets(yearMonth = getCurrentYearMonth()) {
  const query = useQuery({
    queryKey: queryKeys.budgets(yearMonth),
    queryFn: () => budgetsApi.get(yearMonth),
  })

  return {
    ...query,
    budgetSummary: query.data ?? null,
    budgets: query.data?.budgets ?? [],
  }
}

export function useUpdateBudgets() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: budgetsApi.updateBulk,
    onSuccess: (_data, payload) => {
      void Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.budgets(payload.year_month) }),
        queryClient.invalidateQueries({ queryKey: ['transactions'] }),
      ])
      toast({ title: '予算を一括更新しました。', variant: 'success' })
    },
    onError: (error) => {
      toast({
        title: getApiErrorMessage(error, '予算の一括更新に失敗しました。'),
        variant: 'error',
      })
    },
  })
}

export function usePatchBudget(yearMonth = getCurrentYearMonth()) {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: (payload: { id: string; limit_amount?: number; is_fixed?: boolean }) =>
      budgetsApi.patch(payload.id, {
        limit_amount: payload.limit_amount,
        is_fixed: payload.is_fixed,
      }),
    onSuccess: () => {
      void Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.budgets(yearMonth) }),
        queryClient.invalidateQueries({ queryKey: ['transactions'] }),
      ])
      toast({ title: '予算を更新しました。', variant: 'success' })
    },
    onError: (error) => {
      toast({
        title: getApiErrorMessage(error, '予算の更新に失敗しました。'),
        variant: 'error',
      })
    },
  })
}
