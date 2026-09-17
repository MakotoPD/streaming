import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const [sound] = await useDb().select().from(tables.sounds)
    .where(eq(tables.sounds.id, getRouterParam(event, 'id')!))
    .catch(() => [])
  if (!sound) throw createError({ statusCode: 404 })
  const data = await readFile(join(useRuntimeConfig().uploadDir, sound.file)).catch(() => undefined)
  if (!data) throw createError({ statusCode: 404 })
  setHeaders(event, {
    'Content-Type': sound.mime,
    'Cache-Control': 'public, max-age=31536000, immutable',
    'X-Content-Type-Options': 'nosniff'
  })
  return data
})
