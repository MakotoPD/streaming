import type { AlertType, ChatMessage, Settings, StreamEvent } from '../types'
import { alerts, ALERT_TYPES } from './alerts'
import { camFrame } from './cam-frame'
import { chat } from './chat'
import { clock } from './clock'
import { counter } from './counter'
import type { WidgetDefinition } from './define'
import { emoteCombo } from './emote-combo'
import { emoteRain } from './emote-rain'
import { firstMessage } from './first-message'
import { giveaway } from './giveaway'
import { goal } from './goal'
import { leaderboard } from './leaderboard'
import { lowerThird } from './lower-third'
import { marquee } from './marquee'
import { pinned } from './pinned'
import { poll } from './poll'
import { recentEvents } from './recent-events'
import { scene } from './scene'
import { socials } from './socials'
import { spotlight } from './spotlight'
import { subathon } from './subathon'

export * from './define'
export { ALERT_TYPES } from './alerts'
export { SOCIALS } from './scene'
export { ANIMATIONS_IN, ANIMATIONS_OUT } from './animations'
export { widgetTexts } from './texts'

export const WIDGETS: Record<string, WidgetDefinition> = Object.fromEntries([
  chat,
  alerts,
  emoteCombo,
  scene,
  emoteRain,
  poll,
  counter,
  pinned,
  recentEvents,
  leaderboard,
  giveaway,
  firstMessage,
  spotlight,
  subathon,
  goal,
  clock,
  socials,
  marquee,
  camFrame,
  lowerThird
].map(def => [def.type, def]))

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
const SAMPLE_NAMES = ['makotopd', 'TestViewer', 'chatter_42', 'NightOwl', 'PixelPanda', 'LagMaster', 'CozyGamer', 'NoScopeNina']
const SAMPLE_COLORS = ['#22d3ee', '#f472b6', '#facc15', '#a78bfa', '#4ade80', '#fb923c']
let sampleIndex = 0

const random = <T>(list: T[]) => list[Math.floor(Math.random() * list.length)]!

function sampleChat(overrides: Partial<ChatMessage> & { text: string }): ChatMessage {
  const id = crypto.randomUUID()
  const name = overrides.name ?? random(SAMPLE_NAMES)
  return {
    kind: 'chat',
    id,
    platform: 'twitch',
    userId: name,
    name,
    color: random(SAMPLE_COLORS),
    badges: [],
    roles: [],
    parts: [{ type: 'text', text: overrides.text }],
    ...overrides
  }
}

export function sampleEvent(test: string, settings: Settings = {}): StreamEvent {
  if ((ALERT_TYPES as string[]).includes(test)) {
    return { kind: 'alert', type: test as AlertType, platform: 'twitch', name: random(SAMPLE_NAMES), months: 6, count: test === 'bits' ? 500 : 5, tier: 2 }
  }
  switch (test) {
    case 'emote':
      return sampleChat({ text: 'LUL', name: `Viewer${Math.floor(Math.random() * 900 + 100)}`, parts: [{ type: 'emote', name: 'LUL', url: LUL }] })
    case 'vote': {
      const options = (settings.pollOptions as string[] | undefined)?.length ?? 2
      return sampleChat({ text: `${settings.commandPrefix ?? '!'}${Math.floor(Math.random() * options) + 1}`, name: `Voter${Math.floor(Math.random() * 9000 + 1000)}` })
    }
    case 'command':
      return sampleChat({ text: String(settings.command || '!death'), name: 'makotopd', roles: ['broadcaster'] })
    case 'join':
      return sampleChat({ text: String(settings.keyword || '!join'), name: `Lucky${Math.floor(Math.random() * 9000 + 1000)}`, roles: ['subscriber'] })
    case 'first':
      return sampleChat({ text: 'hi everyone, just found this stream!', name: `Newbie${Math.floor(Math.random() * 900 + 100)}`, firstMessage: true })
    case 'highlight':
      return sampleChat({ text: 'This stream is amazing, keep it up! LUL', highlighted: true, bits: 500, parts: [{ type: 'text', text: 'This stream is amazing, keep it up! ' }, { type: 'emote', name: 'LUL', url: LUL }] })
    case 'pin':
      return { kind: 'command', name: 'pin', payload: sampleChat({ text: 'Remember to hydrate! LUL', name: 'makotopd', roles: ['broadcaster'], parts: [{ type: 'text', text: 'Remember to hydrate! ' }, { type: 'emote', name: 'LUL', url: LUL }] }) }
  }
  const text = SAMPLE_TEXTS[sampleIndex++ % SAMPLE_TEXTS.length]!
  return sampleChat({
    text,
    platform: sampleIndex % 3 === 0 ? 'kick' : 'twitch',
    name: SAMPLE_NAMES[sampleIndex % 4]!,
    parts: sampleIndex % 2 ? [{ type: 'text', text: `${text} ` }, { type: 'emote', name: 'LUL', url: LUL }] : [{ type: 'text', text }]
  })
}
