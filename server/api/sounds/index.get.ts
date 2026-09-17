import { asc, eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const userId = await requireUserId(event)
  const rows = await useDb().select({ id: tables.sounds.id, name: tables.sounds.name, size: tables.sounds.size })
    .from(tables.sounds)
    .where(eq(tables.sounds.userId, userId))
    .orderBy(asc(tables.sounds.createdAt))
  return rows.map(s => ({ ...s, url: `/api/sounds/${s.id}/file` }))
})
