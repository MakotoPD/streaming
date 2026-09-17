import { randomUUID } from 'node:crypto'
import { mkdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { count, eq } from 'drizzle-orm'

const MAX_SIZE = 3 * 1024 * 1024
const MAX_SOUNDS = 30
const EXTENSIONS: Record<string, string> = {
  'audio/mpeg': 'mp3',
  'audio/mp3': 'mp3',
  'audio/wav': 'wav',
  'audio/x-wav': 'wav',
  'audio/ogg': 'ogg',
  'audio/webm': 'webm',
  'audio/aac': 'aac',
  'audio/mp4': 'm4a',
  'audio/x-m4a': 'm4a'
}

export default defineEventHandler(async (event) => {
  const userId = await requireUserId(event)
  if (!await hasLinkedAccount(userId)) throw createError({ statusCode: 403, message: 'login_required' })

  const [{ total }] = await useDb().select({ total: count() }).from(tables.sounds).where(eq(tables.sounds.userId, userId)) as [{ total: number }]
  if (total >= MAX_SOUNDS) throw createError({ statusCode: 400, message: 'too_many_sounds' })

  const form = await readMultipartFormData(event)
  const file = form?.find(part => part.name === 'file' && part.filename)
  if (!file?.type || !EXTENSIONS[file.type]) throw createError({ statusCode: 400, message: 'invalid_type' })
  if (file.data.length > MAX_SIZE) throw createError({ statusCode: 400, message: 'too_large' })

  const dir = useRuntimeConfig().uploadDir
  const name = `${randomUUID()}.${EXTENSIONS[file.type]}`
  await mkdir(dir, { recursive: true })
  await writeFile(join(dir, name), file.data)

  const [sound] = await useDb().insert(tables.sounds).values({
    userId,
    name: (file.filename ?? name).replace(/\.[^.]+$/, '').slice(0, 60),
    file: name,
    mime: file.type,
    size: file.data.length
  }).returning()

  return { id: sound!.id, name: sound!.name, size: sound!.size, url: `/api/sounds/${sound!.id}/file` }
})
