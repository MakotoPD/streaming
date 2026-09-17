import { animationFields, customCssField, languageField, type WidgetDefinition } from './define'

export const pinned: WidgetDefinition = {
  type: 'pinned',
  icon: 'i-lucide-pin',
  size: [700, 220],
  fields: [
    languageField(),
    { key: 'showLabel', section: 'general', type: 'toggle', default: true },
    { key: 'showBadges', section: 'general', type: 'toggle', default: true },
    { key: 'autoHide', section: 'general', type: 'number', default: 0, min: 0, max: 600, unit: 's' },

    { key: 'font', section: 'style', type: 'font', default: 'Outfit', css: '--font' },
    { key: 'fontSize', section: 'style', type: 'number', default: 22, min: 10, max: 60, unit: 'px', css: '--font-size' },
    { key: 'emoteSize', section: 'style', type: 'number', default: 1.6, min: 1, max: 5, step: 0.1, unit: 'em', css: '--emote-size' },
    { key: 'textColor', section: 'style', type: 'color', default: '#ffffff', css: '--text' },
    { key: 'background', section: 'style', type: 'color', default: 'rgba(12, 14, 20, 0.85)', css: '--bg' },
    { key: 'accentColor', section: 'style', type: 'color', default: '#8b5cf6', css: '--accent' },
    { key: 'radius', section: 'style', type: 'number', default: 16, min: 0, max: 40, unit: 'px', css: '--radius' },

    ...animationFields('slide-up', 'fade', 400),
    customCssField()
  ],
  tests: ['pin'],
  actions: ['unpin'],
  panel: 'pin',
  cssTemplate: [
    { selector: '.pinned-card', declarations: { 'font-family': '{font}', 'font-size': '{fontSize}', 'color': '{textColor}', 'background': '{background}', 'border-color': '{accentColor}', 'border-radius': '{radius}' } },
    { selector: '.pinned-label', declarations: { background: '{accentColor}' } }
  ],
  cssClasses: [
    { id: 'root', selector: '.widget-root' },
    { id: 'pinnedCard', selector: '.pinned-card' },
    { id: 'pinnedLabel', selector: '.pinned-label' },
    { id: 'pinnedName', selector: '.pinned-name' },
    { id: 'pinnedText', selector: '.pinned-text' },
    { id: 'emote', selector: '.emote img' }
  ],
  presets: [
    { id: 'glass', values: { font: 'Outfit', fontSize: 22, emoteSize: 1.6, textColor: '#ffffff', background: 'rgba(12, 14, 20, 0.85)', accentColor: '#8b5cf6', radius: 16 } },
    { id: 'clean', values: { font: 'Inter', fontSize: 22, emoteSize: 1.6, textColor: '#111827', background: '#ffffff', accentColor: '#f59e0b', radius: 12 } },
    { id: 'neon', values: { font: 'Rubik', fontSize: 24, emoteSize: 1.8, textColor: '#e0f2fe', background: 'rgba(3, 7, 18, 0.9)', accentColor: '#22d3ee', radius: 6 } }
  ]
}
