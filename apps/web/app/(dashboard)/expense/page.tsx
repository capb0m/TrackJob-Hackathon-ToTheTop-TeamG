'use client'

import { useMemo, useState } from 'react'

import type { ExpenseCategory, TransactionCategory } from '@lifebalance/shared/types'

import { ExpensePieChart } from '@/components/charts/ExpensePieChart'
import { AddExpenseModal } from '@/components/modals/AddExpenseModal'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { useBudgets } from '@/hooks/useBudgets'
import { useTransactions, useTransactionSummary } from '@/hooks/useTransactions'
import { formatCurrency, getCurrentYearMonth } from '@/lib/utils'

const CATEGORY_LABELS: Record<TransactionCategory, string> = {
  housing: '住居費',
  food: '食費',
  transport: '交通費',
  entertainment: '娯楽',
  clothing: '衣類',
  communication: '通信',
  medical: '医療',
  social: '交際費',
  other: 'その他',
  salary: '給与',
  bonus: '賞与',
  side_income: '副収入',
}

const PIE_COLORS = ['#2fbf8f', '#66d9b8', '#9bead3', '#5aa4ff', '#8ac4ff', '#ffd27a', '#ffbb4a', '#e96b7f', '#f5a4b4']

function getRecentMonths(count: number) {
  const months: string[] = []
  const now = new Date()

  for (let i = 0; i < count; i += 1) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
    months.push(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`)
  }

  return months
}

export default function ExpensePage() {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState<'all' | ExpenseCategory>('all')
  const [month, setMonth] = useState(getCurrentYearMonth())

  const { transactions, pagination, isLoading: transactionsLoading, error: transactionsError } = useTransactions({
    year_month: month,
    category: category === 'all' ? undefined : category,
    keyword: query.trim() || undefined,
    page: 1,
    limit: 50,
    order: 'desc',
    sort: 'transacted_at',
  })

  const { budgetSummary, budgets, isLoading: budgetsLoading } = useBudgets(month)
  const { data: summary, isLoading: summaryLoading } = useTransactionSummary(month)

  const pieData = useMemo(
    () =>
      (summary?.by_category ?? []).map((item, index) => ({
        name: CATEGORY_LABELS[item.category],
        value: item.amount,
        color: PIE_COLORS[index % PIE_COLORS.length],
      })),
    [summary],
  )

  const monthOptions = useMemo(() => getRecentMonths(6), [])

  return (
    <div className="space-y-5">
      <div className="flex flex-col items-start justify-between gap-3 md:flex-row md:items-center">
        <div>
          <h1 className="font-display text-2xl font-bold">支出管理</h1>
          <p className="text-sm text-text2">カテゴリ別の支出を確認・登録できます</p>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" disabled>
            📥 CSVエクスポート
          </Button>
          <Button onClick={() => setOpen(true)}>＋ 支出を追加</Button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.8fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>カテゴリ別支出（{month}）</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {budgetsLoading ? <p className="text-sm text-text2">予算データを読み込み中...</p> : null}
            {budgets.map((budget) => (
              <div key={budget.id} className="grid grid-cols-[1fr_2fr_auto_auto] items-center gap-3 border-b border-border py-2 text-sm last:border-none">
                <p>{CATEGORY_LABELS[budget.category]}</p>
                <div className="h-2 rounded-full bg-[rgba(47,74,122,0.12)]">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${Math.min(budget.usage_rate, 1) * 100}%`,
                      background:
                        budget.usage_rate >= 1 ? 'var(--danger)' : budget.usage_rate >= 0.8 ? '#e9a33f' : 'var(--accent)',
                    }}
                  />
                </div>
                <p className="text-xs text-text2">
                  {formatCurrency(budget.spent_amount)} / {formatCurrency(budget.limit_amount)}
                </p>
                <p className="w-12 text-right text-xs text-text2">{Math.round(budget.usage_rate * 100)}%</p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>支出構成</CardTitle>
          </CardHeader>
          <CardContent>
            {summaryLoading ? <p className="text-sm text-text2">集計を読み込み中...</p> : null}
            {!summaryLoading && pieData.length > 0 ? <ExpensePieChart data={pieData} /> : null}
            {!summaryLoading && pieData.length === 0 ? <p className="text-sm text-text2">データがありません。</p> : null}
            {pieData.length > 0 ? (
              <div className="mt-3 space-y-1.5">
                {pieData.map((item) => {
                  const total = pieData.reduce((sum, d) => sum + d.value, 0)
                  const pct = total > 0 ? Math.round((item.value / total) * 100) : 0
                  return (
                    <div key={item.name} className="flex items-center gap-2 text-xs">
                      <span className="h-2.5 w-2.5 flex-shrink-0 rounded-full" style={{ background: item.color }} />
                      <span className="flex-1 text-text">{item.name}</span>
                      <span className="text-text2">{formatCurrency(item.value)}</span>
                      <span className="w-9 text-right font-medium text-text">{pct}%</span>
                    </div>
                  )
                })}
              </div>
            ) : null}
            <p className="mt-3 text-xs text-text2">
              合計支出: {formatCurrency(summary?.total_expense ?? 0)} / 予算: {formatCurrency(budgetSummary?.total_budget ?? 0)}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>取引履歴</CardTitle>
          <div className="flex flex-wrap gap-2">
            <Select value={month} onChange={(event) => setMonth(event.target.value)} className="w-36" aria-label="対象月">
              {monthOptions.map((monthOption) => (
                <option key={monthOption} value={monthOption}>
                  {monthOption}
                </option>
              ))}
            </Select>
            <Input
              placeholder="検索..."
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              className="w-56"
              aria-label="検索"
            />
            <Select value={category} onChange={(event) => setCategory(event.target.value as 'all' | ExpenseCategory)} className="w-40" aria-label="カテゴリ">
              <option value="all">すべて</option>
              <option value="housing">住居費</option>
              <option value="food">食費</option>
              <option value="transport">交通費</option>
              <option value="entertainment">娯楽</option>
              <option value="clothing">衣類</option>
              <option value="communication">通信</option>
              <option value="medical">医療</option>
              <option value="social">交際費</option>
              <option value="other">その他</option>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          <p className="text-xs text-text2">
            表示中の月: {month}
            {pagination ? ` / ${pagination.total}件` : ''}
          </p>
          {transactionsLoading ? <p className="text-sm text-text2">取引履歴を読み込み中...</p> : null}
          {transactionsError ? <p className="text-sm text-danger">取引履歴の取得に失敗しました。</p> : null}

          {!transactionsLoading && transactions.length === 0 ? (
            <p className="text-sm text-text2">条件に一致する取引がありません。</p>
          ) : null}

          {transactions.map((transaction) => (
            <div key={transaction.id} className="grid grid-cols-[1fr_auto_auto] items-center gap-3 border-b border-border py-2 last:border-none">
              <div>
                <p className="text-sm font-medium">{transaction.description || '（メモなし）'}</p>
                <p className="text-xs text-text2">{transaction.transacted_at}</p>
              </div>
              <Badge variant={transaction.type === 'expense' ? 'warning' : 'success'}>{CATEGORY_LABELS[transaction.category]}</Badge>
              <p className={transaction.type === 'expense' ? 'text-sm text-danger' : 'text-sm text-success'}>
                {transaction.type === 'expense' ? '-' : '+'}
                {formatCurrency(transaction.amount)}
              </p>
            </div>
          ))}
        </CardContent>
      </Card>

      <AddExpenseModal open={open} onOpenChange={setOpen} />
    </div>
  )
}
