import { z } from 'zod'

import { dateSchema, isoDatetimeSchema, paginationQuerySchema, uuidSchema, yearMonthSchema } from './common'
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES, TRANSACTION_SOURCES, TRANSACTION_TYPES } from './constants'

const transactionCategorySchema = z.enum([...new Set([...EXPENSE_CATEGORIES, ...INCOME_CATEGORIES])] as [
  string,
  ...string[],
])

export const listTransactionsQuerySchema = paginationQuerySchema.extend({
  year_month: z.union([yearMonthSchema, z.literal('all')]).optional(),
  category: transactionCategorySchema.optional(),
  type: z.enum(TRANSACTION_TYPES).optional(),
  source: z.enum(TRANSACTION_SOURCES).optional(),
  keyword: z.string().trim().min(1).max(200).optional(),
  sort: z.enum(['transacted_at', 'amount', 'created_at']).default('transacted_at'),
  order: z.enum(['asc', 'desc']).default('desc'),
})

export const createTransactionBodySchema = z.object({
  amount: z.number().int().min(1),
  type: z.enum(TRANSACTION_TYPES),
  category: transactionCategorySchema,
  description: z.string().max(200).optional().nullable(),
  receipt_url: z.string().url().optional().nullable(),
  transacted_at: dateSchema,
})

export const updateTransactionBodySchema = z
  .object({
    amount: z.number().int().min(1).optional(),
    type: z.enum(TRANSACTION_TYPES).optional(),
    category: transactionCategorySchema.optional(),
    description: z.string().max(200).optional().nullable(),
    receipt_url: z.string().url().optional().nullable(),
    source: z.enum(TRANSACTION_SOURCES).optional(),
    transacted_at: dateSchema.optional(),
  })
  .refine((value) => Object.keys(value).length > 0, 'at least one field is required')

export const transactionIdParamSchema = z.object({ id: uuidSchema })

export const summaryQuerySchema = z.object({
  year_month: yearMonthSchema.optional(),
})

export const trendQuerySchema = z.object({
  range: z.enum(['1m', '3m', '1y']).default('3m'),
})

export const uploadReceiptResponseSchema = z.object({
  url: z.string().url(),
})

export const transactionResponseSchema = z.object({
  id: uuidSchema,
  amount: z.number().int(),
  type: z.enum(TRANSACTION_TYPES),
  category: z.string(),
  description: z.string().nullable(),
  receipt_url: z.string().nullable(),
  source: z.enum(TRANSACTION_SOURCES),
  transacted_at: dateSchema,
  created_at: isoDatetimeSchema,
})
