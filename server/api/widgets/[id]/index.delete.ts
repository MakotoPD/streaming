import { eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const widget = await requireOwnedWidget(event)
  await useDb().delete(tables.widgets).where(eq(tables.widgets.id, widget.id))
  publishToUser(widget.userId, { kind: 'reload', widgetId: widget.id })
  return { ok: true }
})
