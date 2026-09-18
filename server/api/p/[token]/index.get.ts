import { eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const user = await creatorPanelByToken(event)
  const accounts = await useDb().select({
    provider: tables.accounts.provider,
    scopes: tables.accounts.scopes
  }).from(tables.accounts).where(eq(tables.accounts.userId, user.id))
  return {
    channels: user.channels,
    platforms: panelPlatforms(user.channels, accounts)
  }
})
