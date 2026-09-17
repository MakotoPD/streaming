import { animationFields, customCssField, languageField, type WidgetDefinition } from './define'

export const giveaway: WidgetDefinition = {
  type: 'giveaway',
  icon: 'i-lucide-ticket',
  size: [600, 320],
  fields: [
    languageField(),
    { key: 'giveawayTitle', section: 'general', type: 'text', default: '', max: 60 },
    { key: 'keyword', section: 'general', type: 'text', default: '!join', max: 30 },
    { key: 'eligibility', section: 'general', type: 'select', default: 'everyone', options: ['everyone', 'subscribers'] },
    { key: 'showEntries', section: 'general', type: 'toggle', default: true },
    { key: 'rollDuration', section: 'general', type: 'number', default: 4, min: 0, max: 20, step: 0.5, unit: 's' },
    { key: 'sound', section: 'general', type: 'sound', default: '/sounds/wide.mp3' },
    { key: 'volume', section: 'general', type: 'number', default: 80, min: 0, max: 100, unit: '%' },

    { key: 'font', section: 'style', type: 'font', default: 'Poppins', css: '--font' },
    { key: 'fontSize', section: 'style', type: 'number', default: 22, min: 10, max: 60, unit: 'px', css: '--font-size' },
    { key: 'textColor', section: 'style', type: 'color', default: '#ffffff', css: '--text' },
    { key: 'background', section: 'style', type: 'color', default: 'rgba(12, 14, 20, 0.85)', css: '--bg' },
    { key: 'accentColor', section: 'style', type: 'color', default: '#f59e0b', css: '--accent' },
    { key: 'radius', section: 'style', type: 'number', default: 20, min: 0, max: 40, unit: 'px', css: '--radius' },

    ...animationFields('pop', 'fade', 500),
    customCssField()
  ],
  tests: ['join'],
  actions: ['open', 'close', 'draw', 'reset'],
  cssTemplate: [
    { selector: '.giveaway', declarations: { 'font-family': '{font}', 'font-size': '{fontSize}', 'color': '{textColor}', 'background': '{background}', 'border-radius': '{radius}' } },
    { selector: '.giveaway-winner', declarations: { color: '{accentColor}' } }
  ],
  cssClasses: [
    { id: 'root', selector: '.widget-root' },
    { id: 'giveaway', selector: '.giveaway' },
    { id: 'giveawayTitle', selector: '.giveaway-title' },
    { id: 'giveawayHint', selector: '.giveaway-hint' },
    { id: 'giveawayCount', selector: '.giveaway-count' },
    { id: 'giveawayRoll', selector: '.giveaway-roll' },
    { id: 'giveawayWinner', selector: '.giveaway-winner' }
  ],
  presets: [
    { id: 'glass', values: { font: 'Poppins', fontSize: 22, textColor: '#ffffff', background: 'rgba(12, 14, 20, 0.85)', accentColor: '#f59e0b', radius: 20 } },
    { id: 'party', values: { font: 'Rubik', fontSize: 24, textColor: '#fdf4ff', background: 'rgba(76, 5, 25, 0.9)', accentColor: '#f472b6', radius: 28 } },
    { id: 'clean', values: { font: 'Inter', fontSize: 22, textColor: '#111827', background: '#ffffff', accentColor: '#7c3aed', radius: 12 } }
  ]
}
