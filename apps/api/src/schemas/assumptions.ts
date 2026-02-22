import { z } from 'zod'

import { isoDatetimeSchema, uuidSchema } from './common'

export const putAssumptionsBodySchema = z.object({
  age: z.number().int().min(18).max(100),
  annual_income_growth: z.number().min(-10).max(30),
  investment_return: z.number().min(-10).max(30),
  inflation_rate: z.number().min(0).max(20),
  monthly_investment: z.number().int().min(0),
  simulation_trials: z.union([z.literal(100), z.literal(500), z.literal(1000)]).optional(),
})

export const assumptionsResponseSchema = z.object({
  id: uuidSchema,
  age: z.number().int(),
  annual_income_growth: z.number(),
  investment_return: z.number(),
  inflation_rate: z.number(),
  monthly_investment: z.number().int(),
  simulation_trials: z.number().int(),
  updated_at: isoDatetimeSchema,
})
