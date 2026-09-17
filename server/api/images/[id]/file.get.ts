import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const [image] = await useDb().select().from(tables.images)
    .where(eq(tables.images.id, getRouterParam(event, 'id')!))
    .catch(() => [])
  if (!image) throw createError({ statusCode: 404 })
  const data = await readFile(join(useRuntimeConfig().uploadDir, 'images', image.file)).catch(() => undefined)
  if (!data) throw createError({ statusCode: 404 })
  return sendCachedFile(event, { name: image.file, mime: image.mime, data })
})
