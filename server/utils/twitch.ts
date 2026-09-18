import { and, eq } from 'drizzle-orm'

export const TWITCH_SCOPES = [
  'user:write:chat',
  'moderator:read:followers',
  'channel:read:subscriptions',
  'channel:read:redemptions',
  'channel:read:hype_train',
  'channel:read:polls',
  'channel:read:predictions'
]

const EVENTSUB_TYPES: { type: string, version: string, moderator?: boolean }[] = [
  { type: 'channel.follow', version: '2', moderator: true },
  { type: 'channel.channel_points_custom_reward_redemption.add', version: '1' },
  { type: 'channel.hype_train.begin', version: '2' },
  { type: 'channel.hype_train.progress', version: '2' },
  { type: 'channel.hype_train.end', version: '2' },
  { type: 'channel.poll.begin', version: '1' },
  { type: 'channel.poll.progress', version: '1' },
  { type: 'channel.poll.end', version: '1' },
  { type: 'channel.prediction.begin', version: '1' },
  { type: 'channel.prediction.progress', version: '1' },
  { type: 'channel.prediction.lock', version: '1' },
  { type: 'channel.prediction.end', version: '1' }
]

let appToken: { value: string, expires: number } | undefined

function credentials() {
  const { clientId, clientSecret } = useRuntimeConfig().oauth.twitch
  return clientId && clientSecret ? { clientId, clientSecret } : undefined
}

async function getAppToken() {
  const creds = credentials()
  if (!creds) return undefined
  if (appToken && appToken.expires > Date.now() + 60_000) return appToken.value
  const res = await $fetch<{ access_token: string, expires_in: number }>('https://id.twitch.tv/oauth2/token', {
    method: 'POST',
    body: new URLSearchParams({ client_id: creds.clientId, client_secret: creds.clientSecret, grant_type: 'client_credentials' })
  })
  appToken = { value: res.access_token, expires: Date.now() + res.expires_in * 1000 }
  return appToken.value
}

function request<T>(token: string, path: string, init: { method?: 'GET' | 'POST' | 'DELETE', body?: object } = {}) {
  return $fetch<T>(`https://api.twitch.tv/helix${path}`, {
    method: init.method ?? 'GET',
    body: init.body,
    headers: { 'Client-Id': credentials()!.clientId, 'Authorization': `Bearer ${token}` }
  })
}

export async function helix<T>(path: string, init: { method?: 'GET' | 'POST' | 'DELETE', body?: object } = {}): Promise<T | undefined> {
  const token = await getAppToken()
  return token ? request<T>(token, path, init) : undefined
}

async function twitchAccount(userId: string) {
  const [account] = await useDb().select().from(tables.accounts)
    .where(and(eq(tables.accounts.userId, userId), eq(tables.accounts.provider, 'twitch')))
  return account
}

async function refreshUserToken(accountId: string, refreshToken: string) {
  const creds = credentials()
  if (!creds) return undefined
  const res = await $fetch<{ access_token: string, refresh_token: string, expires_in: number }>('https://id.twitch.tv/oauth2/token', {
    method: 'POST',
    body: new URLSearchParams({ client_id: creds.clientId, client_secret: creds.clientSecret, grant_type: 'refresh_token', refresh_token: refreshToken })
  }).catch(() => undefined)
  if (!res) return undefined
  await useDb().update(tables.accounts).set({
    accessToken: seal(res.access_token),
    refreshToken: seal(res.refresh_token),
    tokenExpiresAt: new Date(Date.now() + res.expires_in * 1000)
  }).where(eq(tables.accounts.id, accountId))
  return res.access_token
}

export async function userHelix<T>(userId: string, path: string, init: { method?: 'GET' | 'POST' | 'DELETE', body?: object } = {}): Promise<T | undefined> {
  const account = await twitchAccount(userId)
  const refresh = unseal(account?.refreshToken)
  if (!account || !refresh || !credentials()) return undefined

  let token = unseal(account.accessToken)
  if (!token || !account.tokenExpiresAt || account.tokenExpiresAt.getTime() < Date.now() + 60_000) {
    token = await refreshUserToken(account.id, refresh)
  }
  if (!token) return undefined

  try {
    return await request<T>(token, path, init)
  }
  catch (err: any) {
    if (err?.statusCode !== 401) return undefined
    const fresh = await refreshUserToken(account.id, refresh)
    return fresh ? await request<T>(fresh, path, init).catch(() => undefined) : undefined
  }
}

export async function sendTwitchChat(userId: string, message: string) {
  const account = await twitchAccount(userId)
  if (!account?.providerId) throw createError({ statusCode: 403, message: 'twitch_unavailable' })
  if (!account.scopes.includes('user:write:chat')) throw createError({ statusCode: 403, message: 'twitch_reconnect' })
  const result = await userHelix<{ data: { is_sent: boolean, drop_reason?: { message?: string } }[] }>(userId, '/chat/messages', {
    method: 'POST',
    body: {
      broadcaster_id: account.providerId,
      sender_id: account.providerId,
      message
    }
  })
  const sent = result?.data?.[0]
  if (!sent?.is_sent) throw createError({ statusCode: 502, message: sent?.drop_reason?.message ?? 'send_failed' })
  return sent
}

export async function subscribeTwitchEvents(broadcasterId: string) {
  const { public: { siteUrl }, twitchWebhookSecret } = useRuntimeConfig()
  if (!siteUrl.startsWith('https://') || !twitchWebhookSecret) {
    console.warn('[twitch] EventSub needs an https NUXT_PUBLIC_SITE_URL and NUXT_TWITCH_WEBHOOK_SECRET, skipping subscriptions')
    return
  }
  await Promise.all(EVENTSUB_TYPES.map(async ({ type, version, moderator }) => {
    try {
      await helix('/eventsub/subscriptions', {
        method: 'POST',
        body: {
          type,
          version,
          condition: moderator ? { broadcaster_user_id: broadcasterId, moderator_user_id: broadcasterId } : { broadcaster_user_id: broadcasterId },
          transport: { method: 'webhook', callback: `${siteUrl}/api/webhooks/twitch`, secret: twitchWebhookSecret }
        }
      })
    }
    catch (err: any) {
      if (err?.statusCode !== 409) console.error('[twitch] EventSub', type, err?.data ?? err)
    }
  }))
}

export async function unsubscribeTwitchEvents(broadcasterId: string) {
  const list = await helix<{ data: { id: string, condition: { broadcaster_user_id?: string } }[] }>(`/eventsub/subscriptions?user_id=${broadcasterId}`).catch(() => undefined)
  await Promise.all((list?.data ?? [])
    .filter(subscription => subscription.condition.broadcaster_user_id === broadcasterId)
    .map(subscription => helix(`/eventsub/subscriptions?id=${subscription.id}`, { method: 'DELETE' }).catch(() => undefined)))
}
