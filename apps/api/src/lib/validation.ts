import type { ZodError } from 'zod'

export function formatZodError(error: ZodError): string {
  const firstIssue = error.issues[0]

  if (!firstIssue) {
    return 'Invalid request'
  }

  const path = firstIssue.path.length ? `${firstIssue.path.join('.')}: ` : ''
  return `${path}${firstIssue.message}`
}
