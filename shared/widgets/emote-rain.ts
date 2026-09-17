import { customCssField, type WidgetDefinition } from './define'

export const emoteRain: WidgetDefinition = {
  type: 'emote-rain',
  icon: 'i-lucide-cloud-rain',
  size: [1920, 1080],
  fields: [
    { key: 'rainMode', section: 'general', type: 'select', default: 'fall', options: ['fall', 'rise', 'fly'] },
    { key: 'perMessage', section: 'general', type: 'number', default: 3, min: 1, max: 20 },
    { key: 'maxEmotes', section: 'general', type: 'number', default: 60, min: 5, max: 300 },
    { key: 'rainDuration', section: 'general', type: 'number', default: 5, min: 1, max: 20, step: 0.5, unit: 's' },
    { key: 'ignoredUsers', section: 'general', type: 'list', default: [] },

    { key: 'emoteSize', section: 'style', type: 'number', default: 72, min: 16, max: 256, unit: 'px', css: '--emote-size' },
    { key: 'opacity', section: 'style', type: 'number', default: 1, min: 0.1, max: 1, step: 0.05, css: '--opacity' },
    { key: 'spin', section: 'style', type: 'toggle', default: false },
    { key: 'sway', section: 'style', type: 'toggle', default: true },

    customCssField()
  ],
  tests: ['emote'],
  cssTemplate: [
    { selector: '.emote-drop img', declarations: { height: '{emoteSize}', opacity: '{opacity}' } }
  ],
  cssClasses: [
    { id: 'root', selector: '.widget-root' },
    { id: 'emoteRain', selector: '.emote-rain' },
    { id: 'emoteDrop', selector: '.emote-drop' },
    { id: 'emoteDropImage', selector: '.emote-drop img' }
  ],
  presets: [
    { id: 'classic', values: { emoteSize: 72, opacity: 1, spin: false, sway: true } },
    { id: 'big', values: { emoteSize: 140, opacity: 1, spin: false, sway: true } },
    { id: 'subtle', values: { emoteSize: 44, opacity: 0.7, spin: false, sway: false } },
    { id: 'party', values: { emoteSize: 96, opacity: 1, spin: true, sway: true } }
  ]
}
