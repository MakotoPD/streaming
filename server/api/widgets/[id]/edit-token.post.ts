import { eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const widget = await requireOwnedWidget(event)
  if (widget.type !== 'canvas') throw createError({ statusCode: 400 })
  const [updated] = await useDb().update(tables.widgets)
    .set({ editToken: newToken() })
    .where(eq(tables.widgets.id, widget.id))
    .returning({ editToken: tables.widgets.editToken })
  return { editToken: updated!.editToken }
})
