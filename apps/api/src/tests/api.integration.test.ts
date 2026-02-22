import { describe, expect, it, mock } from 'bun:test'
import { Hono } from 'hono'
import { ZodError } from 'zod'

import { app as mainApp } from '../index'
import { AppError, isAppError } from '../lib/errors'
import { errorResponse } from '../lib/response'
import { formatZodError } from '../lib/validation'
import type { AppBindings } from '../types'

describe('API integration (app.request)', () => {
  it('normal: GET /health returns 200', async () => {
    const response = await mainApp.request('/health')
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body).toEqual({ status: 'ok' })
  })

  it('validation: POST /api/webhooks/line with invalid signature returns 400', async () => {
    const response = await mainApp.request('/api/webhooks/line', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify({ events: [] }),
    })

    const body = (await response.json()) as {
      error: {
        code: string
      }
    }

    expect(response.status).toBe(400)
    expect(body.error.code).toBe('VALIDATION_ERROR')
  })

  it('auth: GET /api/transactions without Authorization returns 401', async () => {
    const response = await mainApp.request('/api/transactions')
    const body = (await response.json()) as {
      error: {
        code: string
      }
    }

    expect(response.status).toBe(401)
    expect(body.error.code).toBe('UNAUTHORIZED')
  })

  it('forbidden: other user resource access returns 403', async () => {
    mock.module('../services/transactions', () => ({
      listUserTransactions: async () => ({
        data: [],
        pagination: {
          total: 0,
          page: 1,
          limit: 20,
          has_next: false,
        },
      }),
      createUserTransaction: async () => ({
        id: '00000000-0000-0000-0000-000000000001',
      }),
      getMonthlyTransactionSummary: async () => ({
        year_month: '2026-02',
        total_expense: 0,
        total_income: 0,
        net_saving: 0,
        by_category: [],
      }),
      uploadReceiptImage: async () => ({ url: 'https://example.com/receipt.jpg' }),
      getUserTransaction: async () => {
        throw new AppError('FORBIDDEN', 'Access to this resource is forbidden')
      },
      patchUserTransaction: async () => {
        throw new AppError('FORBIDDEN', 'Access to this resource is forbidden')
      },
      removeUserTransaction: async () => {
        throw new AppError('FORBIDDEN', 'Access to this resource is forbidden')
      },
    }))

    const { default: transactionsRoute } = await import('../routes/transactions')

    const app = new Hono<AppBindings>()
    app.use('/api/*', async (c, next) => {
      c.set('userId', '11111111-1111-1111-1111-111111111111')
      await next()
    })
    app.route('/api/transactions', transactionsRoute)
    app.onError((error, c) => {
      if (isAppError(error)) {
        return errorResponse(c, error.code, error.message, error.status)
      }

      if (error instanceof ZodError) {
        return errorResponse(c, 'VALIDATION_ERROR', formatZodError(error), 400)
      }

      return errorResponse(c, 'INTERNAL_ERROR', 'Server error', 500)
    })

    const response = await app.request('/api/transactions/00000000-0000-0000-0000-000000000001')
    const body = (await response.json()) as {
      error: {
        code: string
      }
    }

    expect(response.status).toBe(403)
    expect(body.error.code).toBe('FORBIDDEN')
  })
})
