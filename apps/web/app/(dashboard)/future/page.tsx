'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import type { Assumption, SimulationResult } from '@lifebalance/shared/types'

import { GaugeChart } from '@/components/charts/GaugeChart'
import { ProjectionChart } from '@/components/charts/ProjectionChart'
import { AddGoalModal } from '@/components/modals/AddGoalModal'
import { EditGoalModal } from '@/components/modals/EditGoalModal'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogBody, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Slider } from '@/components/ui/slider'
import { useAssumptions, useUpdateAssumptions } from '@/hooks/useAssumptions'
import { useDebouncedValue } from '@/hooks/useDebouncedValue'
import { useDeleteGoal, useGoals } from '@/hooks/useGoals'
import { useScenarioSimulation, useSimulation } from '@/hooks/useSimulation'
import { useToast } from '@/hooks/useToast'
import { authProfileApi, goalsApi } from '@/lib/api'
import { getApiErrorMessage } from '@/lib/api-error'
import { simulationResult as fallbackSimulationResult } from '@/lib/mocks'
import { formatCurrency, formatNumberInput, parseNumberInput } from '@/lib/utils'

type AssumptionFormState = {
  annual_income_growth: number
  investment_return: number
  inflation_rate: number
}

const PRIMARY_ACTION_BUTTON_CLASS =
  'h-12 bg-[var(--cta-bg)] px-6 text-base font-bold text-[var(--cta-text)] shadow-[var(--cta-shadow)] hover:bg-[var(--cta-hover)]'

const MIN_AGE = 18
const MAX_AGE = 100
const MIN_ANNUAL_INCOME_GROWTH = -10
const MAX_ANNUAL_INCOME_GROWTH = 30
const MIN_INVESTMENT_RETURN = -10
const MAX_INVESTMENT_RETURN = 30
const MIN_INFLATION_RATE = 0
const MAX_INFLATION_RATE = 20
const DEFAULT_SIMULATION_TRIALS = 1000 as const

type AssumptionUpdatePayload = {
  age: number
  annual_income_growth: number
  investment_return: number
  inflation_rate: number
  monthly_investment: number
  simulation_trials: 100 | 500 | 1000
}

function toState(assumption: Assumption): AssumptionFormState {
  return {
    annual_income_growth: assumption.annual_income_growth,
    investment_return: assumption.investment_return,
    inflation_rate: assumption.inflation_rate,
  }
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}

function normalizeToTwoDecimals(value: number) {
  return Number(value.toFixed(2))
}

function toSafeNonNegativeInteger(value: number) {
  if (!Number.isFinite(value)) {
    return 0
  }
  return Math.max(0, Math.round(value))
}

function isSameAssumptionState(a: AssumptionFormState, b: AssumptionFormState) {
  return (
    a.annual_income_growth === b.annual_income_growth &&
    a.investment_return === b.investment_return &&
    a.inflation_rate === b.inflation_rate
  )
}

function buildAssumptionUpdatePayload(
  age: number,
  assumption: AssumptionFormState,
  monthlyInvestment: number,
): AssumptionUpdatePayload | null {
  if (!Number.isFinite(age)) return null
  if (!Number.isFinite(assumption.annual_income_growth)) return null
  if (!Number.isFinite(assumption.investment_return)) return null
  if (!Number.isFinite(assumption.inflation_rate)) return null
  if (!Number.isFinite(monthlyInvestment)) return null

  return {
    age: clamp(Math.round(age), MIN_AGE, MAX_AGE),
    annual_income_growth: normalizeToTwoDecimals(
      clamp(assumption.annual_income_growth, MIN_ANNUAL_INCOME_GROWTH, MAX_ANNUAL_INCOME_GROWTH),
    ),
    investment_return: normalizeToTwoDecimals(
      clamp(assumption.investment_return, MIN_INVESTMENT_RETURN, MAX_INVESTMENT_RETURN),
    ),
    inflation_rate: normalizeToTwoDecimals(clamp(assumption.inflation_rate, MIN_INFLATION_RATE, MAX_INFLATION_RATE)),
    monthly_investment: Math.max(0, Math.round(monthlyInvestment)),
    simulation_trials: DEFAULT_SIMULATION_TRIALS,
  }
}

export default function FuturePage() {
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const { assumptions, isLoading, error } = useAssumptions()
  const { goals, isLoading: goalsLoading, error: goalsError } = useGoals('all')
  const { mutateAsync: updateAssumptions } = useUpdateAssumptions()
  const runSimulation = useSimulation()
  const { mutateAsync: runScenarioSimulation, data: scenarioSimulationData, reset: resetScenarioSimulation } =
    useScenarioSimulation()
  const deleteGoal = useDeleteGoal()

  const [assumption, setAssumption] = useState<AssumptionFormState | null>(null)
  const [simulationStatus, setSimulationStatus] = useState('')
  const [openAddGoal, setOpenAddGoal] = useState(false)
  const [editingGoalId, setEditingGoalId] = useState<string | null>(null)
  const [openAssumptionModal, setOpenAssumptionModal] = useState(false)
  const [commonSavedAmount, setCommonSavedAmount] = useState(0)
  const [commonSavedAmountInput, setCommonSavedAmountInput] = useState('')
  const [isEditingCommonSavedAmount, setIsEditingCommonSavedAmount] = useState(false)
  const [isSavingCommonSavedAmount, setIsSavingCommonSavedAmount] = useState(false)
  const [monthlyIncome, setMonthlyIncome] = useState(0)
  const [monthlyIncomeInput, setMonthlyIncomeInput] = useState('')
  const [isEditingMonthlyIncome, setIsEditingMonthlyIncome] = useState(false)
  const [isSavingMonthlyIncome, setIsSavingMonthlyIncome] = useState(false)
  const lastSimulationRequestKeyRef = useRef<string | null>(null)

  useEffect(() => {
    if (!assumptions) return
    setAssumption(toState(assumptions))
  }, [assumptions])

  useEffect(() => {
    let isMounted = true

    void authProfileApi
      .get()
      .then((profile) => {
        if (!isMounted) return
        setMonthlyIncome(toSafeNonNegativeInteger(Number(profile.monthly_income)))
      })
      .catch((profileError) => {
        if (!isMounted) return
        toast({
          title: getApiErrorMessage(profileError, '月収データの取得に失敗しました。'),
          variant: 'error',
        })
      })

    return () => {
      isMounted = false
    }
  }, [toast])

  useEffect(() => {
    if (goals.length === 0) return
    setCommonSavedAmount(goals[0]?.saved_amount ?? 0)
  }, [goals])

  useEffect(() => {
    if (isEditingCommonSavedAmount) return
    setCommonSavedAmountInput(formatNumberInput(commonSavedAmount))
  }, [commonSavedAmount, isEditingCommonSavedAmount])

  useEffect(() => {
    if (isEditingMonthlyIncome) return
    setMonthlyIncomeInput(formatNumberInput(monthlyIncome))
  }, [isEditingMonthlyIncome, monthlyIncome])

  const goalsMonthlySavingTotal = useMemo(() => {
    return goals.reduce((sum, goal) => {
      return sum + toSafeNonNegativeInteger(Number(goal.monthly_saving))
    }, 0)
  }, [goals])

  const derivedMonthlyInvestment = useMemo(() => {
    const safeAssumptionsMonthlyInvestment = toSafeNonNegativeInteger(Number(assumptions?.monthly_investment))

    if (goalsLoading || goalsError) {
      return safeAssumptionsMonthlyInvestment
    }

    if (!Number.isFinite(goalsMonthlySavingTotal)) {
      return safeAssumptionsMonthlyInvestment
    }

    return goalsMonthlySavingTotal
  }, [assumptions?.monthly_investment, goalsError, goalsLoading, goalsMonthlySavingTotal])

  const debouncedAssumption = useDebouncedValue(assumption, 500)

  useEffect(() => {
    if (!assumptions || !debouncedAssumption) {
      return
    }

    const requestPayload = buildAssumptionUpdatePayload(
      assumptions.age,
      debouncedAssumption,
      derivedMonthlyInvestment,
    )

    if (!requestPayload) {
      lastSimulationRequestKeyRef.current = null
      setSimulationStatus('前提条件に不正な値が含まれているため更新できません。')
      return
    }

    const nextState: AssumptionFormState = {
      annual_income_growth: requestPayload.annual_income_growth,
      investment_return: requestPayload.investment_return,
      inflation_rate: requestPayload.inflation_rate,
    }
    const serverState = toState(assumptions)
    const monthlyInvestmentChanged = assumptions.monthly_investment !== requestPayload.monthly_investment
    const simulationTrialsChanged = assumptions.simulation_trials !== requestPayload.simulation_trials

    if (isSameAssumptionState(serverState, nextState) && !monthlyInvestmentChanged && !simulationTrialsChanged) {
      lastSimulationRequestKeyRef.current = null
      return
    }

    const requestKey = [
      requestPayload.age,
      requestPayload.annual_income_growth,
      requestPayload.investment_return,
      requestPayload.inflation_rate,
      requestPayload.monthly_investment,
      requestPayload.simulation_trials,
    ].join('|')

    if (lastSimulationRequestKeyRef.current === requestKey) {
      return
    }
    lastSimulationRequestKeyRef.current = requestKey

    setSimulationStatus('前提条件を保存しています...')

    void (async () => {
      try {
        await updateAssumptions(requestPayload)
        await runScenarioSimulation({
          ...nextState,
          monthly_investment: requestPayload.monthly_investment,
          simulation_trials: requestPayload.simulation_trials,
        })
        setSimulationStatus('前提条件を更新し、シミュレーションを再計算しました。')
      } catch (error) {
        setSimulationStatus(getApiErrorMessage(error, '前提条件またはシミュレーションの更新に失敗しました。'))
      }
    })()
  }, [assumptions, debouncedAssumption, derivedMonthlyInvestment, runScenarioSimulation, updateAssumptions])

  const editingGoal = useMemo(() => goals.find((goal) => goal.id === editingGoalId) ?? null, [editingGoalId, goals])

  const displayState = useMemo(
    () =>
      assumption ?? {
        annual_income_growth: 3,
        investment_return: 5,
        inflation_rate: 2,
      },
    [assumption],
  )

  const displaySimulation: SimulationResult = useMemo(() => {
    if (scenarioSimulationData && runSimulation.data) {
      const scenarioCalculatedAt = Date.parse(scenarioSimulationData.calculated_at)
      const runCalculatedAt = Date.parse(runSimulation.data.calculated_at)

      if (Number.isFinite(scenarioCalculatedAt) && Number.isFinite(runCalculatedAt)) {
        return scenarioCalculatedAt >= runCalculatedAt ? scenarioSimulationData : runSimulation.data
      }

      return scenarioSimulationData
    }

    return scenarioSimulationData ?? runSimulation.data ?? fallbackSimulationResult
  }, [runSimulation.data, scenarioSimulationData])

  const simulationGoalById = useMemo(
    () => new Map(displaySimulation.goal_probabilities.map((goalProbability) => [goalProbability.goal_id, goalProbability])),
    [displaySimulation.goal_probabilities],
  )

  const displayGoalCards = useMemo(() => {
    if (goals.length > 0) {
      return goals.map((goal) => ({
        key: goal.id,
        goal,
        probability:
          simulationGoalById.get(goal.id) ??
          displaySimulation.goal_probabilities.find((goalProbability) => goalProbability.title === goal.title) ??
          null,
      }))
    }

    return displaySimulation.goal_probabilities.map((goalProbability) => ({
      key: goalProbability.goal_id,
      goal: null,
      probability: goalProbability,
    }))
  }, [displaySimulation.goal_probabilities, goals, simulationGoalById])

  const targetLine = displaySimulation.goal_probabilities[0]?.target_amount ?? 5000000

  async function handleSaveCommonSavedAmount() {
    const nextSavedAmount = Math.max(0, Math.round(parseNumberInput(commonSavedAmountInput) ?? 0))
    setIsSavingCommonSavedAmount(true)

    try {
      if (goals.length > 0) {
        await Promise.all(
          goals.map((goal) =>
            goalsApi.patch(goal.id, {
              saved_amount: nextSavedAmount,
            }),
          ),
        )
        await queryClient.invalidateQueries({ queryKey: ['goals'] })
        await queryClient.invalidateQueries({ queryKey: ['simulation', 'run'] })
        resetScenarioSimulation()
        await runSimulation.refetch()
        setSimulationStatus('現在の貯蓄額を反映してシミュレーションを更新しました。')
      }

      setCommonSavedAmount(nextSavedAmount)
      setIsEditingCommonSavedAmount(false)
      toast({
        title: goals.length > 0 ? '現在の貯蓄額を更新しました。' : '現在の貯蓄額を設定しました。',
        variant: 'success',
      })
    } catch (updateError) {
      toast({
        title: getApiErrorMessage(updateError, '現在の貯蓄額の更新に失敗しました。'),
        variant: 'error',
      })
    } finally {
      setIsSavingCommonSavedAmount(false)
    }
  }

  async function handleSaveMonthlyIncome() {
    const nextMonthlyIncome = toSafeNonNegativeInteger(Number(parseNumberInput(monthlyIncomeInput)))
    if (nextMonthlyIncome < 1) {
      toast({
        title: '現在の月収は1円以上を入力してください。',
        variant: 'error',
      })
      return
    }

    setIsSavingMonthlyIncome(true)
    try {
      await authProfileApi.update({ monthly_income: nextMonthlyIncome })
      setMonthlyIncome(nextMonthlyIncome)
      setIsEditingMonthlyIncome(false)
      toast({
        title: '現在の月収を更新しました。',
        variant: 'success',
      })
    } catch (updateError) {
      toast({
        title: getApiErrorMessage(updateError, '現在の月収の更新に失敗しました。'),
        variant: 'error',
      })
    } finally {
      setIsSavingMonthlyIncome(false)
    }
  }

  return (
    <div className="space-y-5 pb-20 md:pb-28">
      <div className="flex flex-col items-start justify-between gap-3 md:flex-row md:items-center">
        <div>
          <h1 className="font-display text-[30px] font-bold leading-tight tracking-[-0.02em] text-text">貯蓄とライフプラン</h1>
          <p className="text-sm text-text2">目標・貯蓄額の管理や、貯蓄シミュレーションを確認できます</p>
        </div>
        <Button className={PRIMARY_ACTION_BUTTON_CLASS} onClick={() => setOpenAddGoal(true)}>
          ＋ 目標を追加
        </Button>
      </div>

      <div className="space-y-3">
        {goalsLoading ? <p className="text-sm text-text2">目標データを読み込み中...</p> : null}
        {goalsError ? <p className="text-sm text-danger">目標データの取得に失敗しました。</p> : null}
        {!goalsLoading && displayGoalCards.length === 0 ? <p className="text-sm text-text2">目標がまだ登録されていません。</p> : null}

        <div className="grid gap-4 lg:grid-cols-3">
          {displayGoalCards.map((goalCard) => {
            const goal = goalCard.goal
            const probability = goalCard.probability
            const progressPercent = goal ? Math.min(Math.max(goal.progress_rate * 100, 0), 100) : 0
            const displayTitle = goal ? goal.title : probability?.title ?? '達成確率'
            const targetYear = goal?.target_year ?? probability?.target_year

            return (
              <Card key={goalCard.key} className="relative bg-card">
                {goal ? (
                  <div className="absolute right-4 top-4">
                    <Badge
                      variant={goal.priority === '高' ? 'danger' : goal.priority === '中' ? 'warning' : 'success'}
                      size="lg"
                      className="text-xs"
                    >
                      {`優先度 ${goal.priority}`}
                    </Badge>
                  </div>
                ) : null}
                <CardHeader className={goal ? 'pr-20' : undefined}>
                  <CardTitle className="text-accent">{displayTitle}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <GaugeChart value={probability?.probability ?? 0} label={targetYear ? `${targetYear}年までの達成確率` : '達成確率'} />

                  {goal ? (
                    <div className="rounded-xl border border-border bg-card2 p-3">
                      <p className="text-xs text-text2">月積立: {formatCurrency(goal.monthly_saving)}</p>
                      <p className="mt-1 text-sm font-semibold text-text">
                        {formatCurrency(goal.saved_amount)} / {formatCurrency(goal.target_amount)}
                      </p>
                      <div className="mt-2 h-2 rounded-full bg-[var(--track-muted)]">
                        <div className="h-full rounded-full bg-accent2" style={{ width: `${progressPercent}%` }} />
                      </div>
                      {!probability ? <p className="mt-2 text-xs text-text2">達成確率は再計算後に反映されます。</p> : null}
                      <div className="mt-2 flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="hover:!border-[var(--cta-bg)] hover:!bg-[var(--cta-bg)] hover:!text-white"
                          onClick={() => setEditingGoalId(goal.id)}
                        >
                          編集
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="hover:border-danger hover:bg-danger hover:text-white"
                          disabled={deleteGoal.isPending}
                          onClick={() => {
                            const ok = window.confirm('この目標を削除しますか？')
                            if (!ok) return
                            void deleteGoal.mutateAsync(goal.id)
                          }}
                        >
                          削除
                        </Button>
                      </div>
                    </div>
                  ) : null}
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="bg-card">
          <CardHeader>
            <CardTitle className="text-accent">現在の貯蓄額</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1">
              {isEditingCommonSavedAmount ? (
                <Input
                  type="text"
                  inputMode="numeric"
                  placeholder="例: 1,200,000"
                  value={commonSavedAmountInput}
                  onChange={(event) => {
                    const parsed = parseNumberInput(event.target.value)
                    setCommonSavedAmountInput(parsed === undefined ? '' : formatNumberInput(parsed))
                  }}
                  className="h-12 text-lg"
                  aria-label="現在の貯蓄額"
                />
              ) : (
                <p className="font-display text-4xl font-bold text-accent2">{formatCurrency(commonSavedAmount)}</p>
              )}
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                variant="ghost"
                className="hover:!bg-[var(--cta-bg)] hover:!text-white"
                disabled={isSavingCommonSavedAmount}
                onClick={() => {
                  if (!isEditingCommonSavedAmount) {
                    setCommonSavedAmountInput(formatNumberInput(commonSavedAmount))
                    setIsEditingCommonSavedAmount(true)
                    return
                  }
                  void handleSaveCommonSavedAmount()
                }}
              >
                {isEditingCommonSavedAmount ? (isSavingCommonSavedAmount ? '保存中...' : '保存') : '貯蓄額を変更'}
              </Button>

              {isEditingCommonSavedAmount ? (
                <Button
                  size="sm"
                  variant="ghost"
                  disabled={isSavingCommonSavedAmount}
                  onClick={() => {
                    setCommonSavedAmountInput(formatNumberInput(commonSavedAmount))
                    setIsEditingCommonSavedAmount(false)
                  }}
                >
                  キャンセル
                </Button>
              ) : null}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card">
          <CardHeader>
            <CardTitle className="text-accent">現在の月収（手取り）</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1">
              {isEditingMonthlyIncome ? (
                <Input
                  type="text"
                  inputMode="numeric"
                  placeholder="例: 300,000"
                  value={monthlyIncomeInput}
                  onChange={(event) => {
                    const parsed = parseNumberInput(event.target.value)
                    setMonthlyIncomeInput(parsed === undefined ? '' : formatNumberInput(parsed))
                  }}
                  className="h-12 text-lg"
                  aria-label="現在の月収（手取り）"
                />
              ) : (
                <p className="font-display text-4xl font-bold text-accent2">{formatCurrency(monthlyIncome)}</p>
              )}
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                variant="ghost"
                className="hover:!bg-[var(--cta-bg)] hover:!text-white"
                disabled={isSavingMonthlyIncome}
                onClick={() => {
                  if (!isEditingMonthlyIncome) {
                    setMonthlyIncomeInput(formatNumberInput(monthlyIncome))
                    setIsEditingMonthlyIncome(true)
                    return
                  }
                  void handleSaveMonthlyIncome()
                }}
              >
                {isEditingMonthlyIncome ? (isSavingMonthlyIncome ? '保存中...' : '保存') : '月収を変更'}
              </Button>

              {isEditingMonthlyIncome ? (
                <Button
                  size="sm"
                  variant="ghost"
                  disabled={isSavingMonthlyIncome}
                  onClick={() => {
                    setMonthlyIncomeInput(formatNumberInput(monthlyIncome))
                    setIsEditingMonthlyIncome(false)
                  }}
                >
                  キャンセル
                </Button>
              ) : null}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-card">
        <CardHeader>
          <CardTitle className="text-accent">貯蓄推移シミュレーション</CardTitle>
          <Button variant="ghost" size="sm" onClick={() => setOpenAssumptionModal(true)}>
            詳細設定
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          {runSimulation.isLoading ? <p className="text-xs text-text2">初回シミュレーションを読み込み中...</p> : null}
          {runSimulation.error ? (
            <p className="text-xs text-[var(--warn-text)]">シミュレーションAPI取得に失敗したため、表示はフォールバック値です。</p>
          ) : null}
          <p className="text-xs text-text2">月投資額は目標の月積立合計 {formatCurrency(derivedMonthlyInvestment)} を自動反映しています。</p>
          <p className="text-xs text-accent2">{simulationStatus}</p>
          <ProjectionChart data={displaySimulation.yearly_projections} targetLine={targetLine} />
        </CardContent>
      </Card>

      <Dialog open={openAssumptionModal} onOpenChange={setOpenAssumptionModal}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>前提条件の詳細設定</DialogTitle>
            <button
              type="button"
              className="text-text2 hover:text-text"
              onClick={() => setOpenAssumptionModal(false)}
              aria-label="閉じる"
            >
              ✕
            </button>
          </DialogHeader>
          <DialogBody className="space-y-4">
            {isLoading ? <p className="text-sm text-text2">前提条件を読み込み中...</p> : null}
            {error ? <p className="text-sm text-danger">前提条件の取得に失敗しました。</p> : null}

            <div className="grid gap-4 md:grid-cols-2">
              <SliderField
                label="年収上昇率(%)"
                value={displayState.annual_income_growth}
                min={-10}
                max={30}
                step={0.1}
                onChange={(value) =>
                  setAssumption((prev) => ({
                    ...(prev ?? displayState),
                    annual_income_growth: value,
                  }))
                }
              />
              <SliderField
                label="投資利回り(%)"
                value={displayState.investment_return}
                min={-10}
                max={30}
                step={0.1}
                onChange={(value) =>
                  setAssumption((prev) => ({
                    ...(prev ?? displayState),
                    investment_return: value,
                  }))
                }
              />
              <SliderField
                label="インフレ率(%)"
                value={displayState.inflation_rate}
                min={0}
                max={20}
                step={0.1}
                onChange={(value) => setAssumption((prev) => ({ ...(prev ?? displayState), inflation_rate: value }))}
              />
            </div>
            <p className="text-xs text-text2">
              年齢は設定ページで編集できます。月投資額は目標の月積立合計 {formatCurrency(derivedMonthlyInvestment)} から自動算出されます。
            </p>
          </DialogBody>
        </DialogContent>
      </Dialog>

      <AddGoalModal open={openAddGoal} onOpenChange={setOpenAddGoal} currentSavedAmount={commonSavedAmount} />
      <EditGoalModal
        open={Boolean(editingGoal)}
        onOpenChange={(open) => {
          if (!open) {
            setEditingGoalId(null)
          }
        }}
        goal={editingGoal}
      />
    </div>
  )
}

function SliderField({
  label,
  value,
  min,
  max,
  step,
  ariaLabel,
  onChange,
}: {
  label: string
  value: number
  min: number
  max: number
  step?: number
  ariaLabel?: string
  onChange: (value: number) => void
}) {
  return (
    <div className="space-y-2 rounded-xl border border-border bg-card2 p-3">
      <div className="flex items-center justify-between">
        <p className="text-xs text-text2">{label}</p>
        <p className="font-display text-base font-semibold text-accent">{value}</p>
      </div>
      <Slider value={value} min={min} max={max} step={step} onValueChange={onChange} aria-label={ariaLabel ?? label} />
    </div>
  )
}
