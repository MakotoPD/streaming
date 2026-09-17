import { randomUUID } from 'node:crypto'
import { rm, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { and, eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const userId = await requireUserId(event)
  const id = getRouterParam(event, 'id')!
  const [sound] = await useDb().select().from(tables.sounds)
    .where(and(eq(tables.sounds.id, id), eq(tables.sounds.userId, userId)))
    .catch(() => [])
  if (!sound) throw createError({ statusCode: 404 })

  const file = await readUploadedFile(event)
  const extension = validateSound(file)
  const dir = useRuntimeConfig().uploadDir
  const name = `${randomUUID()}.${extension}`
  await writeFile(join(dir, name), file.data)

  await useDb().update(tables.sounds).set({ file: name, mime: file.type!, size: file.data.length }).where(eq(tables.sounds.id, sound.id))
  await rm(join(dir, sound.file), { force: true })
  await reloadUsages(userId, `/api/sounds/${sound.id}/file`)
  return { ok: true }
})
