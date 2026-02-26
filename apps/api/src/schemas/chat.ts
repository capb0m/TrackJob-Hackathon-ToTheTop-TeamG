import { z } from 'zod'

import { GOAL_PRIORITIES } from './constants'

export const chatMessageSchema = z.object({
  role: z.enum(['user', 'model']),
  content: z.string().min(1).max(2000),
})

export const chatBodySchema = z.object({
  messages: z.array(chatMessageSchema).min(1).max(50),
})

export const chatConfigSchema = z.object({
  monthly_income: z.number().int().min(1),
  monthly_savings_target: z.number().int().min(0),
  life_goals: z
    .array(
      z.object({
        title: z.string().min(1).max(50),
        icon: z.string().min(1).max(10).default('🎯'),
        target_amount: z.number().int().min(1),
        monthly_saving: z.number().int().min(0),
        target_year: z.number().int().min(new Date().getUTCFullYear()),
        priority: z.enum(GOAL_PRIORITIES),
      }),
    )
    .min(1),
  suggested_budgets: z.record(z.number().int().min(0)),
})

export const chatResponseSchema = z.object({
  role: z.literal('model'),
  content: z.string(),
  is_complete: z.boolean(),
  config: chatConfigSchema.nullable(),
})
