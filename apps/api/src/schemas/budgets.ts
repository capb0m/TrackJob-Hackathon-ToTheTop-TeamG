import { z } from 'zod'

import { yearMonthSchema, uuidSchema } from './common'
import { EXPENSE_CATEGORIES } from './constants'

const budgetCategorySchema = z.enum(EXPENSE_CATEGORIES)

export const getBudgetsQuerySchema = z.object({
  year_month: yearMonthSchema.optional(),
})

export const putBudgetsBodySchema = z.object({
  year_month: yearMonthSchema,
  budgets: z
    .array(
      z.object({
        category: budgetCategorySchema,
        limit_amount: z.number().int().min(0),
        is_fixed: z.boolean(),
      }),
    )
    .min(1),
})

export const patchBudgetBodySchema = z
  .object({
    limit_amount: z.number().int().min(0).optional(),
    is_fixed: z.boolean().optional(),
  })
  .refine((value) => Object.keys(value).length > 0, 'at least one field is required')

export const budgetIdParamSchema = z.object({ id: uuidSchema })

export const copyBudgetsBodySchema = z.object({
  from_year_month: yearMonthSchema,
  to_year_month: yearMonthSchema,
})

export const budgetResponseSchema = z.object({
  id: uuidSchema,
  category: budgetCategorySchema,
  limit_amount: z.number().int(),
  spent_amount: z.number().int(),
  usage_rate: z.number(),
  is_fixed: z.boolean(),
})
