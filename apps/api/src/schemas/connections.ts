import { z } from 'zod'

import { isoDatetimeSchema, uuidSchema } from './common'
import { CONNECTION_PLATFORMS } from './constants'

export const lineConnectionBodySchema = z.object({
  line_user_id: z.string().regex(/^U[a-zA-Z0-9]{32}$/, 'line_user_id must start with U and be 33 chars'),
})

export const connectionPlatformParamSchema = z.object({
  platform: z.enum(CONNECTION_PLATFORMS),
})

export const connectionResponseSchema = z.object({
  id: uuidSchema,
  platform: z.enum(CONNECTION_PLATFORMS),
  is_active: z.boolean(),
  connected_at: isoDatetimeSchema,
})
