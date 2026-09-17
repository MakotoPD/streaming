import { z } from 'zod'
import { sampleEvent, WIDGET_TESTS } from '#shared/widgets'

export default defineEventHandler(async (event) => {
  const widget = await requireOwnedWidget(event)
  const { test } = await readValidatedBody(event, z.object({ test: z.string() }).parse)
  if (!WIDGET_TESTS[widget.type]?.includes(test)) throw createError({ statusCode: 400 })
  publishToUser(widget.userId, { kind: 'event', widgetId: widget.id, event: sampleEvent(test) })
  return { ok: true }
})
