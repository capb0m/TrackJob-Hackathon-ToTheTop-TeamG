import { createHmac, timingSafeEqual } from 'node:crypto'

import { supabaseAdmin } from '../clients/supabase'
import { findActiveConnectionByPlatformUserId } from '../db/repositories/connections'
import { getCurrentYearMonth } from '../lib/date'
import { env } from '../lib/env'
import { extractReceiptFromImageUrl } from './ocr'
import {
  BOT_HELP_MESSAGE,
  CATEGORY_LABELS,
  buildSummaryMessageText,
  createBotExpense,
  formatCategoryMonthlyUsage,
  formatCurrency,
  parseExpenseText,
} from './bot-core'

// ─────────────────────────────────────────────
// LINE 型定義
// ─────────────────────────────────────────────

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

// ─────────────────────────────────────────────
// LINE 固有: 署名検証
// ─────────────────────────────────────────────

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

// ─────────────────────────────────────────────
// LINE 固有: 返信
// ─────────────────────────────────────────────

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

// ─────────────────────────────────────────────
// LINE 固有: 画像取得・Supabase保存
// ─────────────────────────────────────────────

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

// ─────────────────────────────────────────────
// LINE メッセージハンドラ
// ─────────────────────────────────────────────

async function handleTextMessage(event: LineMessageEvent, userId: string) {
  const replyToken = event.replyToken
  const text = event.message?.text?.trim()

  if (!replyToken || !text) {
    return
  }

  const normalized = text.toLowerCase()

  if (text === 'サマリー' || normalized === 'summary') {
    const summaryText = await buildSummaryMessageText(userId)
    await replyLineText(replyToken, summaryText)
    return
  }

  if (text === 'ヘルプ' || normalized === 'help') {
    await replyLineText(replyToken, BOT_HELP_MESSAGE)
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

  await createBotExpense({
    userId,
    amount: extracted.amount,
    category: extracted.category,
    description: extracted.description,
    transactedAt: extracted.transacted_at,
    source: 'line',
  })

  const categoryLabel = CATEGORY_LABELS[extracted.category] ?? extracted.category
  const usageMessage = await formatCategoryMonthlyUsage(userId, extracted.category, getCurrentYearMonth())
  await replyLineText(
    replyToken,
    `✅ ${categoryLabel} ${formatCurrency(extracted.amount)} を登録しました！\n📅 ${extracted.transacted_at}\n\n${usageMessage}`,
  )
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

  await createBotExpense({
    userId,
    amount: parsed.amount,
    category: parsed.category,
    description: parsed.description,
    transactedAt: parsed.transacted_at,
    source: 'line',
  })

  const categoryLabel = CATEGORY_LABELS[parsed.category] ?? parsed.category
  const usageMessage = await formatCategoryMonthlyUsage(userId, parsed.category, getCurrentYearMonth())
  await replyLineText(
    replyToken,
    `✅ ${categoryLabel} ${formatCurrency(parsed.amount)} を登録しました！\n📅 ${parsed.transacted_at}\n\n${usageMessage}`,
  )
}

// ─────────────────────────────────────────────
// LINE Webhook エントリーポイント
// ─────────────────────────────────────────────

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

    await replyLineText(replyToken, BOT_HELP_MESSAGE)
  }
}
