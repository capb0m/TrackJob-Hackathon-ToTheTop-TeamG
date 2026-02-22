import { z } from 'zod'

const envSchema = z.object({
  PORT: z.coerce.number().int().positive().default(8787),
  FRONTEND_URL: z.string().url().default('http://localhost:3000'),
  DATABASE_URL: z
    .string()
    .default('postgres://postgres:postgres@127.0.0.1:5432/postgres'),
  SUPABASE_URL: z.string().url().default('http://127.0.0.1:54321'),
  SUPABASE_SERVICE_ROLE_KEY: z.string().default('development-service-role-key'),
  GEMINI_API_KEY: z.string().optional().default(''),
  LINE_CHANNEL_SECRET: z.string().optional().default(''),
  LINE_CHANNEL_ACCESS_TOKEN: z.string().optional().default(''),
})

export const env = envSchema.parse(process.env)
