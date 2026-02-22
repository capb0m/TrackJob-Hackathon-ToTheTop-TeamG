export interface AdviceItem {
  title: string
  body: string
}

export interface AdviceContent {
  urgent: AdviceItem[]
  suggestions: AdviceItem[]
  positives: AdviceItem[]
  next_month_goals: string[]
}

export interface AdviceLog {
  id: string
  month: string
  score: number
  content: AdviceContent
  generated_at: string
}

export interface AdviceHistoryItem {
  month: string
  score: number
}
