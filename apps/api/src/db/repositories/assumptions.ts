import { eq } from 'drizzle-orm'

import { db } from '../client'
import { assumptions } from '../schema'

export const DEFAULT_ASSUMPTIONS = {
  age: 30,
  annualIncomeGrowth: 3.0,
  investmentReturn: 5.0,
  inflationRate: 2.0,
  monthlyInvestment: 0,
  simulationTrials: 1000,
} as const

export async function getAssumptionsByUserId(userId: string) {
  const rows = await db.select().from(assumptions).where(eq(assumptions.userId, userId)).limit(1)
  return rows[0] ?? null
}

export function createDefaultAssumptions(userId: string) {
  return db
    .insert(assumptions)
    .values({
      userId,
      ...DEFAULT_ASSUMPTIONS,
    })
    .returning()
}

export function updateAssumptions(
  userId: string,
  data: {
    age: number
    annualIncomeGrowth: number
    investmentReturn: number
    inflationRate: number
    monthlyInvestment: number
    simulationTrials: number
  },
) {
  return db
    .update(assumptions)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(eq(assumptions.userId, userId))
    .returning()
}
