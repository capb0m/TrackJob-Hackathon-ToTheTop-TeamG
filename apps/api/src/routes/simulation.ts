import { Hono } from 'hono'

import { parseJsonBody, parseOptionalJsonBody } from '../lib/request'
import { success } from '../lib/response'
import type { AppBindings } from '../types'
import { runSimulationBodySchema, scenarioSimulationBodySchema } from '../schemas/simulation'
import { runScenarioSimulation, runSimulation } from '../services/simulation'

const simulationRoute = new Hono<AppBindings>()

simulationRoute.post('/run', async (c) => {
  const body = await parseOptionalJsonBody(c, runSimulationBodySchema)
  const userId = c.get('userId')

  const data = await runSimulation(userId, body.force ?? false)
  return success(c, data)
})

simulationRoute.post('/scenario', async (c) => {
  const body = await parseJsonBody(c, scenarioSimulationBodySchema)
  const userId = c.get('userId')

  const data = await runScenarioSimulation(userId, body.overrides)
  return success(c, data)
})

export default simulationRoute
