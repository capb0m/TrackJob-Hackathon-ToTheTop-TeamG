import type { Assumption } from './assumption'

export interface YearlyProjection {
  year: number
  age: number
  p5: number
  p25: number
  p50: number
  p75: number
  p95: number
}

export interface GoalProbability {
  goal_id: string
  title: string
  target_amount: number
  target_year: number
  probability: number
  expected_achievement_year: number | null
}

export interface SimulationResult {
  calculated_at: string
  assumptions_snapshot: Omit<Assumption, 'id' | 'updated_at'>
  yearly_projections: YearlyProjection[]
  goal_probabilities: GoalProbability[]
}
