import { rm } from 'node:fs/promises'
import { join } from 'node:path'
import { and, eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const userId = await requireUserId(event)
  const [image] = await useDb().delete(tables.images)
    .where(and(eq(tables.images.id, getRouterParam(event, 'id')!), eq(tables.images.userId, userId)))
    .returning()
    .catch(() => [])
  if (image) await clearUsages(userId, `/api/images/${image.id}/file`)
  if (image) await rm(join(useRuntimeConfig().uploadDir, 'images', image.file), { force: true })
  return { ok: true }
})
