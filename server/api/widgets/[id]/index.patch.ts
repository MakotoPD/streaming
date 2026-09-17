import { eq } from 'drizzle-orm'
import { z } from 'zod'
import { sanitizeSettings, WIDGETS } from '#shared/widgets'

const body = z.object({
  name: z.string().trim().max(60).optional(),
  settings: z.record(z.string(), z.unknown()).optional()
})

export default defineEventHandler(async (event) => {
  const widget = await requireOwnedWidget(event)
  const input = await readValidatedBody(event, body.parse)
  const settings = input.settings ? sanitizeSettings(WIDGETS[widget.type]!, input.settings) : widget.settings

  const [updated] = await useDb().update(tables.widgets)
    .set({ name: input.name ?? widget.name, settings, updatedAt: new Date() })
    .where(eq(tables.widgets.id, widget.id))
    .returning()

  if (input.settings) publishToUser(widget.userId, { kind: 'config', widgetId: widget.id, settings })
  return updated
})
