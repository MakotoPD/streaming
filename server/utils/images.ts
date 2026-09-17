import { randomUUID } from 'node:crypto'
import { mkdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { count, eq } from 'drizzle-orm'
import type { H3Event } from 'h3'
import sharp from 'sharp'

export const IMAGE_MAX_INPUT = 10 * 1024 * 1024
export const VIDEO_MAX_INPUT = 25 * 1024 * 1024
export const IMAGE_MAX_SIDE = 1024
export const MAX_MEDIA_FILES = 50
const MAX_FRAMES = 500
const ALLOWED_FORMATS = new Set(['png', 'webp', 'gif'])

export interface ProcessedMedia {
  data: Buffer
  mime: string
  extension: string
  width: number
  height: number
  animated: boolean
}

export function videoFormat(input: Buffer) {
  if (input.length > 8 && input.readUInt32BE(0) === 0x1A45DFA3) return { mime: 'video/webm', extension: 'webm' }
  if (input.length > 12 && input.toString('latin1', 4, 8) === 'ftyp') return { mime: 'video/mp4', extension: 'mp4' }
}

export async function processImage(input: Buffer): Promise<ProcessedMedia> {
  const metadata = await sharp(input, { animated: true, limitInputPixels: 4096 * 4096 }).metadata().catch(() => undefined)
  if (!metadata?.format || !ALLOWED_FORMATS.has(metadata.format)) throw createError({ statusCode: 400, message: 'invalid_type' })

  const frames = metadata.pages ?? 1
  if (frames > MAX_FRAMES) throw createError({ statusCode: 400, message: 'too_many_frames' })

  const animated = frames > 1
  const pipeline = sharp(input, { animated, limitInputPixels: 4096 * 4096 })
    .resize({ width: IMAGE_MAX_SIDE, height: IMAGE_MAX_SIDE, fit: 'inside', withoutEnlargement: true })

  const keepPng = metadata.format === 'png' && !animated
  const { data, info } = keepPng
    ? await pipeline.png({ compressionLevel: 9 }).toBuffer({ resolveWithObject: true })
    : await pipeline.webp({ quality: 90, effort: 4, loop: 0 }).toBuffer({ resolveWithObject: true })

  return {
    data,
    mime: keepPng ? 'image/png' : 'image/webp',
    extension: keepPng ? 'png' : 'webp',
    width: info.width,
    height: animated ? info.height / frames : info.height,
    animated
  }
}

export async function processMedia(input: Buffer, allowVideo: boolean): Promise<ProcessedMedia> {
  const video = allowVideo ? videoFormat(input) : undefined
  if (!video) {
    if (input.length > IMAGE_MAX_INPUT) throw createError({ statusCode: 400, message: 'too_large' })
    return processImage(input)
  }
  if (input.length > VIDEO_MAX_INPUT) throw createError({ statusCode: 400, message: 'video_too_large' })
  return { data: input, mime: video.mime, extension: video.extension, width: 0, height: 0, animated: true }
}

export async function storeMedia(event: H3Event, userId: string, options: { video?: boolean, canvas?: boolean } = {}) {
  if (!await hasLinkedAccount(userId)) throw createError({ statusCode: 403, message: 'login_required' })

  const [{ total }] = await useDb().select({ total: count() }).from(tables.images).where(eq(tables.images.userId, userId)) as [{ total: number }]
  if (total >= MAX_MEDIA_FILES) throw createError({ statusCode: 400, message: 'too_many_images' })

  const file = await readUploadedFile(event)
  const media = await processMedia(file.data, options.video === true)
  const dir = join(useRuntimeConfig().uploadDir, 'images')
  const name = `${randomUUID()}.${media.extension}`
  await mkdir(dir, { recursive: true })
  await writeFile(join(dir, name), media.data)

  const [row] = await useDb().insert(tables.images).values({
    userId,
    name: (file.filename ?? name).replace(/\.[^.]+$/, '').slice(0, 60),
    file: name,
    mime: media.mime,
    size: media.data.length,
    width: media.width,
    height: media.height,
    animated: media.animated,
    canvas: options.canvas === true
  }).returning()

  return {
    id: row!.id,
    name: row!.name,
    animated: row!.animated,
    width: row!.width,
    height: row!.height,
    video: media.mime.startsWith('video/'),
    url: `/api/images/${row!.id}/file`
  }
}
