import { animationFields, customCssField, languageField, type WidgetDefinition } from './define'

export const firstMessage: WidgetDefinition = {
  type: 'first-message',
  icon: 'i-lucide-hand',
  size: [700, 200],
  fields: [
    languageField(),
    { key: 'firstMode', section: 'general', type: 'select', default: 'firstEver', options: ['firstEver', 'firstInSession'] },
    { key: 'welcomeText', section: 'general', type: 'text', default: '', max: 120 },
    { key: 'showMessage', section: 'general', type: 'toggle', default: true },
    { key: 'holdTime', section: 'general', type: 'number', default: 5, min: 1, max: 30, step: 0.5, unit: 's' },
    { key: 'ignoredUsers', section: 'general', type: 'list', default: [] },
    { key: 'sound', section: 'general', type: 'sound', default: '' },
    { key: 'volume', section: 'general', type: 'number', default: 80, min: 0, max: 100, unit: '%' },

    { key: 'font', section: 'style', type: 'font', default: 'Outfit', css: '--font' },
    { key: 'fontSize', section: 'style', type: 'number', default: 22, min: 10, max: 60, unit: 'px', css: '--font-size' },
    { key: 'emoteSize', section: 'style', type: 'number', default: 1.6, min: 1, max: 5, step: 0.1, unit: 'em', css: '--emote-size' },
    { key: 'textColor', section: 'style', type: 'color', default: '#ffffff', css: '--text' },
    { key: 'background', section: 'style', type: 'color', default: 'rgba(12, 14, 20, 0.85)', css: '--bg' },
    { key: 'accentColor', section: 'style', type: 'color', default: '#34d399', css: '--accent' },
    { key: 'radius', section: 'style', type: 'number', default: 16, min: 0, max: 40, unit: 'px', css: '--radius' },

    ...animationFields('slide-right', 'slide-left', 450),
    customCssField()
  ],
  tests: ['first'],
  actions: ['reset'],
  cssTemplate: [
    { selector: '.first-card', declarations: { 'font-family': '{font}', 'font-size': '{fontSize}', 'color': '{textColor}', 'background': '{background}', 'border-color': '{accentColor}', 'border-radius': '{radius}' } },
    { selector: '.first-welcome', declarations: { color: '{accentColor}' } }
  ],
  cssClasses: [
    { id: 'root', selector: '.widget-root' },
    { id: 'firstCard', selector: '.first-card' },
    { id: 'firstName', selector: '.first-name' },
    { id: 'firstWelcome', selector: '.first-welcome' },
    { id: 'firstText', selector: '.first-text' },
    { id: 'emote', selector: '.emote img' }
  ],
  presets: [
    { id: 'glass', values: { font: 'Outfit', fontSize: 22, emoteSize: 1.6, textColor: '#ffffff', background: 'rgba(12, 14, 20, 0.85)', accentColor: '#34d399', radius: 16 } },
    { id: 'clean', values: { font: 'Inter', fontSize: 22, emoteSize: 1.6, textColor: '#111827', background: '#ffffff', accentColor: '#059669', radius: 12 } },
    { id: 'party', values: { font: 'Rubik', fontSize: 24, emoteSize: 1.8, textColor: '#fdf4ff', background: 'rgba(59, 7, 100, 0.9)', accentColor: '#f0abfc', radius: 28 } }
  ]
}
