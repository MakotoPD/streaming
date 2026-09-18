import { and, eq } from 'drizzle-orm'

const quota = { day: '', total: 0, byPath: {} as Record<string, number>, reported: 0 }

function countQuota(path: string) {
  const day = new Date().toISOString().slice(0, 10)
  if (quota.day !== day) Object.assign(quota, { day, total: 0, byPath: {} })
  quota.total++
  quota.byPath[path] = (quota.byPath[path] ?? 0) + 1
  if (Date.now() - quota.reported > 3_600_000) {
    quota.reported = Date.now()
    console.info(`[youtube] quota used today (UTC): ${quota.total} of 10000 units (${Object.entries(quota.byPath).map(([name, units]) => `${name} ${units}`).join(', ')})`)
  }
  return quota.total
}

export function youtubeQuotaToday() {
  return quota.total
}

export const YOUTUBE_SCOPES = ['openid', 'profile', 'https://www.googleapis.com/auth/youtube.readonly']

function credentials() {
  const { clientId, clientSecret } = useRuntimeConfig().oauth.google
  return clientId && clientSecret ? { clientId, clientSecret } : undefined
}

async function youtubeAccount(userId: string) {
  const [account] = await useDb().select().from(tables.accounts)
    .where(and(eq(tables.accounts.userId, userId), eq(tables.accounts.provider, 'youtube')))
  return account
}

async function refreshGoogleToken(accountId: string, refreshToken: string) {
  const creds = credentials()
  if (!creds) return undefined
  const res = await $fetch<{ access_token: string, expires_in: number, refresh_token?: string }>('https://oauth2.googleapis.com/token', {
    method: 'POST',
    body: new URLSearchParams({ client_id: creds.clientId, client_secret: creds.clientSecret, grant_type: 'refresh_token', refresh_token: refreshToken })
  }).catch(() => undefined)
  if (!res) return undefined
  await useDb().update(tables.accounts).set({
    accessToken: seal(res.access_token),
    ...(res.refresh_token ? { refreshToken: seal(res.refresh_token) } : {}),
    tokenExpiresAt: new Date(Date.now() + res.expires_in * 1000)
  }).where(eq(tables.accounts.id, accountId))
  return res.access_token
}

export async function youtubeApi<T>(userId: string, path: string, query: Record<string, string | number>): Promise<T | undefined> {
  const account = await youtubeAccount(userId)
  const refresh = unseal(account?.refreshToken)
  if (!account || !refresh) return undefined

  let token = unseal(account.accessToken)
  if (!token || !account.tokenExpiresAt || account.tokenExpiresAt.getTime() < Date.now() + 60_000) {
    token = await refreshGoogleToken(account.id, refresh)
  }
  if (!token) return undefined

  countQuota(path)
  const request = (bearer: string) => $fetch<T>(`https://www.googleapis.com/youtube/v3${path}`, { query, headers: { authorization: `Bearer ${bearer}` }, timeout: 10_000 })
  try {
    return await request(token)
  }
  catch (err: any) {
    if (err?.statusCode !== 401) {
      console.warn('[youtube] api', path, err?.statusCode, err?.data?.error?.message)
      return undefined
    }
    const fresh = await refreshGoogleToken(account.id, refresh)
    return fresh ? await request(fresh).catch(() => undefined) : undefined
  }
}
