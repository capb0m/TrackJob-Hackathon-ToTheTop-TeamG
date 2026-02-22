import type { Context } from 'hono'
import type { z, ZodType } from 'zod'

import { AppError } from './errors'
import { formatZodError } from './validation'

export async function parseJsonBody<T extends ZodType>(c: Context, schema: T): Promise<z.infer<T>> {
  const body = await c.req.json().catch(() => {
    throw new AppError('VALIDATION_ERROR', 'Invalid JSON body')
  })

  const parsed = schema.safeParse(body)

  if (!parsed.success) {
    throw new AppError('VALIDATION_ERROR', formatZodError(parsed.error))
  }

  return parsed.data
}

export async function parseOptionalJsonBody<T extends ZodType>(
  c: Context,
  schema: T,
): Promise<z.infer<T>> {
  const raw = await c.req.text()
  let body: unknown

  if (raw.trim().length === 0) {
    body = {}
  } else {
    try {
      body = JSON.parse(raw)
    } catch {
      throw new AppError('VALIDATION_ERROR', 'Invalid JSON body')
    }
  }

  const parsed = schema.safeParse(body)

  if (!parsed.success) {
    throw new AppError('VALIDATION_ERROR', formatZodError(parsed.error))
  }

  return parsed.data
}

export function parseQuery<T extends ZodType>(c: Context, schema: T): z.infer<T> {
  const parsed = schema.safeParse(c.req.query())

  if (!parsed.success) {
    throw new AppError('VALIDATION_ERROR', formatZodError(parsed.error))
  }

  return parsed.data
}

export function parseParams<T extends ZodType>(c: Context, schema: T): z.infer<T> {
  const parsed = schema.safeParse(c.req.param())

  if (!parsed.success) {
    throw new AppError('VALIDATION_ERROR', formatZodError(parsed.error))
  }

  return parsed.data
}
