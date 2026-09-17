import { customCssField, languageField, permissionField, type WidgetDefinition } from './define'

export const counter: WidgetDefinition = {
  type: 'counter',
  icon: 'i-lucide-skull',
  category: 'interactive',
  size: [500, 160],
  fields: [
    languageField(),
    { key: 'counterLabel', section: 'general', type: 'text', default: '', max: 40 },
    { key: 'command', section: 'general', type: 'text', default: '!death', max: 30 },
    permissionField('permission', 'moderators'),
    { key: 'step', section: 'general', type: 'number', default: 1, min: 1, max: 100 },
    { key: 'cooldown', section: 'general', type: 'number', default: 2, min: 0, max: 60, unit: 's' },
    { key: 'popOnChange', section: 'general', type: 'toggle', default: true },

    { key: 'font', section: 'style', type: 'font', default: 'Bebas Neue', css: '--font' },
    { key: 'fontSize', section: 'style', type: 'number', default: 48, min: 12, max: 200, unit: 'px', css: '--font-size' },
    { key: 'labelColor', section: 'style', type: 'color', default: '#e5e7eb', css: '--label' },
    { key: 'valueColor', section: 'style', type: 'color', default: '#f43f5e', css: '--value' },
    { key: 'background', section: 'style', type: 'color', default: 'rgba(12, 14, 20, 0.8)', css: '--bg' },
    { key: 'radius', section: 'style', type: 'number', default: 16, min: 0, max: 60, unit: 'px', css: '--radius' },
    { key: 'layout', section: 'style', type: 'select', default: 'row', options: ['row', 'column'] },

    customCssField()
  ],
  tests: ['command'],
  actions: ['increment', 'decrement', 'reset'],
  cssTemplate: [
    { selector: '.counter', declarations: { 'font-family': '{font}', 'font-size': '{fontSize}', 'background': '{background}', 'border-radius': '{radius}' } },
    { selector: '.counter-label', declarations: { color: '{labelColor}' } },
    { selector: '.counter-value', declarations: { color: '{valueColor}' } }
  ],
  cssClasses: [
    { id: 'root', selector: '.widget-root' },
    { id: 'counter', selector: '.counter' },
    { id: 'counterLabel', selector: '.counter-label' },
    { id: 'counterValue', selector: '.counter-value' }
  ],
  presets: [
    { id: 'glass', values: { font: 'Bebas Neue', fontSize: 48, labelColor: '#e5e7eb', valueColor: '#f43f5e', background: 'rgba(12, 14, 20, 0.8)', radius: 16, layout: 'row' } },
    { id: 'bold', values: { font: 'Rubik', fontSize: 56, labelColor: '#fef3c7', valueColor: '#facc15', background: 'rgba(69, 10, 10, 0.9)', radius: 999, layout: 'row' } },
    { id: 'minimal', values: { font: 'Montserrat', fontSize: 40, labelColor: '#ffffff', valueColor: '#ffffff', background: 'transparent', radius: 0, layout: 'column' } },
    { id: 'retro', values: { font: 'Press Start 2P', fontSize: 24, labelColor: '#a5f3fc', valueColor: '#fde047', background: 'rgba(30, 27, 75, 0.9)', radius: 0, layout: 'row' } }
  ]
}
