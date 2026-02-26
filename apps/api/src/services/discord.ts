import { ChannelType, Client, Events, GatewayIntentBits, Partials, type Message } from 'discord.js'

import { supabaseAdmin } from '../clients/supabase'
import { ensureBucketExists } from '../lib/storage'
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
// Discord 固有: 返信
// ─────────────────────────────────────────────

async function sendReply(message: Message, text: string) {
  await message.reply({ content: text.slice(0, 2000) })
}

// ─────────────────────────────────────────────
// Discord 固有: 画像取得・Supabase保存
// Discord CDN の添付ファイル URL は認証不要でアクセス可能
// ─────────────────────────────────────────────

async function uploadDiscordImageToStorage(userId: string, url: string, contentType: string): Promise<string | null> {
  const response = await fetch(url)
  if (!response.ok) return null

  const buffer = Buffer.from(await response.arrayBuffer())
  const ext = contentType.includes('png') ? 'png' : contentType.includes('webp') ? 'webp' : 'jpg'
  const objectPath = `${userId}/discord-${Date.now()}.${ext}`

  await ensureBucketExists('receipts')

  const { error } = await supabaseAdmin.storage.from('receipts').upload(objectPath, buffer, {
    contentType,
    upsert: false,
  })

  if (error) return null

  const { data } = supabaseAdmin.storage.from('receipts').getPublicUrl(objectPath)
  return data.publicUrl
}

// ─────────────────────────────────────────────
// Discord メッセージハンドラ
// ─────────────────────────────────────────────

async function handleTextMessage(message: Message, userId: string) {
  const text = message.content.trim()
  const normalized = text.toLowerCase()

  if (text === 'サマリー' || normalized === 'summary') {
    const summaryText = await buildSummaryMessageText(userId)
    await sendReply(message, summaryText)
    return
  }

  if (text === 'ヘルプ' || normalized === 'help') {
    await sendReply(message, BOT_HELP_MESSAGE)
    return
  }

  const extracted = await parseExpenseText(text)
  if (!extracted) {
    await sendReply(message, '内容をうまく読み取れませんでした。例: 「ランチ 850円」または「サマリー」を送ってください。')
    return
  }

  await createBotExpense({
    userId,
    amount: extracted.amount,
    category: extracted.category,
    description: extracted.description,
    transactedAt: extracted.transacted_at,
    source: 'discord',
  })

  const categoryLabel = CATEGORY_LABELS[extracted.category] ?? extracted.category
  const usageMessage = await formatCategoryMonthlyUsage(userId, extracted.category, getCurrentYearMonth())
  await sendReply(
    message,
    `✅ ${categoryLabel} ${formatCurrency(extracted.amount)} を登録しました！\n📅 ${extracted.transacted_at}\n\n${usageMessage}`,
  )
}

async function handleImageMessage(message: Message, userId: string, attachmentUrl: string, contentType: string) {
  const imageUrl = await uploadDiscordImageToStorage(userId, attachmentUrl, contentType)
  if (!imageUrl) {
    await sendReply(message, '画像の取得に失敗しました。時間をおいて再度お試しください。')
    return
  }

  const parsed = await extractReceiptFromImageUrl(imageUrl)
  if (!parsed.amount || !parsed.category || !parsed.transacted_at) {
    await sendReply(message, parsed.error_message ?? 'レシートを読み取れませんでした。手動入力してください。')
    return
  }

  await createBotExpense({
    userId,
    amount: parsed.amount,
    category: parsed.category,
    description: parsed.description,
    transactedAt: parsed.transacted_at,
    source: 'discord',
  })

  const categoryLabel = CATEGORY_LABELS[parsed.category] ?? parsed.category
  const usageMessage = await formatCategoryMonthlyUsage(userId, parsed.category, getCurrentYearMonth())
  await sendReply(
    message,
    `✅ ${categoryLabel} ${formatCurrency(parsed.amount)} を登録しました！\n📅 ${parsed.transacted_at}\n\n${usageMessage}`,
  )
}

// ─────────────────────────────────────────────
// Discord Gateway エントリーポイント
// ─────────────────────────────────────────────

let discordClient: Client | null = null

export async function pushDiscordDM(discordUserId: string, text: string): Promise<void> {
  if (!discordClient) return
  try {
    const user = await discordClient.users.fetch(discordUserId)
    await user.send(text.slice(0, 2000))
  } catch (error) {
    console.error(`[discord] DM送信失敗 ${discordUserId}:`, error)
  }
}

export async function startDiscordGateway() {
  if (!env.DISCORD_TOKEN) {
    console.log('[discord] DISCORD_TOKEN が未設定のため Gateway をスキップします')
    return
  }

  const client = new Client({
    intents: [GatewayIntentBits.DirectMessages, GatewayIntentBits.MessageContent],
    partials: [Partials.Channel, Partials.Message],
  })

  client.once(Events.ClientReady, (readyClient) => {
    console.log(`[discord] Bot 起動: ${readyClient.user.tag}`)
  })

  client.on(Events.MessageCreate, async (message) => {
    // Bot 自身のメッセージは無視 
    if (message.author.bot) return
    // DM のみ処理
    if (message.channel.type !== ChannelType.DM) return

    const discordUserId = message.author.id

    try {
      const connection = await findActiveConnectionByPlatformUserId('discord', discordUserId)
      if (!connection) {
        await sendReply(message, 'アプリとの連携が必要です。設定画面からDiscord連携を行ってください。')
        return
      }

      // 画像添付ファイルがある場合はOCR処理
      const imageAttachment = message.attachments.find((att) => att.contentType?.startsWith('image/'))
      if (imageAttachment) {
        await handleImageMessage(
          message,
          connection.userId,
          imageAttachment.url,
          imageAttachment.contentType ?? 'image/jpeg',
        )
        return
      }

      // テキストメッセージ処理
      if (message.content.trim()) {
        await handleTextMessage(message, connection.userId)
      }
    } catch (error) {
      console.error('[discord]', error)
      await sendReply(message, 'エラーが発生しました。時間をおいて再度お試しください。').catch(() => {})
    }
  })

  discordClient = client
  await client.login(env.DISCORD_TOKEN)
}
