'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { assumptionsApi } from '@/lib/api'
import { getApiErrorMessage } from '@/lib/api-error'
import { queryKeys } from '@/lib/query-keys'
import { useToast } from '@/hooks/useToast'

export function useAssumptions() {
  const query = useQuery({
    queryKey: queryKeys.assumptions(),
    queryFn: () => assumptionsApi.get(),
  })

  return {
    ...query,
    assumptions: query.data ?? null,
  }
}

export function useUpdateAssumptions() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: assumptionsApi.update,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.assumptions() })
    },
    onError: (error) => {
      toast({
        title: getApiErrorMessage(error, '前提条件の更新に失敗しました。'),
        variant: 'error',
      })
    },
  })
}
