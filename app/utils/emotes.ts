import type { ChatPart } from '#shared/types'

export interface Emote {
  url: string
  zeroWidth: boolean
}

const BTTV_ZERO_WIDTH = new Set(['SoSnowy', 'IceCold', 'SantaHat', 'TopHat', 'ReinDeer', 'CandyCane', 'cvMask', 'cvHazmat'])
const SEVENTV_ZERO_WIDTH_FLAG = 1 << 8

async function json(url: string): Promise<any> {
  try {
    const res = await fetch(url)
    return res.ok ? await res.json() : undefined
  }
  catch {
    return undefined
  }
}

function sevenTvSet(set: any): [string, Emote][] {
  return (set?.emotes ?? []).map((e: any) => [e.name, {
    url: `https:${e.data.host.url}/2x.webp`,
    zeroWidth: ((e.data.flags ?? 0) & SEVENTV_ZERO_WIDTH_FLAG) !== 0
  }])
}

function bttvList(list: any[] | undefined): [string, Emote][] {
  return (list ?? []).map(e => [e.code, { url: `https://cdn.betterttv.net/emote/${e.id}/2x.webp`, zeroWidth: BTTV_ZERO_WIDTH.has(e.code) }])
}

function ffzList(list: any[] | undefined): [string, Emote][] {
  return (list ?? []).map(e => [e.code, { url: e.images['2x'] ?? e.images['1x'], zeroWidth: false }])
}

export function expandParts(parts: ChatPart[], lookup: (name: string) => Emote | undefined): ChatPart[] {
  const out: ChatPart[] = []
  const pushText = (text: string) => {
    const last = out.at(-1)
    if (last?.type === 'text') last.text += text
    else out.push({ type: 'text', text })
  }
  for (const part of parts) {
    if (part.type === 'emote') {
      out.push({ ...part })
      continue
    }
    for (const word of part.text.split(/(\s+)/)) {
      const emote = word.trim() ? lookup(word) : undefined
      if (!emote) {
        pushText(word)
        continue
      }
      const previous = out.findLast(p => p.type === 'emote' || p.text.trim()) as ChatPart | undefined
      if (emote.zeroWidth && previous?.type === 'emote') {
        previous.layers = [...(previous.layers ?? []), emote.url]
        if (out.at(-1)?.type === 'text' && !(out.at(-1) as { text: string }).text.trim()) out.pop()
        continue
      }
      out.push({ type: 'emote', name: word, url: emote.url })
    }
  }
  return out
}

export function createEmoteStore() {
  const layers = { ffz: new Map<string, Emote>(), bttv: new Map<string, Emote>(), seventv: new Map<string, Emote>() }
  let merged = new Map<string, Emote>()
  let eventSocket: WebSocket | undefined
  let loadSeq = 0
  let closed = false

  const rebuild = () => {
    merged = new Map([...layers.ffz, ...layers.bttv, ...layers.seventv])
  }

  async function load(ids: { twitchId?: string, kickUserId?: number }) {
    const { twitchId, kickUserId } = ids
    const seq = ++loadSeq
    const [stvGlobal, stvTwitch, stvKick, bttvGlobal, bttvUser, ffzGlobal, ffzUser] = await Promise.all([
      json('https://7tv.io/v3/emote-sets/global'),
      twitchId ? json(`https://7tv.io/v3/users/twitch/${twitchId}`) : undefined,
      kickUserId ? json(`https://7tv.io/v3/users/kick/${kickUserId}`) : undefined,
      json('https://api.betterttv.net/3/cached/emotes/global'),
      twitchId ? json(`https://api.betterttv.net/3/cached/users/twitch/${twitchId}`) : undefined,
      json('https://api.betterttv.net/3/cached/frankerfacez/emotes/global'),
      twitchId ? json(`https://api.betterttv.net/3/cached/frankerfacez/users/twitch/${twitchId}`) : undefined
    ])
    if (seq !== loadSeq || closed) return

    layers.seventv = new Map([...sevenTvSet(stvGlobal), ...sevenTvSet(stvKick?.emote_set), ...sevenTvSet(stvTwitch?.emote_set)])
    layers.bttv = new Map([...bttvList(bttvGlobal), ...bttvList(bttvUser?.sharedEmotes), ...bttvList(bttvUser?.channelEmotes)])
    layers.ffz = new Map([...ffzList(ffzGlobal), ...ffzList(ffzUser)])
    rebuild()

    const setIds = [stvTwitch?.emote_set?.id, stvKick?.emote_set?.id].filter(Boolean) as string[]
    watchSevenTv(setIds, ids)
  }

  function watchSevenTv(setIds: string[], ids: { twitchId?: string, kickUserId?: number }) {
    const previous = eventSocket
    eventSocket = undefined
    previous?.close()
    if (!setIds.length || closed) return
    let timer: ReturnType<typeof setTimeout> | undefined
    const ws = new WebSocket('wss://events.7tv.io/v3')
    eventSocket = ws
    ws.onmessage = (e) => {
      const msg = JSON.parse(String(e.data))
      if (msg.op === 1) {
        for (const id of setIds) ws.send(JSON.stringify({ op: 35, d: { type: 'emote_set.update', condition: { object_id: id } } }))
      }
      else if (msg.op === 0) {
        clearTimeout(timer)
        timer = setTimeout(() => load(ids), 1000)
      }
    }
    ws.onclose = () => {
      if (eventSocket === ws) setTimeout(() => eventSocket === ws && watchSevenTv(setIds, ids), 15000)
    }
  }

  return {
    load,
    lookup: (name: string) => merged.get(name),
    expand: (parts: ChatPart[]) => expandParts(parts, name => merged.get(name)),
    close: () => {
      closed = true
      const ws = eventSocket
      eventSocket = undefined
      ws?.close()
    }
  }
}
