import { desc, eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const userId = await requireUserId(event)
  await sweepCanvasMedia(userId)
  const db = useDb()
  const [widgets, sounds, images] = await Promise.all([
    userWidgets(userId),
    db.select().from(tables.sounds).where(eq(tables.sounds.userId, userId)).orderBy(desc(tables.sounds.createdAt)),
    db.select().from(tables.images).where(eq(tables.images.userId, userId)).orderBy(desc(tables.images.createdAt))
  ])

  return {
    sounds: sounds.map((sound) => {
      const url = `/api/sounds/${sound.id}/file`
      return { id: sound.id, name: sound.name, size: sound.size, mime: sound.mime, createdAt: sound.createdAt, url, usages: usagesOf(widgets, url) }
    }),
    images: images.map((image) => {
      const url = `/api/images/${image.id}/file`
      return { id: image.id, name: image.name, size: image.size, mime: image.mime, width: image.width, height: image.height, animated: image.animated, createdAt: image.createdAt, url, usages: usagesOf(widgets, url) }
    })
  }
})
