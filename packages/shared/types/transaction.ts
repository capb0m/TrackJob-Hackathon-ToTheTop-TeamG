export const EXPENSE_CATEGORIES = [
  'housing',
  'food',
  'transport',
  'entertainment',
  'clothing',
  'communication',
  'medical',
  'social',
  'other',
] as const

export const INCOME_CATEGORIES = ['salary', 'bonus', 'side_income', 'other'] as const

export const TRANSACTION_TYPES = ['expense', 'income'] as const
export const TRANSACTION_SOURCES = ['dashboard', 'line', 'discord'] as const

export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number]
export type IncomeCategory = (typeof INCOME_CATEGORIES)[number]
export type TransactionType = (typeof TRANSACTION_TYPES)[number]
export type TransactionSource = (typeof TRANSACTION_SOURCES)[number]

export type TransactionCategory = ExpenseCategory | IncomeCategory

export interface Transaction {
  id: string
  amount: number
  type: TransactionType
  category: TransactionCategory
  description: string
  receipt_url?: string | null
  source: TransactionSource
  transacted_at: string
  created_at: string
  updated_at?: string
}

export interface TransactionSummary {
  year_month: string
  total_expense: number
  total_income: number
  net_saving: number
  by_category: Array<{
    category: ExpenseCategory
    amount: number
    transaction_count: number
  }>
}
