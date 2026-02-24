import { Hono } from 'hono'

import { AppError } from '../lib/errors'
import { parseJsonBody, parseParams, parseQuery } from '../lib/request'
import { success, successWithPagination } from '../lib/response'
import type { AppBindings } from '../types'
import {
  createTransactionBodySchema,
  listTransactionsQuerySchema,
  summaryQuerySchema,
  transactionIdParamSchema,
  trendQuerySchema,
  updateTransactionBodySchema,
} from '../schemas/transactions'
import {
  createUserTransaction,
  getMonthlyTransactionSummary,
  getRecordingStreakDays,
  getTransactionTrend,
  getUserTransaction,
  listUserTransactions,
  patchUserTransaction,
  removeUserTransaction,
  uploadReceiptImage,
} from '../services/transactions'

const transactionsRoute = new Hono<AppBindings>()

transactionsRoute.get('/', async (c) => {
  const query = parseQuery(c, listTransactionsQuerySchema)
  const userId = c.get('userId')

  const result = await listUserTransactions(userId, query)

  return successWithPagination(c, result.data, result.pagination)
})

transactionsRoute.post('/', async (c) => {
  const body = await parseJsonBody(c, createTransactionBodySchema)
  const userId = c.get('userId')

  const transaction = await createUserTransaction(userId, body)
  return success(c, transaction, 201)
})

transactionsRoute.get('/summary', async (c) => {
  const query = parseQuery(c, summaryQuerySchema)
  const userId = c.get('userId')

  const summary = await getMonthlyTransactionSummary(userId, query.year_month)
  return success(c, summary)
})

transactionsRoute.post('/upload-receipt', async (c) => {
  const parsedBody = await c.req.parseBody()
  const fileValue = parsedBody.file
  const file = Array.isArray(fileValue) ? fileValue[0] : fileValue

  if (!(file instanceof File)) {
    throw new AppError('VALIDATION_ERROR', 'file is required')
  }

  const userId = c.get('userId')
  const result = await uploadReceiptImage(userId, file)

  return success(c, result, 201)
})

transactionsRoute.get('/streak', async (c) => {
  const userId = c.get('userId')
  const result = await getRecordingStreakDays(userId)
  return success(c, result)
})

transactionsRoute.get('/trend', async (c) => {
  const query = parseQuery(c, trendQuerySchema)
  const userId = c.get('userId')
  const result = await getTransactionTrend(userId, query.range)
  return success(c, result)
})

transactionsRoute.get('/:id', async (c) => {
  const { id } = parseParams(c, transactionIdParamSchema)
  const userId = c.get('userId')

  const transaction = await getUserTransaction(userId, id)
  return success(c, transaction)
})

transactionsRoute.patch('/:id', async (c) => {
  const { id } = parseParams(c, transactionIdParamSchema)
  const body = await parseJsonBody(c, updateTransactionBodySchema)
  const userId = c.get('userId')

  const transaction = await patchUserTransaction(userId, id, body)
  return success(c, transaction)
})

transactionsRoute.delete('/:id', async (c) => {
  const { id } = parseParams(c, transactionIdParamSchema)
  const userId = c.get('userId')

  await removeUserTransaction(userId, id)
  return c.body(null, 204)
})

export default transactionsRoute
