import { Hono } from 'hono'

import { parseJsonBody } from '../lib/request'
import { success } from '../lib/response'
import type { AppBindings } from '../types'
import { putAssumptionsBodySchema } from '../schemas/assumptions'
import { getOrCreateAssumptions, putUserAssumptions } from '../services/assumptions'

const assumptionsRoute = new Hono<AppBindings>()

assumptionsRoute.get('/', async (c) => {
  const userId = c.get('userId')
  const data = await getOrCreateAssumptions(userId)

  return success(c, data)
})

assumptionsRoute.put('/', async (c) => {
  const body = await parseJsonBody(c, putAssumptionsBodySchema)
  const userId = c.get('userId')

  const data = await putUserAssumptions(userId, body)
  return success(c, data)
})

export default assumptionsRoute
