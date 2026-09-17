import type { ChatPart, StreamEvent } from '#shared/types'

export interface IrcMessage {
  tags: Record<string, string>
  prefix: string
  command: string
  params: string[]
  trailing: string
}

const TAG_ESCAPES: Record<string, string> = { 's': ' ', ':': ';', '\\': '\\', 'r': '\r', 'n': '\n' }

export function parseIrc(line: string): IrcMessage {
  const tags: Record<string, string> = {}
  let rest = line
  if (rest.startsWith('@')) {
    const end = rest.indexOf(' ')
    for (const pair of rest.slice(1, end).split(';')) {
      const eq = pair.indexOf('=')
      const value = eq < 0 ? '' : pair.slice(eq + 1)
      tags[eq < 0 ? pair : pair.slice(0, eq)] = value.replace(/\\(.)/g, (_, c: string) => TAG_ESCAPES[c] ?? c)
    }
    rest = rest.slice(end + 1)
  }
  let prefix = ''
  if (rest.startsWith(':')) {
    const end = rest.indexOf(' ')
    prefix = rest.slice(1, end)
    rest = rest.slice(end + 1)
  }
  const t = rest.indexOf(' :')
  const trailing = t >= 0 ? rest.slice(t + 2) : ''
  const params = (t >= 0 ? rest.slice(0, t) : rest).split(' ').filter(Boolean)
  return { tags, prefix, command: params[0] ?? '', params: params.slice(1), trailing }
}

export function twitchParts(text: string, emotesTag: string | undefined): ChatPart[] {
  if (!emotesTag) return [{ type: 'text', text }]
  const ranges: [number, number, string][] = []
  for (const entry of emotesTag.split('/')) {
    const [id, positions] = entry.split(':')
    for (const range of positions?.split(',') ?? []) {
      const [a, b] = range.split('-').map(Number)
      ranges.push([a!, b!, id!])
    }
  }
  ranges.sort((x, y) => x[0] - y[0])

  const chars = Array.from(text)
  const parts: ChatPart[] = []
  let cursor = 0
  for (const [start, end, id] of ranges) {
    if (start > cursor) parts.push({ type: 'text', text: chars.slice(cursor, start).join('') })
    const name = chars.slice(start, end + 1).join('')
    parts.push({ type: 'emote', name, url: `https://static-cdn.jtvnw.net/emoticons/v2/${id}/default/dark/2.0` })
    cursor = end + 1
  }
  if (cursor < chars.length) parts.push({ type: 'text', text: chars.slice(cursor).join('') })
  return parts
}

const TIERS: Record<string, number> = { 1000: 1, 2000: 2, 3000: 3, Prime: 1 }

export function ircToEvents(msg: IrcMessage, badgeUrl: (key: string) => string | undefined): StreamEvent[] {
  const { tags } = msg
  const name = tags['display-name'] || tags.login || ''

  switch (msg.command) {
    case 'PRIVMSG': {
      let text = msg.trailing
      const action = text.startsWith('ACTION ') && text.endsWith('')
      if (action) text = text.slice(8, -1)
      const events: StreamEvent[] = [{
        kind: 'chat',
        id: tags.id ?? crypto.randomUUID(),
        platform: 'twitch',
        userId: tags['user-id'] ?? '',
        name,
        color: tags.color || undefined,
        badges: (tags.badges ?? '').split(',').filter(Boolean).map(key => ({ url: badgeUrl(key) })).filter(b => b.url),
        parts: twitchParts(text, tags.emotes),
        text
      }]
      if (Number(tags.bits) > 0) {
        events.push({ kind: 'alert', type: 'bits', platform: 'twitch', name, count: Number(tags.bits) })
      }
      return events
    }
    case 'USERNOTICE': {
      const tier = TIERS[tags['msg-param-sub-plan'] ?? ''] ?? 1
      const anonymous = tags.login === 'ananonymousgifter'
      switch (tags['msg-id']) {
        case 'sub':
        case 'resub':
          return [{ kind: 'alert', type: 'sub', platform: 'twitch', name, tier, months: Number(tags['msg-param-cumulative-months']) || 1 }]
        case 'subgift':
          if (tags['msg-param-community-gift-id']) return []
          return [{ kind: 'alert', type: 'gifts', platform: 'twitch', name, anonymous, tier, count: 1 }]
        case 'submysterygift':
          return [{ kind: 'alert', type: 'gifts', platform: 'twitch', name, anonymous, tier, count: Number(tags['msg-param-mass-gift-count']) || 1 }]
        case 'raid':
          return [{ kind: 'alert', type: 'raid', platform: 'twitch', name: tags['msg-param-displayName'] || name, count: Number(tags['msg-param-viewerCount']) || 0 }]
      }
      return []
    }
    case 'CLEARMSG':
      return tags['target-msg-id'] ? [{ kind: 'delete', platform: 'twitch', id: tags['target-msg-id'] }] : []
    case 'CLEARCHAT':
      return [{ kind: 'clear', platform: 'twitch', userId: msg.trailing ? tags['target-user-id'] : undefined }]
  }
  return []
}

export interface TwitchConnection {
  close: () => void
}

export function connectTwitch(login: string, handlers: {
  onRoom: (roomId: string) => void
  onMessage: (msg: IrcMessage) => void
}): TwitchConnection {
  let ws: WebSocket | undefined
  let closed = false
  let retry = 1000

  const open = () => {
    ws = new WebSocket('wss://irc-ws.chat.twitch.tv:443')
    ws.onopen = () => {
      retry = 1000
      ws!.send('CAP REQ :twitch.tv/tags twitch.tv/commands')
      ws!.send('PASS SCHMOOPIIE')
      ws!.send(`NICK justinfan${Math.floor(Math.random() * 80000 + 1000)}`)
      ws!.send(`JOIN #${login.toLowerCase()}`)
    }
    ws.onmessage = (e) => {
      for (const line of String(e.data).split('\r\n')) {
        if (!line) continue
        const msg = parseIrc(line)
        if (msg.command === 'PING') ws!.send(`PONG :${msg.trailing}`)
        else if (msg.command === 'RECONNECT') ws!.close()
        else if (msg.command === 'ROOMSTATE' && msg.tags['room-id']) handlers.onRoom(msg.tags['room-id'])
        else handlers.onMessage(msg)
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
