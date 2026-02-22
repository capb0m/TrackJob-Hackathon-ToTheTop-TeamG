import {
  createDefaultAssumptions,
  DEFAULT_ASSUMPTIONS,
  getAssumptionsByUserId,
  updateAssumptions,
} from '../db/repositories/assumptions'
import { AppError } from '../lib/errors'
import { toIsoString } from './serializers'

function mapAssumptions(row: {
  id: string
  age: number
  annualIncomeGrowth: number
  investmentReturn: number
  inflationRate: number
  monthlyInvestment: number
  simulationTrials: number
  updatedAt: Date
}) {
  return {
    id: row.id,
    age: row.age,
    annual_income_growth: row.annualIncomeGrowth,
    investment_return: row.investmentReturn,
    inflation_rate: row.inflationRate,
    monthly_investment: row.monthlyInvestment,
    simulation_trials: row.simulationTrials,
    updated_at: toIsoString(row.updatedAt),
  }
}

export async function getOrCreateAssumptions(userId: string) {
  const existing = await getAssumptionsByUserId(userId)

  if (existing) {
    return mapAssumptions(existing)
  }

  const [created] = await createDefaultAssumptions(userId)

  if (!created) {
    throw new AppError('INTERNAL_ERROR', 'Failed to create assumptions')
  }

  return mapAssumptions(created)
}

export async function putUserAssumptions(
  userId: string,
  body: {
    age: number
    annual_income_growth: number
    investment_return: number
    inflation_rate: number
    monthly_investment: number
    simulation_trials?: 100 | 500 | 1000
  },
) {
  const existing = await getAssumptionsByUserId(userId)
  const simulationTrials = body.simulation_trials ?? DEFAULT_ASSUMPTIONS.simulationTrials

  if (!existing) {
    const [created] = await createDefaultAssumptions(userId)

    if (!created) {
      throw new AppError('INTERNAL_ERROR', 'Failed to create assumptions')
    }
  }

  const [updated] = await updateAssumptions(userId, {
    age: body.age,
    annualIncomeGrowth: body.annual_income_growth,
    investmentReturn: body.investment_return,
    inflationRate: body.inflation_rate,
    monthlyInvestment: body.monthly_investment,
    simulationTrials,
  })

  if (!updated) {
    throw new AppError('INTERNAL_ERROR', 'Failed to update assumptions')
  }

  return mapAssumptions(updated)
}
