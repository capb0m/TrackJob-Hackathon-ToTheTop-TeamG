'use client'

import { useMemo, useState } from 'react'
import { useQueries } from '@tanstack/react-query'

import { TrendChart } from '@/components/charts/TrendChart'
import { AddExpenseModal } from '@/components/modals/AddExpenseModal'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs } from '@/components/ui/tabs'
import { useAdvice } from '@/hooks/useAdvice'
import { useBudgets } from '@/hooks/useBudgets'
import { useGoals } from '@/hooks/useGoals'
import { useRecordingStreak, useTransactions, useTransactionSummary } from '@/hooks/useTransactions'
import { transactionsApi } from '@/lib/api'
import { queryKeys } from '@/lib/query-keys'
import { formatCurrency, formatPercent, getCurrentYearMonth } from '@/lib/utils'
import { useChatWizardStore } from '@/stores/chatWizardStore'

const tabs = [
  { value: '3m', label: '3ヶ月' },
  { value: '6m', label: '6ヶ月' },
  { value: '1y', label: '1年' },
] 

type RangeKey = '3m' | '6m' | '1y'

function rangeToCount(range: RangeKey) {
  switch (range) {
    case '3m':
      return 3
    case '6m':
      return 6
    default:
      return 12
  }
}

function buildYearMonthList(count: number) {
  const now = new Date()
  return Array.from({ length: count }).map((_, index) => {
    const monthsBack = count - index - 1
    const date = new Date(now.getFullYear(), now.getMonth() - monthsBack, 1)
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
  })
}

export default function DashboardPage() {
  const [range, setRange] = useState<RangeKey>('3m')
  const [expenseModalOpen, setExpenseModalOpen] = useState(false)
  const openChat = useChatWizardStore((state) => state.open)

  const currentYearMonth = getCurrentYearMonth()
  const months = useMemo(() => buildYearMonthList(rangeToCount(range)), [range])

  const { data: currentSummary, isLoading: summaryLoading } = useTransactionSummary(currentYearMonth)
  const { streakDays } = useRecordingStreak()
  const { budgetSummary } = useBudgets(currentYearMonth)
  const { goals } = useGoals('all')
  const { transactions: recentTransactions, isLoading: transactionsLoading } = useTransactions({
    year_month: currentYearMonth,
    page: 1,
    limit: 5,
    order: 'desc',
    sort: 'transacted_at',
  })
  const { advice, loading: adviceLoading } = useAdvice()

  const trendQueries = useQueries({
    queries: months.map((yearMonth) => ({
      queryKey: queryKeys.transactionSummary(yearMonth),
      queryFn: () => transactionsApi.summary(yearMonth),
    })),
  })

  const trendData = useMemo(
    () =>
      months.map((yearMonth, index) => {
        const data = trendQueries[index]?.data
        return {
          month: `${Number(yearMonth.slice(5))}月`,
          expense: data?.total_expense ?? 0,
          saving: data?.net_saving ?? 0,
          budget: budgetSummary?.total_budget ?? 0,
        }
      }),
    [budgetSummary?.total_budget, months, trendQueries],
  )

  const savingTarget = useMemo(
    () => goals.reduce((sum, goal) => sum + Math.max(0, goal.monthly_saving), 0),
    [goals],
  )
  const totalSavedAmount = useMemo(
    () => goals.reduce((sum, goal) => sum + Math.max(0, goal.saved_amount), 0),
    [goals],
  )
  const totalTargetAmount = useMemo(
    () => goals.reduce((sum, goal) => sum + Math.max(0, goal.target_amount), 0),
    [goals],
  )

  return (
    <div className="space-y-5">
      <div className="flex flex-col items-start justify-between gap-3 md:flex-row md:items-center">
        <div>
          <h1 className="font-display text-2xl font-bold">おはようございます 👋</h1>
          <p className="text-sm text-text2">{currentYearMonth} — 今月の残り予算を確認しましょう</p>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" onClick={() => openChat('setup')}>
            🤖 チャット設定
          </Button>
          <Button onClick={() => setExpenseModalOpen(true)}>＋ 支出を追加</Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="今月の支出"
          value={currentSummary?.total_expense ?? 0}
          subLabel={summaryLoading ? '読み込み中...' : `収入 ${formatCurrency(currentSummary?.total_income ?? 0)}`}
          progress={(currentSummary?.total_expense ?? 0) / Math.max(1, budgetSummary?.total_budget ?? 0)}
          progressLabel={`予算 ${formatCurrency(budgetSummary?.total_budget ?? 0)}`}
          tone="warn"
        />
        <StatCard
          label="今月の貯蓄"
          value={currentSummary?.net_saving ?? 0}
          subLabel={savingTarget > 0 ? `目標達成率 ${formatPercent((currentSummary?.net_saving ?? 0) / savingTarget)}` : '目標未設定'}
          progress={(currentSummary?.net_saving ?? 0) / Math.max(1, savingTarget)}
          progressLabel={`目標 ${formatCurrency(savingTarget)}`}
          tone="blue"
        />
        <StatCard
          label="総資産（目標進捗）"
          value={totalSavedAmount}
          subLabel={`${goals.length}件の目標を管理中`}
          progress={totalSavedAmount / Math.max(1, totalTargetAmount)}
          progressLabel={`目標総額 ${formatCurrency(totalTargetAmount)}`}
          tone="green"
        />
        <StatCard
          label="連続記録日数"
          value={streakDays}
          valueFormatter={(v) => `${v}日`}
          subLabel={streakDays >= 7 ? 'すごい！この調子で続けよう' : '毎日記録しよう'}
          progress={Math.min(streakDays / 30, 1)}
          progressLabel="目標 30日"
          tone="blue"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.8fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>支出トレンド</CardTitle>
            <Tabs
              options={tabs}
              value={range}
              onValueChange={(value) => setRange(value as RangeKey)}
              ariaLabel="支出トレンド期間"
            />
          </CardHeader>
          <CardContent id={`tab-panel-${range}`} role="tabpanel">
            <TrendChart data={trendData} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>最近の取引</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {transactionsLoading ? <p className="text-sm text-text2">取引履歴を読み込み中...</p> : null}
            {!transactionsLoading && recentTransactions.length === 0 ? (
              <p className="text-sm text-text2">最近の取引はありません。</p>
            ) : null}
            {recentTransactions.map((transaction) => (
              <div key={transaction.id} className="flex items-center justify-between border-b border-white/10 pb-2 text-sm last:border-none">
                <div>
                  <p className="font-medium text-text">{transaction.description || '（メモなし）'}</p>
                  <p className="text-xs text-text2">{transaction.transacted_at}</p>
                </div>
                <p className={transaction.type === 'expense' ? 'text-red-300' : 'text-green-300'}>
                  {transaction.type === 'expense' ? '-' : '+'}
                  {formatCurrency(transaction.amount)}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>💡 今月のAIアドバイス</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {adviceLoading ? <p className="text-sm text-text2">アドバイスを読み込み中...</p> : null}
            {!adviceLoading && !advice ? <p className="text-sm text-text2">アドバイスはまだありません。</p> : null}
            {advice?.content.urgent.slice(0, 2).map((item) => (
              <article key={item.title} className="rounded-lg border border-accent/20 bg-accent/10 p-3">
                <h3 className="text-sm font-semibold text-accent">{item.title}</h3>
                <p className="mt-1 text-xs text-text2">{item.body}</p>
              </article>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>🎯 ライフプランの進捗</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {goals.length === 0 ? <p className="text-sm text-text2">目標がまだ登録されていません。</p> : null}
            {goals.map((goal) => (
              <div key={goal.id} className="rounded-lg border border-white/10 bg-card2 p-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold">
                    {goal.icon} {goal.title}
                  </p>
                  <p className="text-xs text-text2">{goal.target_year}年</p>
                </div>
                <div className="mt-2 h-2 rounded-full bg-black/30">
                  <div className="h-full rounded-full bg-accent2" style={{ width: `${goal.progress_rate * 100}%` }} />
                </div>
                <p className="mt-1 text-xs text-text2">
                  {formatCurrency(goal.saved_amount)} / {formatCurrency(goal.target_amount)}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
      <AddExpenseModal open={expenseModalOpen} onOpenChange={setExpenseModalOpen} />
    </div>
  )
}

function StatCard({
  label,
  value,
  valueFormatter = formatCurrency,
  subLabel,
  progress,
  progressLabel,
  tone,
}: {
  label: string
  value: number
  valueFormatter?: (value: number) => string
  subLabel: string
  progress: number
  progressLabel: string
  tone: 'warn' | 'blue' | 'green'
}) {
  const toneClass = tone === 'warn' ? 'bg-warn' : tone === 'blue' ? 'bg-accent2' : 'bg-accent'

  return (
    <Card>
      <CardContent>
        <p className="text-xs text-text2">{label}</p>
        <p className="mt-1 font-display text-3xl font-bold">{valueFormatter(value)}</p>
        <p className="mt-1 text-xs text-text2">{subLabel}</p>
        <div className="mt-3">
          <div className="mb-1 flex justify-between text-[11px] text-text2">
            <span>{progressLabel}</span>
            <span>{formatPercent(progress)}</span>
          </div>
          <div className="h-2 rounded-full bg-black/30">
            <div className={`h-full rounded-full ${toneClass}`} style={{ width: `${Math.min(progress, 1) * 100}%` }} />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
