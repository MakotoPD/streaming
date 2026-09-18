import { z } from 'zod'

const bodySchema = z.object({
  platform: z.enum(['twitch', 'kick', 'youtube']),
  message: z.string().trim().min(1).max(500)
})

export default defineEventHandler(async (event) => {
  const user = await creatorPanelByToken(event)
  panelRateLimit(event, `chat:${user.id}`, 12, 10_000)
  const body = await readValidatedBody(event, bodySchema.parse)

  if (body.platform !== 'twitch') throw createError({ statusCode: 501, message: 'platform_not_supported' })
  await sendTwitchChat(user.id, body.message)
  return { ok: true }
})
