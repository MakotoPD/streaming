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

export async function helix<T>(path: string, init: { method?: 'GET' | 'POST', body?: object } = {}): Promise<T | undefined> {
  const token = await getAppToken()
  if (!token) return undefined
  return $fetch<T>(`https://api.twitch.tv/helix${path}`, {
    method: init.method ?? 'GET',
    body: init.body,
    headers: { 'Client-Id': credentials()!.clientId, 'Authorization': `Bearer ${token}` }
  })
}

export async function subscribeTwitchFollows(broadcasterId: string) {
  const { public: { siteUrl }, twitchWebhookSecret } = useRuntimeConfig()
  if (!siteUrl.startsWith('https://') || !twitchWebhookSecret) {
    console.warn('[twitch] follow alerts need an https NUXT_PUBLIC_SITE_URL and NUXT_TWITCH_WEBHOOK_SECRET, skipping subscription')
    return
  }
  try {
    await helix('/eventsub/subscriptions', {
      method: 'POST',
      body: {
        type: 'channel.follow',
        version: '2',
        condition: { broadcaster_user_id: broadcasterId, moderator_user_id: broadcasterId },
        transport: { method: 'webhook', callback: `${siteUrl}/api/webhooks/twitch`, secret: twitchWebhookSecret }
      }
    })
  }
  catch (err: any) {
    if (err?.statusCode !== 409) console.error('[twitch] EventSub', err?.data ?? err)
  }
}
