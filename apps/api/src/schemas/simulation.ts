import { z } from 'zod'

import { putAssumptionsBodySchema } from './assumptions'

export const runSimulationBodySchema = z.object({
  force: z.boolean().optional(),
})

export const scenarioSimulationBodySchema = z.object({
  overrides: putAssumptionsBodySchema.partial(),
})
