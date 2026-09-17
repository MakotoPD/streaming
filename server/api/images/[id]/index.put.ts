import { randomUUID } from 'node:crypto'
import { rm, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { and, eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const userId = await requireUserId(event)
  const id = getRouterParam(event, 'id')!
  const [image] = await useDb().select().from(tables.images)
    .where(and(eq(tables.images.id, id), eq(tables.images.userId, userId)))
    .catch(() => [])
  if (!image) throw createError({ statusCode: 404 })

  const file = await readUploadedFile(event)
  if (file.data.length > IMAGE_MAX_INPUT) throw createError({ statusCode: 400, message: 'too_large' })
  const processed = await processImage(file.data)

  const dir = join(useRuntimeConfig().uploadDir, 'images')
  const name = `${randomUUID()}.${processed.extension}`
  await writeFile(join(dir, name), processed.data)

  await useDb().update(tables.images).set({
    file: name,
    mime: processed.mime,
    size: processed.data.length,
    width: processed.width,
    height: processed.height,
    animated: processed.animated
  }).where(eq(tables.images.id, image.id))
  await rm(join(dir, image.file), { force: true })
  await reloadUsages(userId, `/api/images/${image.id}/file`)
  return { ok: true }
})
