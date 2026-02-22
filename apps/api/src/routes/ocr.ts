import { Hono } from 'hono'

import { parseJsonBody } from '../lib/request'
import { success } from '../lib/response'
import { ocrBodySchema } from '../schemas/ocr'
import { extractReceiptFromImageUrl } from '../services/ocr'
import type { AppBindings } from '../types'

const ocrRoute = new Hono<AppBindings>()

ocrRoute.post('/', async (c) => {
  const body = await parseJsonBody(c, ocrBodySchema)
  const data = await extractReceiptFromImageUrl(body.image_url)
  return success(c, data)
})

export default ocrRoute
