import { z } from 'zod'
import { sampleEvent, sanitizeSettings, WIDGETS } from '#shared/widgets'

export default defineEventHandler(async (event) => {
  const widget = await requireOwnedWidget(event)
  const { test } = await readValidatedBody(event, z.object({ test: z.string() }).parse)
  const def = WIDGETS[widget.type]
  if (!def?.tests.includes(test)) throw createError({ statusCode: 400 })
  publishToUser(widget.userId, { kind: 'event', widgetId: widget.id, event: sampleEvent(test, sanitizeSettings(def, widget.settings)) })
  return { ok: true }
})
