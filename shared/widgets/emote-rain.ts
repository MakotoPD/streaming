import { customCssField, type WidgetDefinition } from './define'

export const RAIN_EFFECTS = ['fall', 'rise', 'fly', 'burst', 'fountain', 'pop', 'random'] as const
export const RAIN_TRIGGERS = ['chat', 'follow', 'sub', 'gifts', 'raid', 'bits'] as const

export const emoteRain: WidgetDefinition = {
  type: 'emote-rain',
  icon: 'i-lucide-cloud-rain',
  size: [1920, 1080],
  fields: [
    { key: 'triggers', section: 'triggers', type: 'multi', default: ['chat'], options: RAIN_TRIGGERS },
    { key: 'rainMode', section: 'triggers', type: 'select', default: 'fall', options: RAIN_EFFECTS },
    { key: 'perMessage', section: 'triggers', type: 'number', default: 3, min: 1, max: 20 },
    { key: 'alertMode', section: 'triggers', type: 'select', default: 'burst', options: RAIN_EFFECTS },
    { key: 'alertAmount', section: 'triggers', type: 'number', default: 24, min: 1, max: 200 },
    { key: 'scaleWithAmount', section: 'triggers', type: 'toggle', default: true },
    { key: 'alertEmotes', section: 'triggers', type: 'list', default: [] },
    { key: 'ignoredUsers', section: 'triggers', type: 'list', default: [] },

    { key: 'maxEmotes', section: 'general', type: 'number', default: 120, min: 5, max: 400 },
    { key: 'rainDuration', section: 'general', type: 'number', default: 5, min: 1, max: 20, step: 0.5, unit: 's' },
    { key: 'burstSize', section: 'general', type: 'number', default: 14, min: 3, max: 60 },
    { key: 'spread', section: 'general', type: 'number', default: 35, min: 5, max: 100, unit: '%' },

    { key: 'emoteSize', section: 'style', type: 'number', default: 72, min: 16, max: 256, unit: 'px', css: '--emote-size' },
    { key: 'opacity', section: 'style', type: 'number', default: 1, min: 0.1, max: 1, step: 0.05, css: '--opacity' },
    { key: 'spin', section: 'style', type: 'toggle', default: false },
    { key: 'sway', section: 'style', type: 'toggle', default: true },

    customCssField()
  ],
  tests: ['emote', 'follow', 'sub', 'gifts', 'raid', 'bits'],
  cssTemplate: [
    { selector: '.emote-drop img', declarations: { height: '{emoteSize}', opacity: '{opacity}' } }
  ],
  cssClasses: [
    { id: 'root', selector: '.widget-root' },
    { id: 'emoteRain', selector: '.emote-rain' },
    { id: 'emoteDrop', selector: '.emote-drop' },
    { id: 'emoteDropImage', selector: '.emote-drop img' },
    { id: 'emoteDropBurst', selector: '.emote-drop-burst' }
  ],
  presets: [
    { id: 'classic', values: { emoteSize: 72, opacity: 1, spin: false, sway: true } },
    { id: 'big', values: { emoteSize: 140, opacity: 1, spin: false, sway: true } },
    { id: 'subtle', values: { emoteSize: 44, opacity: 0.7, spin: false, sway: false } },
    { id: 'party', values: { emoteSize: 96, opacity: 1, spin: true, sway: true } }
  ]
}
