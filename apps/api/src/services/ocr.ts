import { z } from 'zod'

import { extractFirstJsonObject, generateGeminiVisionText } from './gemini'
import { OCR_PROMPT } from './prompts/ocr'
import { EXPENSE_CATEGORIES } from '../schemas/constants'

const ocrRawResponseSchema = z.object({
  amount: z.number().int().nullable().optional(),
  description: z.string().nullable().optional(),
  transacted_at: z.string().nullable().optional(),
  category: z.enum(EXPENSE_CATEGORIES).nullable().optional(),
  confidence: z.number().min(0).max(1).optional(),
  error: z.string().optional(),
  error_message: z.string().optional(),
})

export type OcrResult = {
  amount: number | null
  description: string | null
  transacted_at: string | null
  category: (typeof EXPENSE_CATEGORIES)[number] | null
  confidence: number
  error_message?: string
}

function buildFallbackResult(message = 'レシートを読み取れませんでした。手動で入力してください。'): OcrResult {
  return {
    amount: null,
    description: null,
    transacted_at: null,
    category: null,
    confidence: 0,
    error_message: message,
  }
}

function normalizeContentType(contentType: string | null) {
  if (!contentType) return 'image/jpeg'
  if (contentType.includes('jpeg')) return 'image/jpeg'
  if (contentType.includes('png')) return 'image/png'
  if (contentType.includes('webp')) return 'image/webp'
  return 'image/jpeg'
}

/**
 * Calls Gemini Vision and safely maps unstable model output into API contract.
 */
export async function extractReceiptFromImageUrl(imageUrl: string): Promise<OcrResult> {
  try {
    const imageResponse = await fetch(imageUrl)
    if (!imageResponse.ok) {
      return buildFallbackResult()
    }

    const mimeType = normalizeContentType(imageResponse.headers.get('content-type'))
    const imageBuffer = Buffer.from(await imageResponse.arrayBuffer())
    const imageBase64 = imageBuffer.toString('base64')

    const rawText = await generateGeminiVisionText({
      prompt: OCR_PROMPT,
      imageBase64,
      mimeType,
    })

    const jsonText = extractFirstJsonObject(rawText)
    if (!jsonText) {
      return buildFallbackResult()
    }

    const parsedJson = JSON.parse(jsonText) as unknown
    const parsed = ocrRawResponseSchema.safeParse(parsedJson)
    if (!parsed.success || parsed.data.error) {
      return buildFallbackResult()
    }

    const confidence = typeof parsed.data.confidence === 'number' ? parsed.data.confidence : 0

    return {
      amount: parsed.data.amount ?? null,
      description: parsed.data.description ?? null,
      transacted_at: parsed.data.transacted_at ?? null,
      category: parsed.data.category ?? null,
      confidence,
      ...(confidence === 0 ? { error_message: 'レシートを読み取れませんでした。手動で入力してください。' } : {}),
    }
  } catch {
    return buildFallbackResult()
  }
}
