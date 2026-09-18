import { and, eq, lt, notExists } from 'drizzle-orm'

export const GUEST_TTL = 48 * 60 * 60 * 1000

export function guestExpiresAt(createdAt: Date) {
  return new Date(createdAt.getTime() + GUEST_TTL)
}

export async function removeExpiredGuests() {
  const db = useDb()
  const removed = await db.delete(tables.users)
    .where(and(
      lt(tables.users.createdAt, new Date(Date.now() - GUEST_TTL)),
      notExists(db.select({ id: tables.accounts.id }).from(tables.accounts).where(eq(tables.accounts.userId, tables.users.id)))
    ))
    .returning({ id: tables.users.id })
  for (const user of removed) publishToUser(user.id, { kind: 'reload' })
  return removed.length
}
