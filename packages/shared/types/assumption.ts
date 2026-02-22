export interface Assumption {
  id: string
  age: number
  annual_income_growth: number
  investment_return: number
  inflation_rate: number
  monthly_investment: number
  simulation_trials: 100 | 500 | 1000
  updated_at: string
}
