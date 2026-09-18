import type { StreamEvent } from '#shared/types'
import { youtubeActionsToEvents, youtubeChannelPath, youtubeLiveChatContinuation, youtubeLiveFromPage, youtubeViewersFromPage } from './youtube-parse'

const HEADERS = {
  'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0 Safari/537.36',
  'accept-language': 'en-US,en;q=0.9',
  'cookie': 'CONSENT=YES+1; SOCS=CAI'
}
const MAX_FEEDS = 150
const IDLE_MS = 60_000

interface Feed {
  videoId: string
  clientVersion: string
  continuation: string
  events: { seq: number, event: StreamEvent }[]
  seq: number
  lastAsked: number
  failures: number
  timer?: ReturnType<typeof setTimeout>
}

const lookups = new Map<string, { at: number, videoId: string | null, viewers: number }>()
const feeds = new Map<string, Feed>()
const opening = new Map<string, Promise<Feed | undefined>>()

async function lookup(path: string) {
  const cached = lookups.get(path)
  if (cached && Date.now() - cached.at < (cached.videoId ? 60_000 : 30_000)) return cached
  const html = await fetch(`https://www.youtube.com${path}/live`, { headers: HEADERS, signal: AbortSignal.timeout(10_000) })
    .then(response => (response.ok ? response.text() : ''))
    .catch(() => '')
  const result = { at: Date.now(), videoId: youtubeLiveFromPage(html) ?? null, viewers: youtubeViewersFromPage(html) }
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
    const response = await fetch('https://www.youtube.com/youtubei/v1/live_chat/get_live_chat?prettyPrint=false', {
      method: 'POST',
      headers: { ...HEADERS, 'content-type': 'application/json' },
      body: JSON.stringify({ context: { client: { clientName: 'WEB', clientVersion: feed.clientVersion } }, continuation: feed.continuation }),
      signal: AbortSignal.timeout(10_000)
    })
    const body = await response.json() as any
    const data = body?.continuationContents?.liveChatContinuation
    const next = data?.continuations?.[0]
    const continuation = next?.invalidationContinuationData ?? next?.timedContinuationData ?? next?.reloadContinuationData
    if (!continuation?.continuation) {
      for (const [path, lookup] of lookups) if (lookup.videoId === feed.videoId) lookups.delete(path)
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
  const html = await fetch(`https://www.youtube.com/live_chat?is_popout=1&v=${videoId}`, { headers: HEADERS, signal: AbortSignal.timeout(10_000) })
    .then(response => (response.ok ? response.text() : ''))
    .catch(() => '')
  const clientVersion = html.match(/"INNERTUBE_CLIENT_VERSION":"([^"]+)"/)?.[1]
  const continuation = youtubeLiveChatContinuation(html)
  if (!clientVersion || !continuation) return
  const feed: Feed = { videoId, clientVersion, continuation, events: [], seq: 0, lastAsked: Date.now(), failures: 0 }
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
