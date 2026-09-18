import { z } from 'zod'

const bodySchema = z.object({
  action: z.enum(['replay', 'skip']),
  event: z.unknown().optional()
})

export default defineEventHandler(async (event) => {
  const user = await creatorPanelByToken(event)
  panelRateLimit(event, `actions:${user.id}`, 30, 10_000)
  const body = await readValidatedBody(event, bodySchema.parse)

  if (body.action === 'skip') {
    publishToUser(user.id, { kind: 'event', event: { kind: 'command', name: 'skip' } })
    return { ok: true }
  }

  const streamEvent = safePanelEvent(body.event)
  if (!streamEvent) throw createError({ statusCode: 400, message: 'invalid_event' })
  publishToUser(user.id, { kind: 'event', event: streamEvent })
  return { ok: true }
})
