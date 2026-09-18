import { z } from 'zod'
import { MUSIC_SOURCES } from '#shared/widgets/now-playing'

const query = z.object({
  source: z.enum(MUSIC_SOURCES),
  user: z.string().trim().regex(/^[\w.-]{2,64}$/)
})

const cache = new Map<string, { at: number, track: Track | null }>()

export default defineEventHandler(async (event) => {
  await widgetByToken(event)
  const { source, user } = await getValidatedQuery(event, query.parse)
  const key = `${source}:${user.toLowerCase()}`
  const hit = cache.get(key)
  if (hit && Date.now() - hit.at < 8000) return { track: hit.track }

  let track: Track | null
  if (source === 'lastfm') {
    const apiKey = useRuntimeConfig().lastfmApiKey
    if (!apiKey) throw createError({ statusCode: 503, message: 'lastfm_unavailable' })
    const body = await $fetch('https://ws.audioscrobbler.com/2.0/', {
      query: { method: 'user.getrecenttracks', user, api_key: apiKey, format: 'json', limit: 1 },
      timeout: 8000
    }).catch(() => undefined)
    if (!body) throw createError({ statusCode: 502, message: 'source_failed' })
    track = lastfmTrack(body)
  }
  else {
    const body = await $fetch(`https://api.listenbrainz.org/1/user/${encodeURIComponent(user)}/playing-now`, { timeout: 8000 }).catch(() => undefined)
    if (!body) throw createError({ statusCode: 502, message: 'source_failed' })
    track = listenBrainzTrack(body)
  }

  cache.set(key, { at: Date.now(), track })
  if (cache.size > 500) cache.delete(cache.keys().next().value!)
  return { track }
})
