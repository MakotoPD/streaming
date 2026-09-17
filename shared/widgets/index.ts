import type { AlertType, StreamEvent } from '../types'
import { alerts, ALERT_TYPES } from './alerts'
import { chat } from './chat'
import type { WidgetDefinition } from './define'
import { emoteCombo } from './emote-combo'
import { scene } from './scene'

export * from './define'
export { ALERT_TYPES } from './alerts'
export { SOCIALS } from './scene'
export { ANIMATIONS_IN, ANIMATIONS_OUT } from './animations'
export { widgetTexts } from './texts'

export const WIDGETS: Record<string, WidgetDefinition> = {
  'chat': chat,
  'alerts': alerts,
  'emote-combo': emoteCombo,
  'scene': scene
}

export const WIDGET_TYPES = Object.keys(WIDGETS)

export const BUILTIN_SOUNDS = ['plakal2', 'pterodaktyl', 'pasja-gotowania', 'wide'].map(name => ({ name, url: `/sounds/${name}.mp3` }))

export const STARTER_WIDGETS: { type: string, settings?: Record<string, unknown> }[] = [
  { type: 'chat' },
  { type: 'alerts' },
  { type: 'emote-combo' },
  { type: 'scene', settings: { mode: 'starting' } },
  { type: 'scene', settings: { mode: 'brb' } }
]

const LUL = 'https://static-cdn.jtvnw.net/emoticons/v2/425618/default/dark/2.0'
const SAMPLE_TEXTS = ['Hello chat!', 'GG WP', 'that was insane', 'first time here, love the stream', 'let\'s gooo']
let sampleIndex = 0

export function sampleEvent(test: string): StreamEvent {
  const id = crypto.randomUUID()
  if ((ALERT_TYPES as string[]).includes(test)) {
    return { kind: 'alert', type: test as AlertType, platform: 'twitch', name: 'TestViewer', months: 6, count: 5, tier: 2 }
  }
  if (test === 'emote') {
    return { kind: 'chat', id, platform: 'twitch', userId: id, name: `Viewer${Math.floor(Math.random() * 900 + 100)}`, color: '#f472b6', badges: [], text: 'LUL', parts: [{ type: 'emote', name: 'LUL', url: LUL }] }
  }
  const text = SAMPLE_TEXTS[sampleIndex++ % SAMPLE_TEXTS.length]!
  const colors = ['#22d3ee', '#f472b6', '#facc15', '#a78bfa', '#4ade80']
  return {
    kind: 'chat',
    id,
    platform: sampleIndex % 3 === 0 ? 'kick' : 'twitch',
    userId: String(sampleIndex % 4),
    name: ['makotopd', 'TestViewer', 'chatter_42', 'NightOwl'][sampleIndex % 4]!,
    color: colors[sampleIndex % colors.length],
    badges: [],
    text,
    parts: sampleIndex % 2 ? [{ type: 'text', text: `${text} ` }, { type: 'emote', name: 'LUL', url: LUL }] : [{ type: 'text', text }]
  }
}

export const WIDGET_TESTS: Record<string, string[]> = {
  'chat': ['chat'],
  'alerts': ALERT_TYPES,
  'emote-combo': ['emote'],
  'scene': []
}
