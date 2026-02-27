import type { AdviceContent, BudgetSummary, LifeGoal, UserProfile } from '@lifebalance/shared/types'

// v1: Initial system prompt from AGENT.md section 10 (advice generation).
export const ADVICE_SYSTEM_PROMPT = `
あなたは日本人向けの家計管理・資産形成の専門AIアドバイザーです。
ユーザーのライフプランと収支データを分析し、具体的で実行可能なアドバイスを提供します。

## アドバイスの原則
- 上から目線にならず、寄り添うトーンで記述する
- 金額は具体的に記載する（「節約できます」ではなく「月¥3,000節約できます」）
- 批判ではなく改善策を提示する
- 良い点は必ず認め、モチベーションを維持させる

## 出力形式
以下のJSON形式のみで返してください。説明テキストは不要です。

{
  "score": 0〜100の整数（家計健全度スコア）,
  "urgent": [
    { "title": "簡潔なタイトル（20文字以内）", "body": "具体的な内容（100文字以内）" }
  ],
  "suggestions": [
    { "title": "...", "body": "..." }
  ],
  "positives": [
    { "title": "...", "body": "..." }
  ],
  "next_month_goals": [
    "具体的な行動目標（30文字以内）"
  ]
}

## 各セクションの件数
- urgent: 0〜2件（本当に緊急のもののみ）
- suggestions: 2〜3件
- positives: 1〜2件
- next_month_goals: 2〜3件
`.trim()

export const ADVICE_DETAIL_SYSTEM_PROMPT = `
あなたは日本人向けの家計管理コーチです。
提示された「改善提案」を、今すぐ実行できる具体的な行動に分解してください。

## 回答ルール
- 出力は必ずJSONのみ
- 具体的な行動を2〜4件で提示する
- 1項目は40〜80文字程度
- 抽象表現ではなく、行動・頻度・目安金額を可能な限り入れる

## 出力形式
{
  "proposal_items": [
    "具体的な行動1",
    "具体的な行動2"
  ]
}
`.trim()

function formatCurrency(value: number) {
  return `¥${value.toLocaleString('ja-JP')}`
}

function buildBudgetTable(summary: BudgetSummary) {
  if (summary.budgets.length === 0) {
    return '| (未設定) | - | - | - |'
  }

  return summary.budgets
    .map((item) => {
      const usage = `${Math.round(item.usage_rate * 100)}%`
      return `| ${item.category} | ${formatCurrency(item.limit_amount)} | ${formatCurrency(item.spent_amount)} | ${usage} |`
    })
    .join('\n')
}

function buildMonthlyExpenseSummary(rows: Array<{ year_month: string; total_expense: number }>) {
  if (rows.length === 0) {
    return '- データなし'
  }

  return rows.map((row) => `- ${row.year_month}: ${formatCurrency(row.total_expense)}`).join('\n')
}

function buildGoalsSummary(goals: LifeGoal[]) {
  if (goals.length === 0) {
    return '- 目標なし'
  }

  return goals
    .map(
      (goal) =>
        `- ${goal.title}: ${formatCurrency(goal.saved_amount)} / ${formatCurrency(goal.target_amount)} (${goal.target_year}年目標)`,
    )
    .join('\n')
}

function buildPreviousAdviceSummary(previousAdvice: AdviceContent | null) {
  if (!previousAdvice) {
    return '- 先月のアドバイスなし'
  }

  return previousAdvice.next_month_goals.map((goal) => `- ${goal}`).join('\n')
}

/**
 * Builds deterministic user context to reduce hallucination and keep JSON format stable.
 */
export function buildAdviceUserContext(params: {
  month: string
  profile: UserProfile
  budgetSummary: BudgetSummary
  monthlyExpenseTotals: Array<{ year_month: string; total_expense: number }>
  goals: LifeGoal[]
  previousAdvice: AdviceContent | null
  age: number
}) {
  return `
## ユーザー情報
- 年齢: ${params.age}歳
- 月収（税引後）: ${formatCurrency(params.profile.monthly_income)}

## 今月の予算と支出（${params.month}）
| カテゴリ | 予算 | 支出 | 消化率 |
|---------|------|------|--------|
${buildBudgetTable(params.budgetSummary)}

## 直近3ヶ月の月別支出合計
${buildMonthlyExpenseSummary(params.monthlyExpenseTotals)}

## ライフプラン目標
${buildGoalsSummary(params.goals)}

## 前月のアドバイスに対する結果
${buildPreviousAdviceSummary(params.previousAdvice)}
`.trim()
}

export function buildAdviceDetailUserPrompt(params: {
  section: 'improvement' | 'positive'
  title: string
  summary: string
  urgent?: boolean
}) {
  return `
## 対象セクション
- ${params.section === 'improvement' ? '改善提案' : '継続中の良い点'}

## 提案タイトル
- ${params.title}

## 提案サマリー
- ${params.summary}

## 緊急フラグ
- ${params.urgent ? '緊急' : '通常'}

上記をもとに、実行しやすい具体アクションを返してください。
`.trim()
}
