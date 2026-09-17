import { rm } from 'node:fs/promises'
import { join } from 'node:path'
import { and, eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const userId = await requireUserId(event)
  const [sound] = await useDb().delete(tables.sounds)
    .where(and(eq(tables.sounds.id, getRouterParam(event, 'id')!), eq(tables.sounds.userId, userId)))
    .returning()
    .catch(() => [])
  if (sound) await clearUsages(userId, `/api/sounds/${sound.id}/file`)
  if (sound) await rm(join(useRuntimeConfig().uploadDir, sound.file), { force: true })
  return { ok: true }
})
