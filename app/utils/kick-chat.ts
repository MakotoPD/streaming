import type { Badge, ChatPart, StreamEvent } from '#shared/types'

export interface KickChannel {
  channelId: number
  chatroomId: number
  userId: number
  subBadges: { months: number, src: string }[]
}

const PUSHER_URL = 'wss://ws-us2.pusher.com/app/32cbd69e4b950bf97679?protocol=7&client=js&version=8.4.0&flash=false'

const BADGES: Record<string, Badge> = {
  broadcaster: { icon: 'i-lucide-video', color: '#53fc18' },
  moderator: { icon: 'i-lucide-sword', color: '#00c7ff' },
  vip: { icon: 'i-lucide-gem', color: '#ff00b8' },
  og: { icon: 'i-lucide-crown', color: '#ffb800' },
  founder: { icon: 'i-lucide-medal', color: '#ffb800' },
  verified: { icon: 'i-lucide-badge-check', color: '#53fc18' },
  sub_gifter: { icon: 'i-lucide-gift', color: '#2ce2c9' }
}

export async function fetchKickChannel(slug: string): Promise<KickChannel> {
  const channel = await $fetch<any>(`https://kick.com/api/v2/channels/${encodeURIComponent(slug)}`)
  return {
    channelId: channel.id,
    chatroomId: channel.chatroom.id,
    userId: channel.user_id,
    subBadges: (channel.subscriber_badges ?? []).map((b: any) => ({ months: b.months, src: b.badge_image?.src }))
  }
}

export function kickParts(content: string): ChatPart[] {
  const parts: ChatPart[] = []
  let cursor = 0
  for (const m of content.matchAll(/\[emote:(\d+):([^\]]*)\]/g)) {
    if (m.index > cursor) parts.push({ type: 'text', text: content.slice(cursor, m.index) })
    parts.push({ type: 'emote', name: m[2]!, url: `https://files.kick.com/emotes/${m[1]}/fullsize` })
    cursor = m.index + m[0].length
  }
  if (cursor < content.length) parts.push({ type: 'text', text: content.slice(cursor) })
  return parts
}

function badges(list: { type: string, count?: number }[] | undefined, channel: KickChannel): Badge[] {
  return (list ?? []).map((b) => {
    if (b.type !== 'subscriber') return BADGES[b.type]
    const badge = channel.subBadges.filter(s => s.months <= (b.count ?? 1)).sort((x, y) => y.months - x.months)[0]
    return badge ? { url: badge.src } : { icon: 'i-lucide-star', color: '#53fc18' }
  }).filter((b): b is Badge => !!b)
}

export function kickToEvents(eventName: string, data: any, channel: KickChannel): StreamEvent[] {
  switch (eventName) {
    case 'App\\Events\\ChatMessageEvent': {
      const text = String(data.content ?? '').replace(/\[emote:\d+:([^\]]*)\]/g, '$1')
      return [{
        kind: 'chat',
        id: String(data.id),
        platform: 'kick',
        userId: String(data.sender?.id ?? ''),
        name: data.sender?.username ?? '',
        color: data.sender?.identity?.color || undefined,
        badges: badges(data.sender?.identity?.badges, channel),
        parts: kickParts(String(data.content ?? '')),
        text
      }]
    }
    case 'App\\Events\\MessageDeletedEvent':
      return [{ kind: 'delete', platform: 'kick', id: String(data.message?.id) }]
    case 'App\\Events\\UserBannedEvent':
      return [{ kind: 'clear', platform: 'kick', userId: String(data.user?.id) }]
    case 'App\\Events\\ChatroomClearEvent':
      return [{ kind: 'clear', platform: 'kick' }]
    case 'App\\Events\\SubscriptionEvent':
      return [{ kind: 'alert', type: 'sub', platform: 'kick', name: data.username ?? '', months: Number(data.months) || 1 }]
    case 'App\\Events\\GiftedSubscriptionsEvent':
      return [{ kind: 'alert', type: 'gifts', platform: 'kick', name: data.gifter_username ?? '', count: data.gifted_usernames?.length || 1 }]
    case 'App\\Events\\StreamHostEvent':
      return [{ kind: 'alert', type: 'raid', platform: 'kick', name: data.host_username ?? '', count: Number(data.number_viewers) || 0 }]
    case 'App\\Events\\FollowersUpdated':
      return data.followed && data.username ? [{ kind: 'alert', type: 'follow', platform: 'kick', name: data.username }] : []
  }
  return []
}

export function connectKick(channel: KickChannel, onEvent: (event: StreamEvent) => void) {
  let ws: WebSocket | undefined
  let closed = false
  let retry = 1000

  const open = () => {
    ws = new WebSocket(PUSHER_URL)
    ws.onmessage = (e) => {
      const msg = JSON.parse(String(e.data))
      if (msg.event === 'pusher:connection_established') {
        retry = 1000
        for (const name of [`chatrooms.${channel.chatroomId}.v2`, `channel.${channel.channelId}`]) {
          ws!.send(JSON.stringify({ event: 'pusher:subscribe', data: { auth: '', channel: name } }))
        }
      }
      else if (msg.event === 'pusher:ping') {
        ws!.send(JSON.stringify({ event: 'pusher:pong', data: {} }))
      }
      else if (typeof msg.data === 'string' && msg.event.startsWith('App\\')) {
        for (const event of kickToEvents(msg.event, JSON.parse(msg.data), channel)) onEvent(event)
      }
    }
    ws.onclose = () => {
      if (closed) return
      setTimeout(open, retry)
      retry = Math.min(retry * 2, 30000)
    }
  }
  open()

  return {
    close() {
      closed = true
      ws?.close()
    }
  }
}
