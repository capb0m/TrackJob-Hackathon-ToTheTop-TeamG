# AI Quality Report

## Scope
- OCR (`POST /api/ocr`)
- Advice generation (`POST /api/advice/generate`)
- Chat wizard (`POST /api/chat`)
- LINE extraction (`POST /api/webhooks/line`)

## Prompt Revisions
- `apps/api/src/services/prompts/ocr.ts`: v1 initial
- `apps/api/src/services/prompts/advice.ts`: v1 initial
- `apps/api/src/services/prompts/chat.ts`: v1 initial
- `apps/api/src/services/prompts/line.ts`: v1 initial

## Validation Script
- Script: `apps/api/src/scripts/eval-prompts.ts`
- Run:
  - `docker compose exec api bun run src/scripts/eval-prompts.ts`

## Current Checks
- JSON extraction from fenced/non-fenced responses
- Zod validation for OCR/Advice/ChatConfig/LINE extraction sample outputs
- Fallback compatibility for parse failure paths

## Follow-up Cases
- OCR: blurred/tilted receipts, non-receipt images
- Advice: extreme overspending month, no transactions month
- Chat: malformed `<CONFIG>` payload, missing budget categories
- LINE: ambiguous text (`昨日スタバ`, 金額なし), empty `events`, non-message events
