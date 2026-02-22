import { Hono } from 'hono'

import { parseJsonBody, parseParams, parseQuery } from '../lib/request'
import { success } from '../lib/response'
import type { AppBindings } from '../types'
import {
  budgetIdParamSchema,
  copyBudgetsBodySchema,
  getBudgetsQuerySchema,
  patchBudgetBodySchema,
  putBudgetsBodySchema,
} from '../schemas/budgets'
import { copyUserBudgets, getUserBudgets, patchUserBudget, putUserBudgets } from '../services/budgets'

const budgetsRoute = new Hono<AppBindings>()

budgetsRoute.get('/', async (c) => {
  const query = parseQuery(c, getBudgetsQuerySchema)
  const userId = c.get('userId')

  const data = await getUserBudgets(userId, query.year_month)
  return success(c, data)
})

budgetsRoute.put('/', async (c) => {
  const body = await parseJsonBody(c, putBudgetsBodySchema)
  const userId = c.get('userId')

  const data = await putUserBudgets(userId, body)
  return success(c, data)
})

budgetsRoute.patch('/:id', async (c) => {
  const { id } = parseParams(c, budgetIdParamSchema)
  const body = await parseJsonBody(c, patchBudgetBodySchema)
  const userId = c.get('userId')

  const data = await patchUserBudget(userId, id, body)
  return success(c, data)
})

budgetsRoute.post('/copy', async (c) => {
  const body = await parseJsonBody(c, copyBudgetsBodySchema)
  const userId = c.get('userId')

  const data = await copyUserBudgets(userId, body)
  return success(c, data, 201)
})

export default budgetsRoute
