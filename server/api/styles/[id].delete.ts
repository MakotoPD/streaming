import { and, eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const userId = await requireUserId(event)
  await useDb().delete(tables.styles)
    .where(and(eq(tables.styles.id, getRouterParam(event, 'id')!), eq(tables.styles.userId, userId)))
    .catch(() => undefined)
  return { ok: true }
})
