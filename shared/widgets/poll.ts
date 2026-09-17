import { animationFields, customCssField, languageField, type WidgetDefinition } from './define'

export const poll: WidgetDefinition = {
  type: 'poll',
  icon: 'i-lucide-chart-bar-big',
  category: 'interactive',
  size: [600, 400],
  fields: [
    languageField(),
    { key: 'question', section: 'general', type: 'text', default: '', max: 120 },
    { key: 'pollOptions', section: 'general', type: 'list', default: ['Yes', 'No'] },
    { key: 'commandPrefix', section: 'general', type: 'text', default: '!', max: 10 },
    { key: 'allowChange', section: 'general', type: 'toggle', default: true },
    { key: 'autoClose', section: 'general', type: 'number', default: 0, min: 0, max: 3600, unit: 's' },
    { key: 'showPercent', section: 'general', type: 'toggle', default: true },
    { key: 'hideWhenClosed', section: 'general', type: 'toggle', default: false },

    { key: 'font', section: 'style', type: 'font', default: 'Outfit', css: '--font' },
    { key: 'fontSize', section: 'style', type: 'number', default: 20, min: 10, max: 60, unit: 'px', css: '--font-size' },
    { key: 'textColor', section: 'style', type: 'color', default: '#ffffff', css: '--text' },
    { key: 'background', section: 'style', type: 'color', default: 'rgba(12, 14, 20, 0.8)', css: '--bg' },
    { key: 'barColor', section: 'style', type: 'color', default: '#8b5cf6', css: '--bar' },
    { key: 'barBackground', section: 'style', type: 'color', default: 'rgba(255, 255, 255, 0.08)', css: '--bar-bg' },
    { key: 'winnerColor', section: 'style', type: 'color', default: '#22c55e', css: '--winner' },
    { key: 'radius', section: 'style', type: 'number', default: 16, min: 0, max: 40, unit: 'px', css: '--radius' },

    ...animationFields('slide-up', 'fade', 500),
    customCssField()
  ],
  tests: ['vote'],
  actions: ['start', 'stop', 'reset'],
  cssTemplate: [
    { selector: '.poll', declarations: { 'font-family': '{font}', 'font-size': '{fontSize}', 'color': '{textColor}', 'background': '{background}', 'border-radius': '{radius}' } },
    { selector: '.poll-bar', declarations: { background: '{barBackground}' } },
    { selector: '.poll-fill', declarations: { background: '{barColor}' } },
    { selector: '.poll-winner .poll-fill', declarations: { background: '{winnerColor}' } }
  ],
  cssClasses: [
    { id: 'root', selector: '.widget-root' },
    { id: 'poll', selector: '.poll' },
    { id: 'pollQuestion', selector: '.poll-question' },
    { id: 'pollOption', selector: '.poll-option' },
    { id: 'pollBar', selector: '.poll-bar' },
    { id: 'pollFill', selector: '.poll-fill' },
    { id: 'pollLabel', selector: '.poll-label' },
    { id: 'pollCount', selector: '.poll-count' },
    { id: 'pollWinner', selector: '.poll-winner' },
    { id: 'pollFooter', selector: '.poll-footer' }
  ],
  presets: [
    { id: 'glass', values: { font: 'Outfit', fontSize: 20, textColor: '#ffffff', background: 'rgba(12, 14, 20, 0.8)', barColor: '#8b5cf6', barBackground: 'rgba(255, 255, 255, 0.08)', winnerColor: '#22c55e', radius: 16 } },
    { id: 'clean', values: { font: 'Inter', fontSize: 20, textColor: '#111827', background: '#ffffff', barColor: '#3b82f6', barBackground: '#e5e7eb', winnerColor: '#16a34a', radius: 12 } },
    { id: 'neon', values: { font: 'Rubik', fontSize: 22, textColor: '#e0f2fe', background: 'rgba(3, 7, 18, 0.9)', barColor: '#22d3ee', barBackground: 'rgba(34, 211, 238, 0.12)', winnerColor: '#f472b6', radius: 6 } },
    { id: 'minimal', values: { font: 'Montserrat', fontSize: 24, textColor: '#ffffff', background: 'transparent', barColor: '#ffffff', barBackground: 'rgba(255, 255, 255, 0.2)', winnerColor: '#facc15', radius: 0 } }
  ]
}
