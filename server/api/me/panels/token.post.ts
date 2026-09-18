import { eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const userId = await requireUserId(event)
  const [updated] = await useDb().update(tables.users)
    .set({ panelToken: newToken() })
    .where(eq(tables.users.id, userId))
    .returning({ panelToken: tables.users.panelToken })
  return updated
})
