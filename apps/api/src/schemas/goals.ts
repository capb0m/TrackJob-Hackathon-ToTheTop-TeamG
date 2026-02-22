import { z } from 'zod'

import { isoDatetimeSchema, uuidSchema } from './common'
import { GOAL_PRIORITIES, GOAL_STATUSES } from './constants'

const currentYear = new Date().getUTCFullYear()

export const listGoalsQuerySchema = z.object({
  status: z.enum(GOAL_STATUSES).optional(),
})

export const createGoalBodySchema = z.object({
  title: z.string().min(1).max(50),
  icon: z.string().min(1).max(4).optional(),
  target_amount: z.number().int().min(1),
  saved_amount: z.number().int().min(0).optional(),
  monthly_saving: z.number().int().min(0),
  target_year: z.number().int().min(currentYear),
  priority: z.enum(GOAL_PRIORITIES),
})

export const updateGoalBodySchema = z
  .object({
    title: z.string().min(1).max(50).optional(),
    icon: z.string().min(1).max(4).optional(),
    target_amount: z.number().int().min(1).optional(),
    saved_amount: z.number().int().min(0).optional(),
    monthly_saving: z.number().int().min(0).optional(),
    target_year: z.number().int().min(currentYear).optional(),
    priority: z.enum(GOAL_PRIORITIES).optional(),
    status: z.enum(GOAL_STATUSES).optional(),
  })
  .refine((value) => Object.keys(value).length > 0, 'at least one field is required')

export const goalIdParamSchema = z.object({ id: uuidSchema })

export const reorderGoalsBodySchema = z.object({
  orders: z.array(z.object({ id: uuidSchema, sort_order: z.number().int().min(1) })).min(1),
})

export const goalResponseSchema = z.object({
  id: uuidSchema,
  title: z.string(),
  icon: z.string(),
  target_amount: z.number().int(),
  saved_amount: z.number().int(),
  monthly_saving: z.number().int(),
  target_year: z.number().int(),
  priority: z.enum(GOAL_PRIORITIES),
  status: z.enum(GOAL_STATUSES),
  sort_order: z.number().int(),
  progress_rate: z.number(),
  created_at: isoDatetimeSchema,
  updated_at: isoDatetimeSchema,
})
