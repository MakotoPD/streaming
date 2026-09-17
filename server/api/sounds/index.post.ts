import { randomUUID } from 'node:crypto'
import { mkdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { count, eq } from 'drizzle-orm'

const MAX_SOUNDS = 30

export default defineEventHandler(async (event) => {
  const userId = await requireUserId(event)
  if (!await hasLinkedAccount(userId)) throw createError({ statusCode: 403, message: 'login_required' })

  const [{ total }] = await useDb().select({ total: count() }).from(tables.sounds).where(eq(tables.sounds.userId, userId)) as [{ total: number }]
  if (total >= MAX_SOUNDS) throw createError({ statusCode: 400, message: 'too_many_sounds' })

  const file = await readUploadedFile(event)
  const extension = validateSound(file)

  const dir = useRuntimeConfig().uploadDir
  const name = `${randomUUID()}.${extension}`
  await mkdir(dir, { recursive: true })
  await writeFile(join(dir, name), file.data)

  const [sound] = await useDb().insert(tables.sounds).values({
    userId,
    name: (file.filename ?? name).replace(/\.[^.]+$/, '').slice(0, 60),
    file: name,
    mime: file.type!,
    size: file.data.length
  }).returning()

  return { id: sound!.id, name: sound!.name, size: sound!.size, url: `/api/sounds/${sound!.id}/file` }
})
