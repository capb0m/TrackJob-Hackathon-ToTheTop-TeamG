import type { MiddlewareHandler } from 'hono'

import { supabaseAdmin } from '../clients/supabase'
import { AppError } from '../lib/errors'
import type { AppBindings } from '../types'

function extractBearerToken(headerValue: string | undefined): string | null {
  if (!headerValue?.startsWith('Bearer ')) {
    return null
  }

  return headerValue.slice('Bearer '.length).trim() || null
}

export const authMiddleware: MiddlewareHandler<AppBindings> = async (c, next) => {
  const authHeader = c.req.header('authorization')
  const token = extractBearerToken(authHeader)

  if (!token) {
    throw new AppError('UNAUTHORIZED', 'Authorization header is required')
  }

  const { data, error } = await supabaseAdmin.auth.getUser(token)

  if (error || !data.user) {
    throw new AppError('UNAUTHORIZED', 'Invalid or expired token')
  }

  c.set('userId', data.user.id)
  await next()
}
