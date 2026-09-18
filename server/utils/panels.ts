import { eq } from 'drizzle-orm'
import type { H3Event } from 'h3'
import type { Channels, Platform, StreamEvent } from '#shared/types'

const hits = new Map<string, number[]>()

export async function creatorPanelByToken(event: H3Event) {
  const token = getRouterParam(event, 'token') ?? ''
  if (!/^[\w-]{20,80}$/.test(token)) throw createError({ statusCode: 404 })
  const [user] = await useDb().select({
    id: tables.users.id,
    channels: tables.users.channels
  }).from(tables.users).where(eq(tables.users.panelToken, token))
  if (!user) throw createError({ statusCode: 404 })
  setHeader(event, 'Cache-Control', 'no-store')
  setHeader(event, 'Referrer-Policy', 'no-referrer')
  setHeader(event, 'X-Robots-Tag', 'noindex, nofollow')
  return user
}

export function panelRateLimit(event: H3Event, key: string, limit = 20, windowMs = 10_000) {
  const ip = getRequestIP(event, { xForwardedFor: true }) ?? 'unknown'
  const bucket = `${key}:${ip}`
  const now = Date.now()
  const recent = (hits.get(bucket) ?? []).filter(time => now - time < windowMs)
  if (recent.length >= limit) throw createError({ statusCode: 429, message: 'rate_limited' })
  hits.set(bucket, [...recent, now])
  if (hits.size > 5000) hits.delete(hits.keys().next().value!)
}

export function panelPlatforms(channels: Channels, accounts: { provider: Platform, scopes: string[] }[]) {
  const connected = new Set(accounts.map(account => account.provider))
  const twitch = accounts.find(account => account.provider === 'twitch')
  return (['twitch', 'kick', 'youtube'] as Platform[]).map((platform) => ({
    platform,
    readable: Boolean(channels[platform]),
    writable: platform === 'twitch' && connected.has('twitch') && Boolean(twitch?.scopes.includes('user:write:chat')),
    reconnect: platform === 'twitch' && connected.has('twitch') && !twitch?.scopes.includes('user:write:chat')
  }))
}

export function safePanelEvent(input: unknown): StreamEvent | undefined {
  if (!input || typeof input !== 'object') return undefined
  const event = input as StreamEvent
  if (!['alert', 'redemption', 'hypetrain', 'twitch-poll', 'prediction', 'command'].includes(event.kind)) return undefined
  const encoded = JSON.stringify(event)
  if (encoded.length > 20_000) return undefined
  return event
}
