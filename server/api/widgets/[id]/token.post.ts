import { eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const widget = await requireOwnedWidget(event)
  const [updated] = await useDb().update(tables.widgets)
    .set({ token: newToken() })
    .where(eq(tables.widgets.id, widget.id))
    .returning()
  publishToUser(widget.userId, { kind: 'reload', widgetId: widget.id })
  return updated
})
