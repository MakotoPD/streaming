import { randomBytes } from 'node:crypto'
import { and, eq } from 'drizzle-orm'
import type { H3Event } from 'h3'
import type { Channels } from '#shared/types'
import { defaultSettings, STARTER_WIDGETS, WIDGETS } from '#shared/widgets'

export const newToken = () => randomBytes(18).toString('base64url')

export async function requireUserId(event: H3Event) {
  const { user } = await requireUserSession(event)
  return user.id
}

export async function createWidget(userId: string, type: string, language: string, overrides: Record<string, unknown> = {}) {
  const def = WIDGETS[type]
  if (!def) throw createError({ statusCode: 400, message: 'Unknown widget type' })
  const settings = { ...defaultSettings(def, language), ...overrides }
  const [widget] = await useDb().insert(tables.widgets).values({
    userId,
    type,
    name: '',
    token: newToken(),
    settings
  }).returning()
  return widget!
}

export async function ensureUser(event: H3Event): Promise<string> {
  const session = await getUserSession(event)
  if (session.user?.id) {
    const exists = await useDb().select({ id: tables.users.id }).from(tables.users).where(eq(tables.users.id, session.user.id))
    if (exists.length) return session.user.id
  }
  const [user] = await useDb().insert(tables.users).values({}).returning({ id: tables.users.id })
  const language = getCookie(event, 'lang') ?? 'en'
  for (const starter of STARTER_WIDGETS) await createWidget(user!.id, starter.type, language, starter.settings)
  await setUserSession(event, { user: { id: user!.id } })
  return user!.id
}

export async function updateChannels(userId: string, patch: Channels) {
  const db = useDb()
  const [user] = await db.select({ channels: tables.users.channels }).from(tables.users).where(eq(tables.users.id, userId))
  const channels = { ...user?.channels, ...patch }
  for (const key of Object.keys(patch) as (keyof Channels)[]) {
    if (!patch[key]) delete channels[key]
  }
  await db.update(tables.users).set({ channels }).where(eq(tables.users.id, userId))
  publishToUser(userId, { kind: 'reload' })
  return channels
}

export async function linkAccount(event: H3Event, account: {
  provider: 'twitch' | 'kick'
  providerId: string
  login: string
  displayName: string
  avatar?: string
  channel: Channels
}) {
  const db = useDb()
  const [existing] = await db.select().from(tables.accounts)
    .where(and(eq(tables.accounts.provider, account.provider), eq(tables.accounts.providerId, account.providerId)))

  let userId: string
  if (existing) {
    userId = existing.userId
    await db.update(tables.accounts)
      .set({ login: account.login, displayName: account.displayName, avatar: account.avatar })
      .where(eq(tables.accounts.id, existing.id))
    await setUserSession(event, { user: { id: userId } })
  }
  else {
    userId = await ensureUser(event)
    await db.insert(tables.accounts).values({
      userId,
      provider: account.provider,
      providerId: account.providerId,
      login: account.login,
      displayName: account.displayName,
      avatar: account.avatar
    })
  }
  await updateChannels(userId, account.channel)
  return userId
}

export async function requireOwnedWidget(event: H3Event) {
  const userId = await requireUserId(event)
  const id = getRouterParam(event, 'id')!
  const [widget] = await useDb().select().from(tables.widgets)
    .where(and(eq(tables.widgets.id, id), eq(tables.widgets.userId, userId)))
    .catch(() => [])
  if (!widget) throw createError({ statusCode: 404, message: 'Widget not found' })
  return widget
}

export async function hasLinkedAccount(userId: string) {
  const rows = await useDb().select({ id: tables.accounts.id }).from(tables.accounts).where(eq(tables.accounts.userId, userId)).limit(1)
  return rows.length > 0
}
