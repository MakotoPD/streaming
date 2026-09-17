import { rm } from 'node:fs/promises'
import { join } from 'node:path'
import { eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const userId = await requireUserId(event)
  const db = useDb()
  const uploadDir = useRuntimeConfig().uploadDir

  const [sounds, images] = await Promise.all([
    db.select({ file: tables.sounds.file }).from(tables.sounds).where(eq(tables.sounds.userId, userId)),
    db.select({ file: tables.images.file }).from(tables.images).where(eq(tables.images.userId, userId))
  ])

  publishToUser(userId, { kind: 'reload' })
  await db.delete(tables.users).where(eq(tables.users.id, userId))

  for (const sound of sounds) await rm(join(uploadDir, sound.file), { force: true })
  for (const image of images) await rm(join(uploadDir, 'images', image.file), { force: true })

  await clearUserSession(event)
  return { ok: true }
})
