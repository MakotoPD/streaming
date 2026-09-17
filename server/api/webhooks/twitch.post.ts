import { createHmac, timingSafeEqual } from 'node:crypto'
import { sql } from 'drizzle-orm'

const seen = new Set<string>()

export default defineEventHandler(async (event) => {
  const secret = useRuntimeConfig().twitchWebhookSecret
  const raw = (await readRawBody(event)) ?? ''
  const id = getHeader(event, 'twitch-eventsub-message-id') ?? ''
  const timestamp = getHeader(event, 'twitch-eventsub-message-timestamp') ?? ''
  const signature = getHeader(event, 'twitch-eventsub-message-signature') ?? ''

  const expected = `sha256=${createHmac('sha256', secret).update(id + timestamp + raw).digest('hex')}`
  if (!secret || signature.length !== expected.length || !timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) {
    throw createError({ statusCode: 403 })
  }

  const body = JSON.parse(raw)
  const type = getHeader(event, 'twitch-eventsub-message-type')

  if (type === 'webhook_callback_verification') {
    setHeader(event, 'Content-Type', 'text/plain')
    return body.challenge
  }
  if (type !== 'notification') return null

  if (seen.has(id)) return null
  seen.add(id)
  if (seen.size > 1000) seen.delete(seen.values().next().value!)

  if (body.subscription?.type === 'channel.follow') {
    const users = await useDb().select({ id: tables.users.id }).from(tables.users)
      .where(sql`${tables.users.channels}->'twitch'->>'id' = ${body.event.broadcaster_user_id}`)
    for (const user of users) {
      publishToUser(user.id, { kind: 'event', event: { kind: 'alert', type: 'follow', platform: 'twitch', name: body.event.user_name } })
    }
  }
  return null
})
