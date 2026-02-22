import { Hono } from 'hono'

import { parseJsonBody } from '../lib/request'
import { success } from '../lib/response'
import type { AppBindings } from '../types'
import { createProfileBodySchema, updateProfileBodySchema } from '../schemas/auth'
import { createProfile, getProfile, patchProfile } from '../services/profile'

const authRoute = new Hono<AppBindings>()

authRoute.post('/profile', async (c) => {
  const body = await parseJsonBody(c, createProfileBodySchema)
  const userId = c.get('userId')

  const profile = await createProfile(userId, body)
  return success(c, profile, 201)
})

authRoute.get('/profile', async (c) => {
  const userId = c.get('userId')
  const profile = await getProfile(userId)

  return success(c, profile)
})

authRoute.patch('/profile', async (c) => {
  const body = await parseJsonBody(c, updateProfileBodySchema)
  const userId = c.get('userId')

  const profile = await patchProfile(userId, body)
  return success(c, profile)
})

export default authRoute
