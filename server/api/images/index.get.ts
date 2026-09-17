import { desc, eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const userId = await requireUserId(event)
  const rows = await useDb().select({ id: tables.images.id, name: tables.images.name, animated: tables.images.animated, width: tables.images.width, height: tables.images.height })
    .from(tables.images)
    .where(eq(tables.images.userId, userId))
    .orderBy(desc(tables.images.createdAt))
  return rows.map(image => ({ ...image, url: `/api/images/${image.id}/file` }))
})
