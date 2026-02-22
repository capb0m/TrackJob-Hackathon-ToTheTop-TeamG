import {
  createDefaultAssumptions,
  DEFAULT_ASSUMPTIONS,
  getAssumptionsByUserId,
} from '../db/repositories/assumptions'
import { listGoals, listGoalsByNewestUpdate } from '../db/repositories/goals'
import { getCurrentYear, isoNow } from '../lib/date'

type AssumptionsSnapshot = {
  age: number
  annual_income_growth: number
  investment_return: number
  inflation_rate: number
  monthly_investment: number
  simulation_trials: number
}

type YearlyProjection = {
  year: number
  age: number
  p5: number
  p25: number
  p50: number
  p75: number
  p95: number
}

type GoalProbability = {
  goal_id: string
  title: string
  target_amount: number
  target_year: number
  probability: number
  expected_achievement_year: number | null
}

type SimulationResponse = {
  calculated_at: string
  assumptions_snapshot: AssumptionsSnapshot
  yearly_projections: YearlyProjection[]
  goal_probabilities: GoalProbability[]
}

type CacheEntry = {
  cacheKey: string
  result: SimulationResponse
}

const simulationCache = new Map<string, CacheEntry>()

function randomNormal(mean: number, stdDev: number) {
  let u = 0
  let v = 0

  while (u === 0) u = Math.random()
  while (v === 0) v = Math.random()

  const z = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v)
  return mean + z * stdDev
}

function percentile(sortedValues: number[], p: number) {
  if (sortedValues.length === 0) {
    return 0
  }

  const index = (sortedValues.length - 1) * p
  const lower = Math.floor(index)
  const upper = Math.ceil(index)

  if (lower === upper) {
    return sortedValues[lower] ?? 0
  }

  const weight = index - lower
  const lowerValue = sortedValues[lower] ?? 0
  const upperValue = sortedValues[upper] ?? 0

  return lowerValue * (1 - weight) + upperValue * weight
}

function toInt(value: number) {
  return Math.round(value)
}

async function buildCacheKey(userId: string) {
  const [currentAssumptions, goalsByUpdate] = await Promise.all([
    getAssumptionsByUserId(userId),
    listGoalsByNewestUpdate(userId),
  ])
  const latestGoal = goalsByUpdate[0]

  const assumptionsUpdatedAt = currentAssumptions?.updatedAt.toISOString() ?? 'none'
  const goalsUpdatedAt = latestGoal?.updatedAt.toISOString() ?? 'none'

  return `${assumptionsUpdatedAt}:${goalsUpdatedAt}`
}

async function loadSimulationInputs(userId: string) {
  let currentAssumptions = await getAssumptionsByUserId(userId)
  const goals = await listGoals(userId)

  if (!currentAssumptions) {
    const [created] = await createDefaultAssumptions(userId)
    currentAssumptions = created ?? null
  }

  if (!currentAssumptions) {
    currentAssumptions = {
      id: '',
      userId,
      age: DEFAULT_ASSUMPTIONS.age,
      annualIncomeGrowth: DEFAULT_ASSUMPTIONS.annualIncomeGrowth,
      investmentReturn: DEFAULT_ASSUMPTIONS.investmentReturn,
      inflationRate: DEFAULT_ASSUMPTIONS.inflationRate,
      monthlyInvestment: DEFAULT_ASSUMPTIONS.monthlyInvestment,
      simulationTrials: DEFAULT_ASSUMPTIONS.simulationTrials,
      createdAt: new Date(),
      updatedAt: new Date(),
    }
  }

  return {
    assumptions: {
      age: currentAssumptions.age,
      annual_income_growth: currentAssumptions.annualIncomeGrowth,
      investment_return: currentAssumptions.investmentReturn,
      inflation_rate: currentAssumptions.inflationRate,
      monthly_investment: currentAssumptions.monthlyInvestment,
      simulation_trials: currentAssumptions.simulationTrials,
    },
    goals,
  }
}

function runMonteCarlo(
  assumptionsSnapshot: AssumptionsSnapshot,
  goals: Array<{
    id: string
    title: string
    targetAmount: number
    targetYear: number
    savedAmount: number
  }>,
): SimulationResponse {
  const currentYear = getCurrentYear()
  const maxGoalYear = goals.length > 0 ? Math.max(...goals.map((goal) => goal.targetYear)) : currentYear
  const endYear = maxGoalYear + 5
  const years = Array.from({ length: endYear - currentYear + 1 }, (_, index) => currentYear + index)
  const initialSavings = goals.reduce((sum, goal) => sum + goal.savedAmount, 0)

  const yearlyTrialBalances = new Map<number, number[]>()
  years.forEach((year) => yearlyTrialBalances.set(year, []))

  for (let trial = 0; trial < assumptionsSnapshot.simulation_trials; trial += 1) {
    let balance = initialSavings

    for (const year of years) {
      const annualIncomeGrowth = randomNormal(assumptionsSnapshot.annual_income_growth / 100, 0.02)
      const investmentReturn = randomNormal(assumptionsSnapshot.investment_return / 100, 0.1)
      const inflationRate = randomNormal(assumptionsSnapshot.inflation_rate / 100, 0.01)

      const annualContribution = assumptionsSnapshot.monthly_investment * 12 * Math.max(0, 1 + annualIncomeGrowth)
      balance = Math.max(0, (balance + annualContribution) * (1 + investmentReturn - inflationRate))

      yearlyTrialBalances.get(year)?.push(balance)
    }
  }

  const yearlyProjections: YearlyProjection[] = years.map((year) => {
    const balances = [...(yearlyTrialBalances.get(year) ?? [])].sort((a, b) => a - b)
    return {
      year,
      age: assumptionsSnapshot.age + (year - currentYear),
      p5: toInt(percentile(balances, 0.05)),
      p25: toInt(percentile(balances, 0.25)),
      p50: toInt(percentile(balances, 0.5)),
      p75: toInt(percentile(balances, 0.75)),
      p95: toInt(percentile(balances, 0.95)),
    }
  })

  const goalProbabilities: GoalProbability[] = goals.map((goal) => {
    const yearBalances = yearlyTrialBalances.get(goal.targetYear) ?? []
    const successCount = yearBalances.filter((value) => value >= goal.targetAmount).length
    const probability =
      assumptionsSnapshot.simulation_trials === 0
        ? 0
        : Number((successCount / assumptionsSnapshot.simulation_trials).toFixed(4))

    const expectedAchievementYear = yearlyProjections.find(
      (projection) => projection.year >= currentYear && projection.p50 >= goal.targetAmount,
    )?.year

    return {
      goal_id: goal.id,
      title: goal.title,
      target_amount: goal.targetAmount,
      target_year: goal.targetYear,
      probability,
      expected_achievement_year: expectedAchievementYear ?? null,
    }
  })

  return {
    calculated_at: isoNow(),
    assumptions_snapshot: assumptionsSnapshot,
    yearly_projections: yearlyProjections,
    goal_probabilities: goalProbabilities,
  }
}

export async function runSimulation(userId: string, force = false) {
  const cacheKey = await buildCacheKey(userId)

  if (!force) {
    const cached = simulationCache.get(userId)
    if (cached && cached.cacheKey === cacheKey) {
      return cached.result
    }
  }

  const { assumptions: assumptionsSnapshot, goals } = await loadSimulationInputs(userId)
  const result = runMonteCarlo(assumptionsSnapshot, goals)

  simulationCache.set(userId, {
    cacheKey,
    result,
  })

  return result
}

export async function runScenarioSimulation(
  userId: string,
  overrides: Partial<{
    age: number
    annual_income_growth: number
    investment_return: number
    inflation_rate: number
    monthly_investment: number
    simulation_trials: 100 | 500 | 1000
  }>,
) {
  const { assumptions: currentAssumptions, goals } = await loadSimulationInputs(userId)

  const assumptionsSnapshot: AssumptionsSnapshot = {
    ...currentAssumptions,
    ...overrides,
    simulation_trials: overrides.simulation_trials ?? currentAssumptions.simulation_trials,
  }

  return runMonteCarlo(assumptionsSnapshot, goals)
}
