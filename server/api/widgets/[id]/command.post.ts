import { z } from 'zod'
import { WIDGETS } from '#shared/widgets'

const body = z.object({
  name: z.string().max(30),
  payload: z.unknown().optional()
})

export default defineEventHandler(async (event) => {
  const widget = await requireOwnedWidget(event)
  const { name, payload } = await readValidatedBody(event, body.parse)
  const def = WIDGETS[widget.type]
  const allowed = [...def?.actions ?? [], ...def?.panel === 'pin' ? ['pin'] : []]
  if (!allowed.includes(name)) throw createError({ statusCode: 400 })
  if (JSON.stringify(payload ?? null).length > 10_000) throw createError({ statusCode: 413 })
  publishToUser(widget.userId, { kind: 'event', widgetId: widget.id, event: { kind: 'command', name, payload } })
  return { ok: true }
})
