import { randomUUID } from 'node:crypto'
import { mkdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { count, eq } from 'drizzle-orm'

const MAX_IMAGES = 50

export default defineEventHandler(async (event) => {
  const userId = await requireUserId(event)
  if (!await hasLinkedAccount(userId)) throw createError({ statusCode: 403, message: 'login_required' })

  const [{ total }] = await useDb().select({ total: count() }).from(tables.images).where(eq(tables.images.userId, userId)) as [{ total: number }]
  if (total >= MAX_IMAGES) throw createError({ statusCode: 400, message: 'too_many_images' })

  const form = await readMultipartFormData(event)
  const file = form?.find(part => part.name === 'file' && part.filename)
  if (!file) throw createError({ statusCode: 400, message: 'invalid_type' })
  if (file.data.length > IMAGE_MAX_INPUT) throw createError({ statusCode: 400, message: 'too_large' })

  const image = await processImage(file.data)
  const dir = join(useRuntimeConfig().uploadDir, 'images')
  const name = `${randomUUID()}.${image.extension}`
  await mkdir(dir, { recursive: true })
  await writeFile(join(dir, name), image.data)

  const [row] = await useDb().insert(tables.images).values({
    userId,
    name: (file.filename ?? name).replace(/\.[^.]+$/, '').slice(0, 60),
    file: name,
    mime: image.mime,
    size: image.data.length,
    width: image.width,
    height: image.height,
    animated: image.animated
  }).returning()

  return { id: row!.id, name: row!.name, animated: row!.animated, width: row!.width, height: row!.height, url: `/api/images/${row!.id}/file` }
})
