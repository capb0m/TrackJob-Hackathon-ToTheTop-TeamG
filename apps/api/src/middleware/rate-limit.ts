import type { MiddlewareHandler } from 'hono'

import { AppError } from '../lib/errors'
import type { AppBindings } from '../types'

const RATE_LIMIT_WINDOW_MS = 60_000
const RATE_LIMIT_MAX_REQUESTS = 100

type RateLimitEntry = {
  count: number
  resetAt: number
}

const rateLimitStore = new Map<string, RateLimitEntry>()

function getClientIdentifier(headerValue: string | undefined) {
  if (!headerValue) {
    return 'unknown'
  }

  const [first] = headerValue.split(',')
  return first?.trim() || 'unknown'
}

function buildRateLimitKey(c: Parameters<MiddlewareHandler<AppBindings>>[0]) {
  const forwardedFor = c.req.header('x-forwarded-for')
  const realIp = c.req.header('x-real-ip')
  const forwardedClientId = getClientIdentifier(forwardedFor)
  const clientId =
    forwardedClientId !== 'unknown'
      ? forwardedClientId
      : getClientIdentifier(realIp)

  return clientId
}

export const rateLimitMiddleware: MiddlewareHandler<AppBindings> = async (c, next) => {
  const now = Date.now()
  const key = buildRateLimitKey(c)
  const current = rateLimitStore.get(key)

  if (!current || current.resetAt <= now) {
    rateLimitStore.set(key, {
      count: 1,
      resetAt: now + RATE_LIMIT_WINDOW_MS,
    })

    await next()
    return
  }

  if (current.count >= RATE_LIMIT_MAX_REQUESTS) {
    throw new AppError('RATE_LIMITED', 'Too many requests. Please try again later.')
  }

  current.count += 1
  rateLimitStore.set(key, current)

  await next()
}
