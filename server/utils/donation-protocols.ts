import type { AlertEvent, DonationSource } from '../../shared/types'

export type SocketIoPacket =
  | { kind: 'open', pingInterval: number }
  | { kind: 'pong' }
  | { kind: 'connect', namespace: string }
  | { kind: 'error', namespace: string, reason: string }
  | { kind: 'event', namespace: string, name: string, payload: unknown }
  | { kind: 'other' }

export function parseSocketIoPacket(text: string): SocketIoPacket {
  if (text.startsWith('0{')) {
    const open = JSON.parse(text.slice(1)) as { pingInterval?: number }
    return { kind: 'open', pingInterval: Number(open.pingInterval) || 25_000 }
  }
  if (text === '3') return { kind: 'pong' }
  if (text[0] !== '4') return { kind: 'other' }

  const type = text[1]
  let rest = text.slice(2)
  let namespace = ''
  if (rest.startsWith('/')) {
    const comma = rest.indexOf(',')
    namespace = comma < 0 ? rest : rest.slice(0, comma)
    rest = comma < 0 ? '' : rest.slice(comma + 1)
  }
  rest = rest.replace(/^\d+/, '')

  if (type === '0') return { kind: 'connect', namespace }
  if (type === '4') {
    let reason = rest
    try {
      const parsed = JSON.parse(rest)
      reason = typeof parsed === 'string' ? parsed : String(parsed?.message ?? rest)
    }
    catch {
      reason = rest
    }
    return { kind: 'error', namespace, reason }
  }
  if (type === '2') {
    try {
      const [name, payload] = JSON.parse(rest) as [string, unknown]
      if (typeof name === 'string') return { kind: 'event', namespace, name, payload }
    }
    catch {
      return { kind: 'other' }
    }
  }
  return { kind: 'other' }
}

export interface Donation {
  id: string
  name: string
  amount: number
  currency: string
  message: string
  audio?: string[]
}

function clean(input: { id: unknown, name: unknown, amount: unknown, currency: unknown, message: unknown }): Donation | undefined {
  const amount = Number(input.amount)
  if (!Number.isFinite(amount) || amount < 0) return
  const currency = typeof input.currency === 'string' && /^[A-Z]{3}$/i.test(input.currency) ? input.currency.toUpperCase() : 'PLN'
  return {
    id: String(input.id ?? `${Date.now()}-${Math.random()}`).slice(0, 80),
    name: (typeof input.name === 'string' && input.name.trim() ? input.name.trim() : '').slice(0, 50),
    amount: Math.round(amount * 100) / 100,
    currency,
    message: (typeof input.message === 'string' ? input.message : '').slice(0, 300)
  }
}

export function audioSource(value: unknown) {
  if (typeof value !== 'string' || !value) return
  if (/^https:\/\/[^\s"'<>]{1,1000}$/.test(value)) return value
  if (/^data:audio\/[\w.+-]+;base64,[A-Za-z0-9+/=]+$/.test(value) && value.length < 1_500_000) return value
  if (/^[A-Za-z0-9+/=\s]{200,1500000}$/.test(value)) return `data:audio/mpeg;base64,${value.replace(/\s/g, '')}`
}

export function tipplyDonation(payload: unknown): Donation | undefined {
  const tip = payload as Record<string, any> | null
  if (!tip || typeof tip !== 'object') return
  const donation = clean({ id: tip.id, name: tip.nickname, amount: Number(tip.amount) / 100, currency: 'PLN', message: tip.message })
  if (!donation) return
  const audio = [tip.tts_nickname_google_female, tip.tts_amount_google_female, tip.tts_message_google_female, tip.audio_url]
    .map(audioSource)
    .filter((url): url is string => !!url)
  return audio.length ? { ...donation, audio } : donation
}

export function streamlabsDonations(payload: unknown): Donation[] {
  const event = payload as Record<string, any> | null
  if (!event || event.type !== 'donation' || (event.for && event.for !== 'streamlabs')) return []
  const list: unknown[] = Array.isArray(event.message) ? event.message : [event.message]
  return list.flatMap((item) => {
    const donation = item as Record<string, any> | null
    const cleaned = donation && clean({ id: donation._id ?? donation.id, name: donation.name ?? donation.from, amount: donation.amount, currency: donation.currency, message: donation.message })
    return cleaned ? [cleaned] : []
  })
}

export function streamElementsDonation(data: unknown): Donation | undefined {
  const tip = data as Record<string, any> | null
  if (!tip?.donation) return
  if (tip.status && tip.status !== 'success') return
  if (tip.approved && tip.approved !== 'allowed') return
  return clean({ id: tip._id, name: tip.donation.user?.username, amount: tip.donation.amount, currency: tip.donation.currency, message: tip.donation.message })
}

export function streamElementsChannel(token: string) {
  const part = token.split('.')[1]
  if (!part) return
  try {
    const payload = JSON.parse(Buffer.from(part, 'base64url').toString('utf8')) as { channel?: unknown }
    return typeof payload.channel === 'string' && /^[\w-]{6,64}$/.test(payload.channel) ? payload.channel : undefined
  }
  catch {
    return undefined
  }
}

export function tipplyId(input: string) {
  const value = input.trim()
  const match = value.match(/TIP_ALERT\/([\w-]{6,64})/) ?? value.match(/^([\w-]{6,64})$/)
  return match?.[1]
}

export function donationToAlert(donation: Donation, source: DonationSource): AlertEvent {
  return {
    kind: 'alert',
    type: 'donation',
    platform: source,
    name: donation.name,
    amount: donation.amount,
    currency: donation.currency,
    message: donation.message || undefined,
    audio: donation.audio
  }
}
