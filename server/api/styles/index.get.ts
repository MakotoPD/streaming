import { and, asc, eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const userId = await requireUserId(event)
  const { type } = getQuery(event)
  return useDb().select().from(tables.styles)
    .where(and(eq(tables.styles.userId, userId), eq(tables.styles.widgetType, String(type ?? ''))))
    .orderBy(asc(tables.styles.createdAt))
})
