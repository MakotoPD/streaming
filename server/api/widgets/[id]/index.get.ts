import { sanitizeSettings, WIDGETS } from '#shared/widgets'

export default defineEventHandler(async (event) => {
  const widget = await requireOwnedWidget(event)
  const def = WIDGETS[widget.type]
  if (!def) throw createError({ statusCode: 404 })
  return { ...widget, scene: undefined, settings: sanitizeSettings(def, widget.settings) }
})
