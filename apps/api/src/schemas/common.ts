import { z } from 'zod'

export const uuidSchema = z.string().uuid()
export const yearMonthSchema = z
  .string()
  .regex(/^\d{4}-(0[1-9]|1[0-2])$/, 'year_month must be YYYY-MM format')
export const dateSchema = z
  .string()
  .regex(/^\d{4}-(0[1-9]|1[0-2])-([0-2][0-9]|3[0-1])$/, 'date must be YYYY-MM-DD format')
export const isoDatetimeSchema = z.string().datetime()

export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
})
