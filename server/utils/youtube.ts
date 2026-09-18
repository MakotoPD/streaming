import { and, eq, or } from 'drizzle-orm'
import type { StreamEvent } from '#shared/types'
import { youtubeActionsToEvents, youtubeChannelPath, youtubeLiveChatContinuation, youtubeLiveFromPage, youtubeViewersFromPage, youtubeWatchInfo } from './youtube-parse'

const HEADERS = {
  'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0 Safari/537.36',
  'accept-language': 'en-US,en;q=0.9',
  'cookie': 'CONSENT=YES+1; SOCS=CAI'
}
const MAX_FEEDS = 150
const IDLE_MS = 60_000

let clientVersion = '2.20260917.01.00'

interface Found {
  videoId: string
  viewers: number
}

interface Lookup {
  at: number
  videoId: string | null
  viewers: number
}

interface Feed {
  videoId: string
  continuation: string
  events: { seq: number, event: StreamEvent }[]
  seq: number
  lastAsked: number
  failures: number
  timer?: ReturnType<typeof setTimeout>
}

const lookups = new Map<string, Lookup>()
const feeds = new Map<string, Feed>()
const opening = new Map<string, Promise<Feed | undefined>>()
const warned = new Map<string, number>()

async function innertube(endpoint: string, body: object) {
  const response = await fetch(`https://www.youtube.com/youtubei/v1/${endpoint}?prettyPrint=false`, {
    method: 'POST',
    headers: { ...HEADERS, 'content-type': 'application/json' },
    body: JSON.stringify({ context: { client: { clientName: 'WEB', clientVersion, hl: 'en', gl: 'US' } }, ...body }),
    signal: AbortSignal.timeout(10_000)
  })
  const data = await response.json() as any
  const version = (data?.responseContext?.serviceTrackingParams ?? [])
    .flatMap((service: any) => service.params ?? [])
    .find((param: any) => param.key === 'cver')?.value
  if (typeof version === 'string' && /^2\.\d{8}/.test(version)) clientVersion = version
  return data
}

async function watchInfo(videoId: string) {
  return youtubeWatchInfo(await innertube('next', { videoId }).catch(() => undefined))
}

async function viaInnertube(path: string): Promise<Found | 'offline' | undefined> {
  const resolved = await innertube('navigation/resolve_url', { url: `https://www.youtube.com${path}/live` }).catch(() => undefined)
  if (!resolved?.endpoint) return undefined
  const videoId = resolved.endpoint.watchEndpoint?.videoId
  if (typeof videoId !== 'string') return 'offline'
  const info = await watchInfo(videoId)
  return info ? { videoId, ...info } : 'offline'
}

async function viaOfficialApi(path: string): Promise<Found | 'offline' | undefined> {
  const key = path.startsWith('/channel/') ? path.slice('/channel/'.length) : path.slice(1)
  const [account] = await useDb().select({ userId: tables.accounts.userId }).from(tables.accounts)
    .where(and(eq(tables.accounts.provider, 'youtube'), or(eq(tables.accounts.providerId, key), eq(tables.accounts.login, key))))
    .limit(1)
  if (!account) return undefined
  const list = await youtubeApi<{ items?: { id: string }[] }>(account.userId, '/liveBroadcasts', { part: 'id', broadcastStatus: 'active', broadcastType: 'all', mine: 'true' })
  if (!list) return undefined
  const videoId = list.items?.[0]?.id
  if (!videoId) return 'offline'
  const info = await watchInfo(videoId)
  return { videoId, viewers: info?.viewers ?? 0 }
}

async function viaPage(path: string): Promise<Found | undefined> {
  const html = await fetch(`https://www.youtube.com${path}/live`, { headers: HEADERS, signal: AbortSignal.timeout(10_000) })
    .then(response => (response.ok ? response.text() : ''))
    .catch(() => '')
  const videoId = youtubeLiveFromPage(html)
  return videoId ? { videoId, viewers: youtubeViewersFromPage(html) } : undefined
}

async function find(path: string): Promise<Found | undefined> {
  const innertubeResult = await viaInnertube(path)
  if (typeof innertubeResult === 'object') return innertubeResult
  const officialResult = await viaOfficialApi(path)
  if (typeof officialResult === 'object') return officialResult
  if (innertubeResult === 'offline' || officialResult === 'offline') return undefined
  const pageResult = await viaPage(path)
  if (!pageResult && Date.now() - (warned.get(path) ?? 0) > 600_000) {
    warned.set(path, Date.now())
    console.warn(`[youtube] could not check ${path}: innertube, the official API and the channel page all failed`)
  }
  return pageResult
}

async function lookup(path: string): Promise<Lookup> {
  const cached = lookups.get(path)
  if (cached && Date.now() - cached.at < (cached.videoId ? 60_000 : 30_000)) return cached
  const found = await find(path)
  const result: Lookup = found ? { at: Date.now(), ...found } : { at: Date.now(), videoId: null, viewers: 0 }
  lookups.set(path, result)
  if (lookups.size > 2000) lookups.delete(lookups.keys().next().value!)
  return result
}

export async function youtubeLive(channel: string) {
  const path = youtubeChannelPath(channel)
  if (!path) return null
  const result = await lookup(path)
  return { live: !!result.videoId, viewers: result.videoId ? result.viewers : 0 }
}

function closeFeed(feed: Feed) {
  clearTimeout(feed.timer)
  feeds.delete(feed.videoId)
}

async function poll(feed: Feed) {
  if (Date.now() - feed.lastAsked > IDLE_MS) return closeFeed(feed)
  let wait = 3000
  try {
    const body = await innertube('live_chat/get_live_chat', { continuation: feed.continuation })
    const data = body?.continuationContents?.liveChatContinuation
    const next = data?.continuations?.[0]
    const continuation = next?.invalidationContinuationData ?? next?.timedContinuationData ?? next?.reloadContinuationData
    if (!continuation?.continuation) {
      for (const [path, entry] of lookups) if (entry.videoId === feed.videoId) lookups.delete(path)
      return closeFeed(feed)
    }
    feed.continuation = continuation.continuation
    feed.failures = 0
    for (const event of youtubeActionsToEvents(data.actions)) feed.events.push({ seq: ++feed.seq, event })
    if (feed.events.length > 300) feed.events = feed.events.slice(-300)
    wait = Math.min(4000, Math.max(1500, Number(continuation.timeoutMs) || 3000))
  }
  catch {
    if (++feed.failures >= 5) return closeFeed(feed)
    wait = 2000 * feed.failures
  }
  feed.timer = setTimeout(() => poll(feed), wait)
}

async function openFeed(videoId: string) {
  if (feeds.size >= MAX_FEEDS) return
  const response = await fetch(`https://www.youtube.com/live_chat?is_popout=1&v=${videoId}`, { headers: HEADERS, signal: AbortSignal.timeout(10_000) }).catch(() => undefined)
  const html = response?.ok ? await response.text() : ''
  const continuation = youtubeLiveChatContinuation(html)
  if (!continuation) {
    console.warn(`[youtube] no live chat for ${videoId}: HTTP ${response?.status ?? 'error'}, ${response?.url ?? ''}, ${html.length} bytes${/not a bot|consent\.youtube/.test(html + (response?.url ?? '')) ? ', blocked by YouTube' : ''}`)
    return
  }
  const feed: Feed = { videoId, continuation, events: [], seq: 0, lastAsked: Date.now(), failures: 0 }
  feeds.set(videoId, feed)
  feed.timer = setTimeout(() => poll(feed), 500)
  return feed
}

export async function youtubeChat(channel: string, after: number | undefined) {
  const path = youtubeChannelPath(channel)
  if (!path) throw createError({ statusCode: 400, message: 'invalid_channel' })
  const { videoId } = await lookup(path)
  if (!videoId) return { live: false, videoId: null, seq: 0, events: [] as StreamEvent[] }

  let feed = feeds.get(videoId)
  if (!feed) {
    let pending = opening.get(videoId)
    if (!pending) {
      pending = openFeed(videoId).finally(() => opening.delete(videoId))
      opening.set(videoId, pending)
    }
    feed = await pending
  }
  if (!feed) return { live: false, videoId, seq: 0, events: [] as StreamEvent[] }

  feed.lastAsked = Date.now()
  if (after === undefined || after > feed.seq) return { live: true, videoId, seq: feed.seq, events: [] as StreamEvent[] }
  return { live: true, videoId, seq: feed.seq, events: feed.events.filter(item => item.seq > after).map(item => item.event) }
}
