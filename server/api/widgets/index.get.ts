import { asc, eq } from 'drizzle-orm'
import { sanitizeSettings, WIDGETS } from '#shared/widgets'

export default defineEventHandler(async (event) => {
  const userId = await requireUserId(event)
  const rows = await useDb().select().from(tables.widgets)
    .where(eq(tables.widgets.userId, userId))
    .orderBy(asc(tables.widgets.createdAt))
  return rows
    .filter(w => WIDGETS[w.type])
    .map(w => ({ ...w, scene: undefined, settings: sanitizeSettings(WIDGETS[w.type]!, w.settings) }))
})
