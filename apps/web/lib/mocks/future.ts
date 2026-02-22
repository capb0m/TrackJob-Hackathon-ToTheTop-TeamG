import type { Assumption, SimulationResult } from '@lifebalance/shared/types'

export const futureAssumption: Assumption = {
  id: 'asm-1',
  age: 30,
  annual_income_growth: 3,
  investment_return: 5,
  inflation_rate: 2,
  monthly_investment: 15000,
  simulation_trials: 1000,
  updated_at: '2025-06-29T12:00:00Z',
}

export const simulationResult: SimulationResult = {
  calculated_at: '2025-06-29T12:00:00Z',
  assumptions_snapshot: {
    age: 30,
    annual_income_growth: 3,
    investment_return: 5,
    inflation_rate: 2,
    monthly_investment: 15000,
    simulation_trials: 1000,
  },
  yearly_projections: [
    { year: 2025, age: 30, p5: 3200000, p25: 3500000, p50: 3840000, p75: 4100000, p95: 4500000 },
    { year: 2026, age: 31, p5: 3900000, p25: 4400000, p50: 5000000, p75: 5600000, p95: 6400000 },
    { year: 2027, age: 32, p5: 4600000, p25: 5400000, p50: 6200000, p75: 7100000, p95: 8400000 },
    { year: 2028, age: 33, p5: 5500000, p25: 6800000, p50: 7800000, p75: 9000000, p95: 11000000 },
    { year: 2029, age: 34, p5: 6400000, p25: 8000000, p50: 9200000, p75: 10800000, p95: 13200000 },
    { year: 2030, age: 35, p5: 7500000, p25: 9300000, p50: 10800000, p75: 12600000, p95: 15500000 },
  ],
  goal_probabilities: [
    {
      goal_id: 'goal-1',
      title: 'マイホーム購入',
      target_amount: 5000000,
      target_year: 2028,
      probability: 0.76,
      expected_achievement_year: 2027,
    },
    {
      goal_id: 'goal-2',
      title: '第一子誕生準備',
      target_amount: 1000000,
      target_year: 2026,
      probability: 0.52,
      expected_achievement_year: null,
    },
    {
      goal_id: 'goal-3',
      title: 'FIRE達成',
      target_amount: 50000000,
      target_year: 2045,
      probability: 0.28,
      expected_achievement_year: null,
    },
  ],
}

export const scenarioComparison = [
  { name: '現状維持', probability: 0.52, monthlyInvestment: 15000 },
  { name: '食費削減', probability: 0.61, monthlyInvestment: 20000 },
  { name: '副収入', probability: 0.73, monthlyInvestment: 30000 },
  { name: '悲観', probability: 0.34, monthlyInvestment: 10000 },
]
