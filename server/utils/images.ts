import sharp from 'sharp'

export const IMAGE_MAX_INPUT = 10 * 1024 * 1024
export const IMAGE_MAX_SIDE = 1024
const MAX_FRAMES = 500
const ALLOWED_FORMATS = new Set(['png', 'webp', 'gif'])

export interface ProcessedImage {
  data: Buffer
  mime: 'image/png' | 'image/webp'
  extension: 'png' | 'webp'
  width: number
  height: number
  animated: boolean
}

export async function processImage(input: Buffer): Promise<ProcessedImage> {
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
