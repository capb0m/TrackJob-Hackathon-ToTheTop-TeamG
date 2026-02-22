import { Hono } from 'hono'

import { errorResponse } from '../../lib/response'
import { handleLineWebhookPayload, verifyLineSignature } from '../../services/line'
import type { AppBindings } from '../../types'

const lineWebhookRoute = new Hono<AppBindings>()

lineWebhookRoute.post('/', async (c) => {
  const rawBody = await c.req.text()
  const signature = c.req.header('x-line-signature')

  if (!verifyLineSignature(rawBody, signature)) {
    return errorResponse(c, 'VALIDATION_ERROR', 'Invalid LINE signature', 400)
  }

  let payload: unknown
  try {
    payload = JSON.parse(rawBody)
  } catch {
    return errorResponse(c, 'VALIDATION_ERROR', 'Invalid webhook payload', 400)
  }

  queueMicrotask(() => {
    handleLineWebhookPayload(payload as Parameters<typeof handleLineWebhookPayload>[0]).catch((error) => {
      console.error('[line-webhook]', error)
    })
  })

  return c.json({}, 200)
})

export default lineWebhookRoute
