import { eq } from 'drizzle-orm'
import type { H3Event } from 'h3'

export async function widgetByToken(event: H3Event) {
  const token = getRouterParam(event, 'token') ?? ''
  const [row] = await useDb().select({ widget: tables.widgets, channels: tables.users.channels })
    .from(tables.widgets)
    .innerJoin(tables.users, eq(tables.users.id, tables.widgets.userId))
    .where(eq(tables.widgets.token, token))
  if (!row) throw createError({ statusCode: 404 })
  return row
}
