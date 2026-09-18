import { z } from 'zod'

const query = z.object({
  channel: z.string().trim().min(3).max(120),
  after: z.coerce.number().int().min(0).optional()
})

const hits = new Map<string, number[]>()

export default defineEventHandler(async (event) => {
  const ip = getRequestIP(event, { xForwardedFor: true }) ?? 'unknown'
  const now = Date.now()
  const recent = (hits.get(ip) ?? []).filter(time => now - time < 10_000)
  if (recent.length >= 100) throw createError({ statusCode: 429 })
  hits.set(ip, [...recent, now])
  if (hits.size > 5000) hits.delete(hits.keys().next().value!)

  const { channel, after } = await getValidatedQuery(event, query.parse)
  setHeader(event, 'Cache-Control', 'no-store')
  return youtubeChat(channel, after)
})
