import { listAllActiveConnections } from '../db/repositories/connections'
import { countTodayTransactions } from '../db/repositories/transactions'
import { env } from '../lib/env'
import { buildSummaryMessageText } from './bot-core'
import { pushDiscordDM } from './discord'
import { pushLineText } from './line'

// ─────────────────────────────────────────────
// メッセージテンプレート
// ─────────────────────────────────────────────

const DAILY_REMINDER_TEXT = `📝 今日の支出がまだ記録されていません！

外食・交通費・買い物など、今日使ったお金を記録しましょう✏️
「ランチ 850円」のように送るだけで登録できます。

毎日の記録が家計改善への第一歩です💪`

function buildWeeklySummaryText(summary: string): string {
  const header = '🗓 今週のサマリーをお届けします！'
  // bot-core のサマリーにはハードコードされた URL が含まれるので、実際のURLに置換
  const actualUrl = `${env.FRONTEND_URL}/dashboard`
  const body = summary.replace('https://lifebalance.app/dashboard', actualUrl)
  return `${header}\n\n${body}\n\nダッシュボードで詳細を確認しましょう👆`
}

// ─────────────────────────────────────────────
// 今日の JST 日付 (YYYY-MM-DD)
// スケジューラーが 21:00 JST (=12:00 UTC) に実行されるため
// UTC日付 = JST日付 が保証される
// ─────────────────────────────────────────────

function getTodayUTCDate(): string {
  return new Date().toISOString().slice(0, 10)
}

// ─────────────────────────────────────────────
// デイリーリマインダー（21:00 JST）
// 当日に支出の記録がない連携ユーザー全員に送信
// ─────────────────────────────────────────────

export async function sendDailyReminder(): Promise<void> {
  const today = getTodayUTCDate()

  const [lineConnections, discordConnections] = await Promise.all([
    listAllActiveConnections('line'),
    listAllActiveConnections('discord'),
  ])

  const lineResults = await Promise.allSettled(
    lineConnections.map(async (conn) => {
      const todayCount = await countTodayTransactions(conn.userId, today)
      if (todayCount > 0) return
      await pushLineText(conn.platformUserId, DAILY_REMINDER_TEXT)
    }),
  )

  const discordResults = await Promise.allSettled(
    discordConnections.map(async (conn) => {
      const todayCount = await countTodayTransactions(conn.userId, today)
      if (todayCount > 0) return
      await pushDiscordDM(conn.platformUserId, DAILY_REMINDER_TEXT)
    }),
  )

  const lineSent = lineResults.filter((r) => r.status === 'fulfilled').length
  const discordSent = discordResults.filter((r) => r.status === 'fulfilled').length
  console.log(
    `[notifications] デイリーリマインダー: LINE ${lineSent}/${lineConnections.length}, Discord ${discordSent}/${discordConnections.length}`,
  )
}

// ─────────────────────────────────────────────
// 週次サマリー（日曜 20:00 JST）
// 連携ユーザー全員に今月のサマリーとダッシュボードリンクを送信
// ─────────────────────────────────────────────

export async function sendWeeklySummary(): Promise<void> {
  const [lineConnections, discordConnections] = await Promise.all([
    listAllActiveConnections('line'),
    listAllActiveConnections('discord'),
  ])

  const lineResults = await Promise.allSettled(
    lineConnections.map(async (conn) => {
      const summary = await buildSummaryMessageText(conn.userId)
      await pushLineText(conn.platformUserId, buildWeeklySummaryText(summary))
    }),
  )

  const discordResults = await Promise.allSettled(
    discordConnections.map(async (conn) => {
      const summary = await buildSummaryMessageText(conn.userId)
      await pushDiscordDM(conn.platformUserId, buildWeeklySummaryText(summary))
    }),
  )

  const lineSent = lineResults.filter((r) => r.status === 'fulfilled').length
  const discordSent = discordResults.filter((r) => r.status === 'fulfilled').length
  console.log(
    `[notifications] 週次サマリー: LINE ${lineSent}/${lineConnections.length}, Discord ${discordSent}/${discordConnections.length}`,
  )
}
