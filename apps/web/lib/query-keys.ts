export const queryKeys = {
  transactions: (paramsKey: string) => ['transactions', paramsKey] as const,
  transactionSummary: (yearMonth: string) => ['transactions', 'summary', yearMonth] as const,
  budgets: (yearMonth: string) => ['budgets', yearMonth] as const,
  goals: (status: 'all' | 'active' | 'paused' | 'completed') => ['goals', status] as const,
  assumptions: () => ['assumptions'] as const,
  transactionStreak: () => ['transactions', 'streak'] as const,
}
