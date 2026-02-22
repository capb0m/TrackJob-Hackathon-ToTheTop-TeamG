import type { ChatMessage, ChatResponse } from '@lifebalance/shared/types'

import { generateGeminiChat } from './gemini'
import { CHAT_SYSTEM_PROMPT } from './prompts/chat'
import { chatConfigSchema } from '../schemas/chat'

function extractConfigTag(content: string) {
  const match = content.match(/<CONFIG>([\s\S]*?)<\/CONFIG>/i)
  if (!match) {
    return {
      configText: null,
      cleanedContent: content.trim(),
    }
  }

  return {
    configText: match[1]?.trim() ?? null,
    cleanedContent: content.replace(match[0], '').trim(),
  }
}

function parseConfig(content: string) {
  try {
    const parsedJson = JSON.parse(content) as unknown
    const parsed = chatConfigSchema.safeParse(parsedJson)
    return parsed.success ? parsed.data : null
  } catch {
    return null
  }
}

/**
 * Parses optional <CONFIG> payload and degrades gracefully when model JSON is invalid.
 */
export async function generateChatResponse(messages: ChatMessage[]): Promise<ChatResponse> {
  const rawContent = await generateGeminiChat({
    systemInstruction: CHAT_SYSTEM_PROMPT,
    history: messages,
  })

  const { configText, cleanedContent } = extractConfigTag(rawContent)
  if (!configText) {
    return {
      role: 'model',
      content: cleanedContent || rawContent.trim(),
      is_complete: false,
      config: null,
    }
  }

  const config = parseConfig(configText)
  if (!config) {
    return {
      role: 'model',
      content: cleanedContent || '設定内容をもう一度確認させてください。',
      is_complete: false,
      config: null,
    }
  }

  return {
    role: 'model',
    content: cleanedContent || '設定内容をまとめました。問題なければ保存してください。',
    is_complete: true,
    config,
  }
}
