import type { Badge, ChatMessage, ChatPart, ChatRole, StreamEvent } from '../../shared/types'

const SYMBOLS: [string, string][] = [
  ['R$', 'BRL'], ['CA$', 'CAD'], ['A$', 'AUD'], ['NZ$', 'NZD'], ['MX$', 'MXN'], ['HK$', 'HKD'],
  ['zł', 'PLN'], ['€', 'EUR'], ['£', 'GBP'], ['₽', 'RUB'], ['¥', 'JPY'], ['₹', 'INR'], ['₩', 'KRW'], ['₴', 'UAH'], ['₺', 'TRY'], ['$', 'USD']
]

export function parseAmount(text: string): { amount: number, currency: string } | undefined {
  const code = text.match(/\b([A-Z]{3})\b/)?.[1]
  const currency = code ?? SYMBOLS.find(([symbol]) => text.includes(symbol))?.[1]
  const raw = text.replace(/[^\d.,]/g, '')
  if (!raw || !currency) return
  const lastDot = raw.lastIndexOf('.')
  const lastComma = raw.lastIndexOf(',')
  let normalized = raw
  if (lastDot >= 0 && lastComma >= 0) {
    normalized = lastComma > lastDot ? raw.replaceAll('.', '').replace(',', '.') : raw.replaceAll(',', '')
  }
  else if (lastComma >= 0) {
    normalized = /,\d{1,2}$/.test(raw) ? raw.replace(',', '.') : raw.replaceAll(',', '')
  }
  else if ((raw.match(/\./g) ?? []).length > 1 || /\.\d{3}$/.test(raw)) {
    normalized = raw.replaceAll('.', '')
  }
  const amount = Number(normalized)
  return Number.isFinite(amount) ? { amount, currency } : undefined
}

function plain(value: any): string {
  if (!value) return ''
  if (typeof value.simpleText === 'string') return value.simpleText
  if (Array.isArray(value.runs)) return value.runs.map((run: any) => run.text ?? run.emoji?.emojiId ?? '').join('')
  return ''
}

function lastUrl(thumbnails: any): string | undefined {
  const list = Array.isArray(thumbnails?.thumbnails) ? thumbnails.thumbnails : []
  const url = list.at(-1)?.url
  if (typeof url !== 'string') return
  return url.startsWith('//') ? `https:${url}` : url
}

export function youtubeParts(message: any): ChatPart[] {
  const runs: any[] = Array.isArray(message?.runs) ? message.runs : []
  const parts: ChatPart[] = []
  for (const run of runs) {
    if (typeof run.text === 'string') {
      const last = parts.at(-1)
      if (last?.type === 'text') last.text += run.text
      else parts.push({ type: 'text', text: run.text })
    }
    else if (run.emoji) {
      const url = run.emoji.isCustomEmoji ? lastUrl(run.emoji.image) : undefined
      const name = run.emoji.shortcuts?.[0] ?? run.emoji.emojiId ?? ''
      if (url) parts.push({ type: 'emote', name, url })
      else {
        const text = run.emoji.emojiId ?? name
        const last = parts.at(-1)
        if (last?.type === 'text') last.text += text
        else parts.push({ type: 'text', text })
      }
    }
  }
  return parts
}

function author(renderer: any) {
  const badges: Badge[] = []
  const roles: ChatRole[] = []
  for (const entry of Array.isArray(renderer.authorBadges) ? renderer.authorBadges : []) {
    const badge = entry.liveChatAuthorBadgeRenderer
    const icon = badge?.icon?.iconType
    const custom = lastUrl(badge?.customThumbnail)
    if (icon === 'OWNER') {
      roles.push('broadcaster')
      badges.push({ icon: 'i-lucide-radio', color: '#ffd600' })
    }
    else if (icon === 'MODERATOR') {
      roles.push('moderator')
      badges.push({ icon: 'i-lucide-wrench', color: '#5e84f1' })
    }
    else if (icon === 'VERIFIED') {
      badges.push({ icon: 'i-lucide-badge-check', color: '#aaaaaa' })
    }
    else if (custom) {
      roles.push('subscriber')
      badges.push({ url: custom })
    }
  }
  const name = plain(renderer.authorName).replace(/^@/, '')
  return { userId: String(renderer.authorExternalChannelId ?? name), name, badges, roles }
}

function chat(renderer: any, extra: Partial<ChatMessage> = {}): ChatMessage {
  const who = author(renderer)
  const parts = youtubeParts(renderer.message)
  return {
    kind: 'chat',
    id: String(renderer.id),
    platform: 'youtube',
    ...who,
    parts,
    text: parts.map(part => (part.type === 'text' ? part.text : part.name)).join(''),
    ...extra
  }
}

export function youtubeActionsToEvents(actions: unknown): StreamEvent[] {
  const events: StreamEvent[] = []
  for (const action of Array.isArray(actions) ? actions : []) {
    const item = action?.addChatItemAction?.item
    if (item?.liveChatTextMessageRenderer) {
      events.push(chat(item.liveChatTextMessageRenderer))
    }
    else if (item?.liveChatPaidMessageRenderer) {
      const renderer = item.liveChatPaidMessageRenderer
      const money = parseAmount(plain(renderer.purchaseAmountText))
      const message = chat(renderer, { highlighted: true })
      if (message.parts.length) events.push(message)
      if (money) events.push({ kind: 'alert', type: 'donation', platform: 'youtube', name: message.name, amount: money.amount, currency: money.currency, message: message.text || undefined })
    }
    else if (item?.liveChatPaidStickerRenderer) {
      const renderer = item.liveChatPaidStickerRenderer
      const money = parseAmount(plain(renderer.purchaseAmountText))
      if (money) events.push({ kind: 'alert', type: 'donation', platform: 'youtube', name: author(renderer).name, amount: money.amount, currency: money.currency })
    }
    else if (item?.liveChatMembershipItemRenderer) {
      const renderer = item.liveChatMembershipItemRenderer
      const months = Number(plain(renderer.headerPrimaryText).match(/\d+/)?.[0]) || 1
      const message = chat(renderer)
      events.push({ kind: 'alert', type: 'sub', platform: 'youtube', name: message.name, months, message: message.text || undefined })
    }
    else if (item?.liveChatSponsorshipsGiftPurchaseAnnouncementRenderer) {
      const header = item.liveChatSponsorshipsGiftPurchaseAnnouncementRenderer.header?.liveChatSponsorshipsHeaderRenderer
      const count = Number(plain(header?.primaryText).match(/\d+/)?.[0]) || 1
      events.push({ kind: 'alert', type: 'gifts', platform: 'youtube', name: plain(header?.authorName).replace(/^@/, ''), count })
    }
    else if (action?.removeChatItemAction?.targetItemId) {
      events.push({ kind: 'delete', platform: 'youtube', id: String(action.removeChatItemAction.targetItemId) })
    }
    else if (action?.markChatItemAsDeletedAction?.targetItemId) {
      events.push({ kind: 'delete', platform: 'youtube', id: String(action.markChatItemAsDeletedAction.targetItemId) })
    }
    else if (action?.removeChatItemByAuthorAction?.externalChannelId) {
      events.push({ kind: 'clear', platform: 'youtube', userId: String(action.removeChatItemByAuthorAction.externalChannelId) })
    }
  }
  return events
}

export function youtubeLiveFromPage(html: string) {
  const videoId = html.match(/<link rel="canonical" href="https:\/\/www\.youtube\.com\/watch\?v=([\w-]{11})"/)?.[1]
  if (!videoId || !/"isLive":true|"isUpcoming":true/.test(html)) return
  return videoId
}

export function youtubeWatchInfo(next: any) {
  const results = next?.contents?.twoColumnWatchNextResults
  const chat = results?.conversationBar?.liveChatRenderer
  if (!chat || chat.isReplay) return
  const primary = (results?.results?.results?.contents ?? []).find((item: any) => item?.videoPrimaryInfoRenderer)?.videoPrimaryInfoRenderer
  const viewers = Number(primary?.viewCount?.videoViewCountRenderer?.originalViewCount)
  return { viewers: Number.isFinite(viewers) ? viewers : 0 }
}

export function youtubeLiveChatContinuation(html: string) {
  const raw = html.match(/window\["ytInitialData"\] = (\{.*?\});\s*<\/script>/s)?.[1] ?? html.match(/ytInitialData = (\{.*?\});\s*<\/script>/s)?.[1]
  try {
    const data = raw ? JSON.parse(raw) : undefined
    const items: any[] = data?.contents?.liveChatRenderer?.header?.liveChatHeaderRenderer?.viewSelector?.sortFilterSubMenuRenderer?.subMenuItems ?? []
    const live = items.find(item => /live chat/i.test(item?.title ?? '')) ?? items[1]
    const continuation = live?.continuation?.reloadContinuationData?.continuation
    if (typeof continuation === 'string') return continuation
  }
  catch {
    return html.match(/"continuation":"([^"]+)"/)?.[1]
  }
  return html.match(/"continuation":"([^"]+)"/)?.[1]
}

export function youtubeViewersFromPage(html: string) {
  const count = Number(html.match(/"originalViewCount":"(\d+)"/)?.[1])
  return Number.isFinite(count) ? count : 0
}

export function youtubeChannelPath(input: string) {
  const value = input.trim()
  if (/^UC[\w-]{22}$/.test(value)) return `/channel/${value}`
  const handle = value.replace(/^https?:\/\/(www\.)?youtube\.com\//i, '').replace(/^@/, '').split(/[/?#]/)[0]
  return handle && /^[\w.-]{3,30}$/.test(handle) ? `/@${handle}` : undefined
}
