import { eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const userId = await requireUserId(event)
  const db = useDb()
  const [user] = await db.select().from(tables.users).where(eq(tables.users.id, userId))
  if (!user) {
    await clearUserSession(event)
    throw createError({ statusCode: 401 })
  }
  const accounts = await db.select({
    provider: tables.accounts.provider,
    login: tables.accounts.login,
    displayName: tables.accounts.displayName,
    avatar: tables.accounts.avatar
  }).from(tables.accounts).where(eq(tables.accounts.userId, userId))
  return { id: user.id, channels: user.channels, accounts }
})
