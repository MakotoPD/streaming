import { sanitizeSettings, WIDGETS } from '#shared/widgets'

export default defineEventHandler(async (event) => {
  const { widget, channels } = await widgetByToken(event)
  const def = WIDGETS[widget.type]
  if (!def) throw createError({ statusCode: 404 })
  return {
    id: widget.id,
    type: widget.type,
    settings: sanitizeSettings(def, widget.settings),
    channels: {
      twitch: channels.twitch ? { login: channels.twitch.login } : undefined,
      kick: channels.kick,
      youtube: channels.youtube
    }
  }
})
