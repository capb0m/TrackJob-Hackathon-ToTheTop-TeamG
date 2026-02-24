import {
  copyBudgetsFromMonth,
  getBudgetById,
  listBudgetsByMonth,
  updateBudgetById,
  upsertBudgets,
} from '../db/repositories/budgets'
import { getCurrentYearMonth } from '../lib/date'
import { AppError } from '../lib/errors'
import { getBudgetSpentSummary } from './transactions'
import { toIsoString } from './serializers'

function assertOwner(resourceUserId: string, userId: string) {
  if (resourceUserId !== userId) {
    throw new AppError('FORBIDDEN', 'Access to this resource is forbidden')
  }
}

export async function getUserBudgets(userId: string, yearMonth?: string) {
  const targetYearMonth = yearMonth ?? getCurrentYearMonth()

  const [rows, spentSummary] = await Promise.all([
    listBudgetsByMonth(userId, targetYearMonth),
    getBudgetSpentSummary(userId, targetYearMonth),
  ])

  const budgets = rows.map((row) => {
    const spentAmount = spentSummary.spentByCategory.get(row.category) ?? 0

    return {
      id: row.id,
      category: row.category,
      limit_amount: row.limitAmount,
      spent_amount: spentAmount,
      usage_rate: row.limitAmount === 0 ? 0 : Number((spentAmount / row.limitAmount).toFixed(4)),
      is_fixed: row.isFixed,
    }
  })

  return {
    year_month: targetYearMonth,
    budgets,
    total_budget: rows.reduce((sum, row) => sum + row.limitAmount, 0),
    total_spent: spentSummary.totalSpent,
  }
}

export async function putUserBudgets(
  userId: string,
  body: {
    year_month: string
    budgets: Array<{ category: string; limit_amount: number; is_fixed: boolean }>
  },
) {
  const updated = await upsertBudgets(
    userId,
    body.year_month,
    body.budgets.map((budget) => ({
      category: budget.category,
      limitAmount: budget.limit_amount,
      isFixed: budget.is_fixed,
    })),
  )

  return {
    year_month: body.year_month,
    updated_count: updated.length,
  }
}

export async function patchUserBudget(
  userId: string,
  budgetId: string,
  body: Partial<{ limit_amount: number; is_fixed: boolean }>,
) {
  const existing = await getBudgetById(budgetId)

  if (!existing) {
    throw new AppError('NOT_FOUND', 'Budget not found')
  }

  assertOwner(existing.userId, userId)

  const [updated] = await updateBudgetById(budgetId, {
    limitAmount: body.limit_amount,
    isFixed: body.is_fixed,
  })

  if (!updated) {
    throw new AppError('INTERNAL_ERROR', 'Failed to update budget')
  }

  return {
    id: updated.id,
    category: updated.category,
    limit_amount: updated.limitAmount,
    is_fixed: updated.isFixed,
    updated_at: toIsoString(updated.updatedAt),
  }
}

export async function getBudgetAchievementStreak(userId: string): Promise<{ streak_months: number }> {
  let streak = 0
  const now = new Date()

  // i=0 は当月（未完了）なのでスキップし、i=1（前月）から過去に遡る
  for (let i = 1; i <= 24; i++) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const yearMonth = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
    const data = await getUserBudgets(userId, yearMonth)

    if (data.total_budget === 0) {
      if (streak > 0) break
      continue
    }

    if (data.total_spent <= data.total_budget) {
      streak++
    } else {
      break
    }
  }

  return { streak_months: streak }
}

export async function copyUserBudgets(
  userId: string,
  body: { from_year_month: string; to_year_month: string },
) {
  const copied = await copyBudgetsFromMonth(userId, body.from_year_month, body.to_year_month)

  return {
    copied_count: copied.length,
    to_year_month: body.to_year_month,
  }
}
