import { z } from 'zod'
import { sanitizeSettings, styleKeys, WIDGET_TYPES, WIDGETS } from '#shared/widgets'

const body = z.object({
  widgetType: z.string().refine(type => WIDGET_TYPES.includes(type)),
  name: z.string().trim().min(1).max(40),
  values: z.record(z.string(), z.unknown())
})

export default defineEventHandler(async (event) => {
  const userId = await requireUserId(event)
  const input = await readValidatedBody(event, body.parse)
  const def = WIDGETS[input.widgetType]!
  const clean = sanitizeSettings(def, input.values)
  const values = Object.fromEntries(styleKeys(def).map(key => [key, clean[key]]))
  const [style] = await useDb().insert(tables.styles)
    .values({ userId, widgetType: input.widgetType, name: input.name, values })
    .returning()
  return style
})
