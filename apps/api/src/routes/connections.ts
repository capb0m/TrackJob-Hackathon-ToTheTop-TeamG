import { Hono } from 'hono'

import { parseJsonBody, parseParams } from '../lib/request'
import { success } from '../lib/response'
import type { AppBindings } from '../types'
import { connectionPlatformParamSchema, lineConnectionBodySchema } from '../schemas/connections'
import { connectLine, disconnectPlatform, listUserConnections } from '../services/connections'

const connectionsRoute = new Hono<AppBindings>()

connectionsRoute.get('/', async (c) => {
  const userId = c.get('userId')
  const data = await listUserConnections(userId)

  return success(c, data)
})

connectionsRoute.post('/line', async (c) => {
  const body = await parseJsonBody(c, lineConnectionBodySchema)
  const userId = c.get('userId')

  const data = await connectLine(userId, body.line_user_id)
  return success(c, data, 201)
})

connectionsRoute.delete('/:platform', async (c) => {
  const { platform } = parseParams(c, connectionPlatformParamSchema)
  const userId = c.get('userId')

  await disconnectPlatform(userId, platform)
  return c.body(null, 204)
})

export default connectionsRoute
