import type { Context } from 'hono'

export function success<T>(c: Context, data: T, status = 200) {
  return c.json({ data }, status)
}

export function successWithPagination<T>(
  c: Context,
  data: T[],
  pagination: { total: number; page: number; limit: number; has_next: boolean },
  status = 200,
) {
  return c.json({ data, pagination }, status)
}

export function errorResponse(
  c: Context,
  code: string,
  message: string,
  status: number,
) {
  return c.json({ error: { code, message } }, status)
}
