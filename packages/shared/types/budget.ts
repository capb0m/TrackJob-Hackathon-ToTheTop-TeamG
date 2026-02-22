import type { ExpenseCategory } from './transaction'

export interface Budget {
  id: string
  category: ExpenseCategory
  limit_amount: number
  is_fixed: boolean
  created_at?: string
  updated_at?: string
}

export interface BudgetWithUsage extends Budget {
  spent_amount: number
  usage_rate: number
}

export interface BudgetSummary {
  year_month: string
  budgets: BudgetWithUsage[]
  total_budget: number
  total_spent: number
}

export type BudgetItem = BudgetWithUsage
