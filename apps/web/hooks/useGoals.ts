'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { goalsApi } from '@/lib/api'
import { getApiErrorMessage } from '@/lib/api-error'
import { queryKeys } from '@/lib/query-keys'
import { useToast } from '@/hooks/useToast'

type GoalStatusFilter = 'all' | 'active' | 'paused' | 'completed'

export function useGoals(status: GoalStatusFilter = 'all') {
  const query = useQuery({
    queryKey: queryKeys.goals(status),
    queryFn: () => goalsApi.list(status === 'all' ? undefined : status),
  })

  return {
    ...query,
    goals: query.data ?? [],
  }
}

export function useCreateGoal() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: goalsApi.create,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['goals'] })
      void queryClient.invalidateQueries({ queryKey: queryKeys.simulationRun() })
      toast({ title: '目標を追加しました。', variant: 'success' })
    },
    onError: (error) => {
      toast({
        title: getApiErrorMessage(error, '目標の追加に失敗しました。'),
        variant: 'error',
      })
    },
  })
}

export function usePatchGoal() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: (payload: {
      id: string
      body: Parameters<typeof goalsApi.patch>[1]
    }) => goalsApi.patch(payload.id, payload.body),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['goals'] })
      void queryClient.invalidateQueries({ queryKey: queryKeys.simulationRun() })
      toast({ title: '目標を更新しました。', variant: 'success' })
    },
    onError: (error) => {
      toast({
        title: getApiErrorMessage(error, '目標の更新に失敗しました。'),
        variant: 'error',
      })
    },
  })
}

export function useDeleteGoal() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: (id: string) => goalsApi.remove(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['goals'] })
      void queryClient.invalidateQueries({ queryKey: queryKeys.simulationRun() })
      toast({ title: '目標を削除しました。', variant: 'success' })
    },
    onError: (error) => {
      toast({
        title: getApiErrorMessage(error, '目標の削除に失敗しました。'),
        variant: 'error',
      })
    },
  })
}
