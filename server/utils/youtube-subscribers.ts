import { and, eq } from 'drizzle-orm'

interface SubscriberList {
  items?: { subscriberSnippet?: { title?: string, channelId?: string } }[]
}

interface Watch {
  listeners: number
  known?: Set<string>
  timer?: ReturnType<typeof setTimeout>
  idle?: ReturnType<typeof setTimeout>
}

const POLL_MS = 60_000
const watches = new Map<string, Watch>()

async function hasYouTube(userId: string) {
  const rows = await useDb().select({ id: tables.accounts.id }).from(tables.accounts)
    .where(and(eq(tables.accounts.userId, userId), eq(tables.accounts.provider, 'youtube')))
    .limit(1)
  return rows.length > 0
}

async function poll(userId: string, watch: Watch) {
  const list = await youtubeApi<SubscriberList>(userId, '/subscriptions', { part: 'subscriberSnippet', myRecentSubscribers: 'true', maxResults: 20 })
  if (list?.items) {
    const fresh = list.items
      .map(item => item.subscriberSnippet)
      .filter((snippet): snippet is { title?: string, channelId: string } => !!snippet?.channelId)
    if (watch.known) {
      for (const subscriber of fresh.filter(item => !watch.known!.has(item.channelId)).reverse()) {
        publishToUser(userId, { kind: 'event', event: { kind: 'alert', type: 'follow', platform: 'youtube', name: subscriber.title ?? '' } })
      }
    }
    watch.known = new Set([...(watch.known ?? []), ...fresh.map(item => item.channelId)].slice(-500))
  }
  if (watches.get(userId) === watch) watch.timer = setTimeout(() => poll(userId, watch), POLL_MS)
}

export function retainYouTubeSubscribers(userId: string) {
  let watch = watches.get(userId)
  if (watch) {
    clearTimeout(watch.idle)
    watch.listeners++
  }
  else {
    watch = { listeners: 1 }
    watches.set(userId, watch)
    const created = watch
    hasYouTube(userId)
      .then((linked) => {
        if (linked && watches.get(userId) === created) return poll(userId, created)
      })
      .catch(err => console.error('[youtube] subscribers', err))
  }

  const current = watch
  let released = false
  return () => {
    if (released) return
    released = true
    current.listeners--
    if (current.listeners > 0) return
    current.idle = setTimeout(() => {
      if (current.listeners > 0) return
      clearTimeout(current.timer)
      watches.delete(userId)
    }, 60_000)
  }
}
