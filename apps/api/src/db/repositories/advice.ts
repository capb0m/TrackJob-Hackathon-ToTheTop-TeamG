import { and, asc, eq, gte } from 'drizzle-orm'

import { db } from '../client'
import { adviceLogs } from '../schema'

export async function getAdviceByMonth(userId: string, month: string) {
  const rows = await db
    .select()
    .from(adviceLogs)
    .where(and(eq(adviceLogs.userId, userId), eq(adviceLogs.month, month)))
    .limit(1)

  return rows[0] ?? null
}

export function listAdviceHistory(userId: string, months: number) {
  const since = new Date()
  since.setUTCMonth(since.getUTCMonth() - (months - 1))
  const sinceYearMonth = since.toISOString().slice(0, 7)

  return db
    .select({ month: adviceLogs.month, score: adviceLogs.score })
    .from(adviceLogs)
    .where(and(eq(adviceLogs.userId, userId), gte(adviceLogs.month, sinceYearMonth)))
    .orderBy(asc(adviceLogs.month))
    .limit(months)
}

export function upsertAdviceLog(
  userId: string,
  payload: {
    month: string
    score: number
    content: {
      urgent: Array<{ title: string; body: string }>
      suggestions: Array<{ title: string; body: string }>
      positives: Array<{ title: string; body: string }>
      next_month_goals: string[]
    }
  },
) {
  return db
    .insert(adviceLogs)
    .values({
      userId,
      month: payload.month,
      score: payload.score,
      content: payload.content,
      generatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: [adviceLogs.userId, adviceLogs.month],
      set: {
        score: payload.score,
        content: payload.content,
        generatedAt: new Date(),
      },
    })
    .returning()
}
