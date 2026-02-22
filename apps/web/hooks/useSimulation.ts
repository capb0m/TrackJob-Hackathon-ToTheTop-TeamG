'use client'

import { useMutation, useQuery } from '@tanstack/react-query'

import { simulationApi } from '@/lib/api'
import { getApiErrorMessage } from '@/lib/api-error'
import { useToast } from '@/hooks/useToast'

export function useSimulation() {
  return useQuery({
    queryKey: ['simulation', 'run'],
    queryFn: () => simulationApi.run(false),
  })
}

export function useScenarioSimulation() {
  const { toast } = useToast()

  return useMutation({
    mutationFn: simulationApi.scenario,
    onError: (error) => {
      toast({
        title: getApiErrorMessage(error, 'シミュレーションの再計算に失敗しました。'),
        variant: 'error',
      })
    },
  })
}
