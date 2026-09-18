import { createHash } from 'node:crypto'
import { z } from 'zod'
import { PIPER_VOICES } from '#shared/widgets'

const body = z.object({
  text: z.string().trim().min(1).max(400),
  voice: z.enum(PIPER_VOICES),
  speed: z.number().min(0.5).max(2).default(1)
})

const cache = new Map<string, Buffer>()
const usage = new Map<string, number[]>()
const CACHE_SIZE = 60
const PER_MINUTE = 30

export default defineEventHandler(async (event) => {
  const { widget } = await widgetByToken(event)
  const piperUrl = useRuntimeConfig().piperUrl
  if (!piperUrl) throw createError({ statusCode: 503, message: 'tts_unavailable' })

  const input = await readValidatedBody(event, body.parse)
  const key = createHash('sha256').update(`${input.voice}|${input.speed}|${input.text}`).digest('hex')
  let audio = cache.get(key)

  if (!audio) {
    const now = Date.now()
    const recent = (usage.get(widget.id) ?? []).filter(time => now - time < 60_000)
    if (recent.length >= PER_MINUTE) throw createError({ statusCode: 429, message: 'tts_rate_limited' })
    usage.set(widget.id, [...recent, now])

    const response = await fetch(`${piperUrl.replace(/\/$/, '')}/synthesize`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ text: input.text, voice: input.voice, length_scale: Math.round((1 / input.speed) * 100) / 100 }),
      signal: AbortSignal.timeout(20_000)
    }).catch(() => undefined)
    if (!response?.ok) throw createError({ statusCode: 502, message: 'tts_failed' })

    audio = Buffer.from(await response.arrayBuffer())
    if (audio.subarray(0, 4).toString('latin1') !== 'RIFF') throw createError({ statusCode: 502, message: 'tts_failed' })
    cache.set(key, audio)
    if (cache.size > CACHE_SIZE) cache.delete(cache.keys().next().value!)
  }

  setHeaders(event, {
    'Content-Type': 'audio/wav',
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff'
  })
  return audio
})
