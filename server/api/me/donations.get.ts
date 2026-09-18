import { eq } from 'drizzle-orm'
import { DONATION_SOURCES } from '#shared/types'

export default defineEventHandler(async (event) => {
  const userId = await requireUserId(event)
  const [user] = await useDb().select({ donations: tables.users.donations }).from(tables.users).where(eq(tables.users.id, userId))
  const status = donationStatus(userId)
  return Object.fromEntries(DONATION_SOURCES.map(source => [source, {
    configured: !!user?.donations[source],
    status: status[source] ?? null
  }]))
})
