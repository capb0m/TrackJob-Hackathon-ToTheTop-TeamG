import { z } from 'zod'

import { dateSchema } from './common'
import { EXPENSE_CATEGORIES } from './constants'

export const ocrBodySchema = z.object({
  image_url: z.string().url(),
})

export const ocrSuccessResponseSchema = z.object({
  amount: z.number().int().nullable(),
  description: z.string().nullable(),
  transacted_at: dateSchema.nullable(),
  category: z.enum(EXPENSE_CATEGORIES).nullable(),
  confidence: z.number().min(0).max(1),
  error_message: z.string().optional(),
})
