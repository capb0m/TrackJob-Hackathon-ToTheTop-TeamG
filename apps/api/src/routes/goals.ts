import { Hono } from 'hono'

import { parseJsonBody, parseParams, parseQuery } from '../lib/request'
import { success } from '../lib/response'
import type { AppBindings } from '../types'
import {
  createGoalBodySchema,
  goalIdParamSchema,
  listGoalsQuerySchema,
  reorderGoalsBodySchema,
  updateGoalBodySchema,
} from '../schemas/goals'
import {
  createUserGoal,
  deleteUserGoal,
  listUserGoals,
  patchUserGoal,
  reorderUserGoals,
} from '../services/goals'

const goalsRoute = new Hono<AppBindings>()

goalsRoute.get('/', async (c) => {
  const query = parseQuery(c, listGoalsQuerySchema)
  const userId = c.get('userId')

  const data = await listUserGoals(userId, query.status)
  return success(c, data)
})

goalsRoute.post('/', async (c) => {
  const body = await parseJsonBody(c, createGoalBodySchema)
  const userId = c.get('userId')

  const data = await createUserGoal(userId, body)
  return success(c, data, 201)
})

goalsRoute.patch('/reorder', async (c) => {
  const body = await parseJsonBody(c, reorderGoalsBodySchema)
  const userId = c.get('userId')

  const data = await reorderUserGoals(userId, body.orders)
  return success(c, data)
})

goalsRoute.patch('/:id', async (c) => {
  const { id } = parseParams(c, goalIdParamSchema)
  const body = await parseJsonBody(c, updateGoalBodySchema)
  const userId = c.get('userId')

  const data = await patchUserGoal(userId, id, body)
  return success(c, data)
})

goalsRoute.delete('/:id', async (c) => {
  const { id } = parseParams(c, goalIdParamSchema)
  const userId = c.get('userId')

  await deleteUserGoal(userId, id)
  return c.body(null, 204)
})

export default goalsRoute
