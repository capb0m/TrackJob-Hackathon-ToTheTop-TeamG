import { createHmac, timingSafeEqual } from 'node:crypto'
import { z } from 'zod'

import { supabaseAdmin } from '../clients/supabase'
import { listBudgetsByMonth } from '../db/repositories/budgets'
import { findActiveConnectionByPlatformUserId } from '../db/repositories/connections'
import { createTransaction, getTransactionSummary } from '../db/repositories/transactions'
import { getCurrentYearMonth } from '../lib/date'
import { env } from '../lib/env'
import { EXPENSE_CATEGORIES } from '../schemas/constants'
import { extractFirstJsonObject, generateGeminiText } from './gemini'
import { extractReceiptFromImageUrl } from './ocr'
import { LINE_EXPENSE_EXTRACTION_PROMPT, LINE_HELP_MESSAGE } from './prompts/line'

const lineTextExtractionSchema = z.object({
  amount: z.number().int().min(1),
  category: z.enum(EXPENSE_CATEGORIES),
  description: z.string().nullable().optional(),
  transacted_at: z.string().nullable().optional(),
})

const CATEGORY_LABELS: Record<string, string> = {
  housing: '住居費',
  food: '食費',
  transport: '交通費',
  entertainment: '娯楽・趣味',
  clothing: '衣類・日用品',
  communication: '通信費',
  medical: '医療・健康',
  social: '交際費',
  other: 'その他',
}

type LineWebhookPayload = {
  events?: LineMessageEvent[]
}

type LineMessageEvent = {
  type: string
  replyToken?: string
  source?: {
    type?: string
    userId?: string
  }
  message?: {
    type?: string
    id?: string
    text?: string
  }
}

function formatCurrency(value: number) {
  return `¥${value.toLocaleString('ja-JP')}`
}

function normalizeDate(value: string | null | undefined) {
  if (!value) return new Date().toISOString().slice(0, 10)
  return /^\d{4}-(0[1-9]|1[0-2])-([0-2][0-9]|3[0-1])$/.test(value)
    ? value
    : new Date().toISOString().slice(0, 10)
}

function buildUsageBar(percentage: number | null) {
  if (percentage === null) return ''
  const clamped = Math.max(0, Math.min(100, percentage))
  const filled = Math.round((clamped / 100) * 8)
  return `${'█'.repeat(filled)}${'░'.repeat(8 - filled)}`
}

export function verifyLineSignature(rawBody: string, signatureHeader: string | undefined) {
  if (!env.LINE_CHANNEL_SECRET || !signatureHeader) {
    return false
  }

  const digest = createHmac('sha256', env.LINE_CHANNEL_SECRET).update(rawBody).digest('base64')
  const digestBuffer = Buffer.from(digest)
  const headerBuffer = Buffer.from(signatureHeader)

  if (digestBuffer.length !== headerBuffer.length) {
    return false
  }

  return timingSafeEqual(digestBuffer, headerBuffer)
}

async function replyLineText(replyToken: string, text: string) {
  if (!env.LINE_CHANNEL_ACCESS_TOKEN) {
    return
  }

  await fetch('https://api.line.me/v2/bot/message/reply', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${env.LINE_CHANNEL_ACCESS_TOKEN}`,
    },
    body: JSON.stringify({
      replyToken,
      messages: [
        {
          type: 'text',
          text: text.slice(0, 4900),
        },
      ],
    }),
  })
}

async function parseExpenseText(text: string) {
  try {
    const responseText = await generateGeminiText({
      prompt: `${LINE_EXPENSE_EXTRACTION_PROMPT}\n\n入力: ${text}`,
    })

    const jsonText = extractFirstJsonObject(responseText)
    if (!jsonText) {
      return null
    }

    const parsed = lineTextExtractionSchema.safeParse(JSON.parse(jsonText))
    if (!parsed.success) {
      return null
    }

    return {
      amount: parsed.data.amount,
      category: parsed.data.category,
      description: parsed.data.description ?? text.slice(0, 20),
      transacted_at: normalizeDate(parsed.data.transacted_at),
    }
  } catch {
    return null
  }
}

async function formatCategoryMonthlyUsage(userId: string, category: string, yearMonth: string) {
  const [summary, budgets] = await Promise.all([
    getTransactionSummary(userId, yearMonth),
    listBudgetsByMonth(userId, yearMonth),
  ])

  const categorySpending = summary.byCategory.find((item) => item.category === category)?.amount ?? 0
  const limit = budgets.find((item) => item.category === category)?.limitAmount
  const usage = typeof limit === 'number' && limit > 0 ? (categorySpending / limit) * 100 : null
  const label = CATEGORY_LABELS[category] ?? category

  if (usage === null || typeof limit !== 'number') {
    return `今月の${label}: ${formatCurrency(categorySpending)}`
  }

  return `今月の${label}: ${formatCurrency(categorySpending)} / ${formatCurrency(limit)}（${usage.toFixed(1)}%）`
}

async function sendSummaryReply(userId: string, replyToken: string) {
  const yearMonth = getCurrentYearMonth()
  const [summary, budgets] = await Promise.all([
    getTransactionSummary(userId, yearMonth),
    listBudgetsByMonth(userId, yearMonth),
  ])

  const [year, month] = yearMonth.split('-')
  const categoryLines = summary.byCategory.slice(0, 5).map((row) => {
    const limit = budgets.find((item) => item.category === row.category)?.limitAmount
    const percent = typeof limit === 'number' && limit > 0 ? Math.round((row.amount / limit) * 100) : null
    const label = CATEGORY_LABELS[row.category] ?? row.category
    const bar = buildUsageBar(percent)
    const percentText = percent === null ? '-' : `${percent}%`
    return `${label.padEnd(6, ' ')} ${formatCurrency(row.amount)} ${bar} ${percentText}`
  })

  const message = [
    `📊 ${year}年${Number(month)}月のサマリー`,
    '',
    `💰 支出合計: ${formatCurrency(summary.totalExpense)}`,
    `💚 貯蓄:    ${formatCurrency(summary.totalIncome - summary.totalExpense)}`,
    '',
    '【カテゴリ別】',
    categoryLines.length > 0 ? categoryLines.join('\n') : '- データなし',
    '',
    '詳細はこちら👇',
    'https://lifebalance.app/dashboard',
  ].join('\n')

  await replyLineText(replyToken, message)
}

async function createLineExpense(params: {
  userId: string
  amount: number
  category: string
  description: string | null
  transactedAt: string
}) {
  await createTransaction(params.userId, {
    amount: params.amount,
    type: 'expense',
    category: params.category,
    description: params.description,
    receiptUrl: null,
    source: 'line',
    transactedAt: params.transactedAt,
  })
}

async function handleTextMessage(event: LineMessageEvent, userId: string) {
  const replyToken = event.replyToken
  const text = event.message?.text?.trim()

  if (!replyToken || !text) {
    return
  }

  const normalized = text.toLowerCase()
  if (text === 'サマリー' || normalized === 'summary') {
    await sendSummaryReply(userId, replyToken)
    return
  }

  if (text === 'ヘルプ' || normalized === 'help') {
    await replyLineText(replyToken, LINE_HELP_MESSAGE)
    return
  }

  const extracted = await parseExpenseText(text)
  if (!extracted) {
    await replyLineText(
      replyToken,
      '内容をうまく読み取れませんでした。例: 「ランチ 850円」または「サマリー」を送ってください。',
    )
    return
  }

  await createLineExpense({
    userId,
    amount: extracted.amount,
    category: extracted.category,
    description: extracted.description,
    transactedAt: extracted.transacted_at,
  })

  const categoryLabel = CATEGORY_LABELS[extracted.category] ?? extracted.category
  const usageMessage = await formatCategoryMonthlyUsage(userId, extracted.category, getCurrentYearMonth())
  await replyLineText(
    replyToken,
    `✅ ${categoryLabel} ${formatCurrency(extracted.amount)} を登録しました！\n📅 ${extracted.transacted_at}\n\n${usageMessage}`,
  )
}

async function uploadLineImageToStorage(userId: string, messageId: string) {
  if (!env.LINE_CHANNEL_ACCESS_TOKEN) {
    return null
  }

  const response = await fetch(`https://api-data.line.me/v2/bot/message/${messageId}/content`, {
    headers: {
      Authorization: `Bearer ${env.LINE_CHANNEL_ACCESS_TOKEN}`,
    },
  })

  if (!response.ok) {
    return null
  }

  const contentType = response.headers.get('content-type') ?? 'image/jpeg'
  const buffer = Buffer.from(await response.arrayBuffer())
  const objectPath = `${userId}/line-${Date.now()}-${messageId}.jpg`

  const { error } = await supabaseAdmin.storage.from('receipts').upload(objectPath, buffer, {
    contentType,
    upsert: false,
  })

  if (error) {
    return null
  }

  const { data } = supabaseAdmin.storage.from('receipts').getPublicUrl(objectPath)
  return data.publicUrl
}

async function handleImageMessage(event: LineMessageEvent, userId: string) {
  const replyToken = event.replyToken
  const messageId = event.message?.id

  if (!replyToken || !messageId) {
    return
  }

  const imageUrl = await uploadLineImageToStorage(userId, messageId)
  if (!imageUrl) {
    await replyLineText(replyToken, '画像の取得に失敗しました。時間をおいて再度お試しください。')
    return
  }

  const parsed = await extractReceiptFromImageUrl(imageUrl)
  if (!parsed.amount || !parsed.category || !parsed.transacted_at) {
    await replyLineText(replyToken, parsed.error_message ?? 'レシートを読み取れませんでした。手動入力してください。')
    return
  }

  await createLineExpense({
    userId,
    amount: parsed.amount,
    category: parsed.category,
    description: parsed.description,
    transactedAt: parsed.transacted_at,
  })

  const categoryLabel = CATEGORY_LABELS[parsed.category] ?? parsed.category
  const usageMessage = await formatCategoryMonthlyUsage(userId, parsed.category, getCurrentYearMonth())
  await replyLineText(
    replyToken,
    `✅ ${categoryLabel} ${formatCurrency(parsed.amount)} を登録しました！\n📅 ${parsed.transacted_at}\n\n${usageMessage}`,
  )
}

export async function handleLineWebhookPayload(payload: LineWebhookPayload) {
  const events = payload.events ?? []

  for (const event of events) {
    if (event.type !== 'message') {
      continue
    }

    const lineUserId = event.source?.userId
    const replyToken = event.replyToken

    if (!lineUserId || !replyToken) {
      continue
    }

    const connection = await findActiveConnectionByPlatformUserId('line', lineUserId)
    if (!connection) {
      await replyLineText(replyToken, 'アプリとの連携が必要です。設定画面からLINE連携を行ってください。')
      continue
    }

    const messageType = event.message?.type
    if (messageType === 'text') {
      await handleTextMessage(event, connection.userId)
      continue
    }

    if (messageType === 'image') {
      await handleImageMessage(event, connection.userId)
      continue
    }

    await replyLineText(replyToken, LINE_HELP_MESSAGE)
  }
}
