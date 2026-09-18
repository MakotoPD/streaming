import { eq } from 'drizzle-orm'
import { z } from 'zod'

const params = z.object({ provider: z.enum(['twitch', 'kick', 'youtube']) })

async function revoke(provider: 'twitch' | 'kick' | 'youtube', token: string | undefined) {
  if (!token) return
  const { oauth } = useRuntimeConfig()
  const request = provider === 'twitch'
    ? $fetch('https://id.twitch.tv/oauth2/revoke', { method: 'POST', body: new URLSearchParams({ client_id: oauth.twitch.clientId, token }) })
    : provider === 'youtube'
      ? $fetch('https://oauth2.googleapis.com/revoke', { method: 'POST', body: new URLSearchParams({ token }) })
      : $fetch('https://id.kick.com/oauth/revoke', { method: 'POST', query: { token, token_hint_type: 'access_token' } })
  await request.catch(err => console.warn(`[accounts] ${provider} revoke failed`, err?.statusCode))
}

export default defineEventHandler(async (event) => {
  const userId = await requireUserId(event)
  const { provider } = await getValidatedRouterParams(event, params.parse)
  const db = useDb()

  const accounts = await db.select().from(tables.accounts).where(eq(tables.accounts.userId, userId))
  const account = accounts.find(item => item.provider === provider)
  if (!account) throw createError({ statusCode: 404 })
  if (accounts.length <= 1) throw createError({ statusCode: 400, message: 'last_account' })

  await revoke(provider, unseal(provider === 'youtube' ? account.refreshToken ?? account.accessToken : account.accessToken))
  if (provider === 'twitch') await unsubscribeTwitchEvents(account.providerId)

  await db.delete(tables.accounts).where(eq(tables.accounts.id, account.id))

  const [user] = await db.select({ channels: tables.users.channels }).from(tables.users).where(eq(tables.users.id, userId))
  if (provider === 'twitch' && user?.channels.twitch) await updateChannels(userId, { twitch: { login: user.channels.twitch.login } })
  if (provider === 'youtube') await updateChannels(userId, { youtube: undefined })
  return { ok: true }
})
