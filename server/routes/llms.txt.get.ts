import { WIDGET_TYPES } from '#shared/widgets'

export default defineEventHandler((event) => {
  const base = siteUrl()
  setHeader(event, 'Content-Type', 'text/plain; charset=utf-8')
  return `# Streaming

> Browser-source widgets for OBS and other streaming software. Chat, alerts, goals, timers, scene screens and a shared drawing canvas for Twitch and Kick, with 7TV, BetterTTV and FrankerFaceZ emotes.

Every widget is edited in the dashboard and added to OBS as a Browser Source URL. Widgets connect to Twitch and Kick directly from the browser source, so the app stays light on CPU. Users can start with just a channel nickname or sign in with Twitch or Kick to keep their setup across devices.

## Widgets
${WIDGET_TYPES.map(type => `- ${type}`).join('\n')}

## Pages
- [Home](${base}/): pick a nickname or sign in, then edit widgets
- [Privacy policy](${base}/privacy)
- [Terms of service](${base}/terms)
- [Cookie policy](${base}/cookies)

## Notes
- Overlay URLs (/o/...) and drawing URLs (/c/...) are private per user and are not indexed.
- The interface is available in English, Polish, Spanish, German and Russian.
`
})
