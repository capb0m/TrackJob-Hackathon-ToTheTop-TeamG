import { and, eq, sql } from 'drizzle-orm'

import { db } from '../client'
import { budgets } from '../schema'

export function listBudgetsByMonth(userId: string, yearMonth: string) {
  return db.select().from(budgets).where(and(eq(budgets.userId, userId), eq(budgets.yearMonth, yearMonth)))
}

export async function upsertBudgets(
  userId: string,
  yearMonth: string,
  items: Array<{ category: string; limitAmount: number; isFixed: boolean }>,
) {
  if (items.length === 0) {
    return []
  }

  return db
    .insert(budgets)
    .values(
      items.map((item) => ({
        userId,
        yearMonth,
        category: item.category,
        limitAmount: item.limitAmount,
        isFixed: item.isFixed,
      })),
    )
    .onConflictDoUpdate({
      target: [budgets.userId, budgets.yearMonth, budgets.category],
      set: {
        limitAmount: sql`excluded.limit_amount`,
        isFixed: sql`excluded.is_fixed`,
        updatedAt: new Date(),
      },
    })
    .returning()
}

export async function getBudgetById(id: string) {
  const rows = await db.select().from(budgets).where(eq(budgets.id, id)).limit(1)
  return rows[0] ?? null
}

export function updateBudgetById(
  id: string,
  data: Partial<{
    limitAmount: number
    isFixed: boolean
  }>,
) {
  return db
    .update(budgets)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(eq(budgets.id, id))
    .returning()
}

export async function copyBudgetsFromMonth(userId: string, fromYearMonth: string, toYearMonth: string) {
  const source = await listBudgetsByMonth(userId, fromYearMonth)

  if (source.length === 0) {
    return []
  }

  return upsertBudgets(
    userId,
    toYearMonth,
    source.map((item) => ({
      category: item.category,
      limitAmount: item.limitAmount,
      isFixed: item.isFixed,
    })),
  )
}
