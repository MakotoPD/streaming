const cache = new Map<string, { at: number, value: TwitchStats }>()

interface TwitchStats {
  viewers: number | null
  followers: number | null
  subs: number | null
  live: boolean
}

export default defineEventHandler(async (event) => {
  const { widget, channels } = await widgetByToken(event)
  const youtube = channels.youtube?.handle ? await youtubeLive(channels.youtube.handle).catch(() => null) : null
  const twitch = channels.twitch
  if (!twitch?.login) return { twitch: null, youtube }

  const cached = cache.get(widget.userId)
  if (cached && Date.now() - cached.at < 30_000) return { twitch: cached.value, youtube }

  const [stream, followers, subs] = await Promise.all([
    helix<{ data: { viewer_count: number }[] }>(`/streams?user_login=${twitch.login}`).catch(() => undefined),
    twitch.id ? userHelix<{ total: number }>(widget.userId, `/channels/followers?broadcaster_id=${twitch.id}&first=1`) : undefined,
    twitch.id ? userHelix<{ total: number }>(widget.userId, `/subscriptions?broadcaster_id=${twitch.id}&first=1`) : undefined
  ])

  const value: TwitchStats = {
    viewers: stream ? stream.data[0]?.viewer_count ?? 0 : null,
    followers: followers?.total ?? null,
    subs: subs?.total ?? null,
    live: !!stream?.data.length
  }
  cache.set(widget.userId, { at: Date.now(), value })
  return { twitch: value, youtube }
})
