import { z } from 'zod'
import { WIDGET_TYPES } from '#shared/widgets'

const body = z.object({ type: z.string().refine(type => WIDGET_TYPES.includes(type)) })

export default defineEventHandler(async (event) => {
  const userId = await requireUserId(event)
  const { type } = await readValidatedBody(event, body.parse)
  return createWidget(userId, type, getCookie(event, 'lang') ?? 'en')
})
