import { customCssField, languageField, type WidgetDefinition } from './define'

export const goal: WidgetDefinition = {
  type: 'goal',
  icon: 'i-lucide-target',
  size: [700, 120],
  fields: [
    languageField(),
    { key: 'goalMetric', section: 'general', type: 'select', default: 'subs', options: ['follows', 'subs', 'bits', 'gifts'] },
    { key: 'goalSource', section: 'general', type: 'select', default: 'session', options: ['session', 'total'] },
    { key: 'goalTitle', section: 'general', type: 'text', default: '', max: 60 },
    { key: 'target', section: 'general', type: 'number', default: 10, min: 1, max: 1000000 },
    { key: 'startValue', section: 'general', type: 'number', default: 0, min: 0, max: 1000000 },
    { key: 'showNumbers', section: 'general', type: 'toggle', default: true },
    { key: 'celebrate', section: 'general', type: 'toggle', default: true },

    { key: 'font', section: 'style', type: 'font', default: 'Outfit', css: '--font' },
    { key: 'fontSize', section: 'style', type: 'number', default: 20, min: 10, max: 60, unit: 'px', css: '--font-size' },
    { key: 'textColor', section: 'style', type: 'color', default: '#ffffff', css: '--text' },
    { key: 'barColor', section: 'style', type: 'color', default: '#8b5cf6', css: '--bar' },
    { key: 'barColor2', section: 'style', type: 'color', default: '#ec4899', css: '--bar-2' },
    { key: 'barBackground', section: 'style', type: 'color', default: 'rgba(255, 255, 255, 0.1)', css: '--bar-bg' },
    { key: 'background', section: 'style', type: 'color', default: 'rgba(12, 14, 20, 0.8)', css: '--bg' },
    { key: 'barHeight', section: 'style', type: 'number', default: 22, min: 4, max: 80, unit: 'px', css: '--bar-height' },
    { key: 'radius', section: 'style', type: 'number', default: 999, min: 0, max: 999, unit: 'px', css: '--radius' },

    customCssField()
  ],
  tests: ['follow', 'sub', 'gifts', 'bits'],
  actions: ['increment', 'decrement', 'reset'],
  cssTemplate: [
    { selector: '.goal', declarations: { 'font-family': '{font}', 'font-size': '{fontSize}', 'color': '{textColor}', 'background': '{background}' } },
    { selector: '.goal-bar', declarations: { 'height': '{barHeight}', 'background': '{barBackground}', 'border-radius': '{radius}' } },
    { selector: '.goal-fill', declarations: { background: 'linear-gradient(90deg, {barColor}, {barColor2})' } }
  ],
  cssClasses: [
    { id: 'root', selector: '.widget-root' },
    { id: 'goal', selector: '.goal' },
    { id: 'goalTitle', selector: '.goal-title' },
    { id: 'goalNumbers', selector: '.goal-numbers' },
    { id: 'goalBar', selector: '.goal-bar' },
    { id: 'goalFill', selector: '.goal-fill' },
    { id: 'goalReached', selector: '.goal-reached' }
  ],
  presets: [
    { id: 'glass', values: { font: 'Outfit', fontSize: 20, textColor: '#ffffff', barColor: '#8b5cf6', barColor2: '#ec4899', barBackground: 'rgba(255, 255, 255, 0.1)', background: 'rgba(12, 14, 20, 0.8)', barHeight: 22, radius: 999 } },
    { id: 'neon', values: { font: 'Rubik', fontSize: 20, textColor: '#e0f2fe', barColor: '#22d3ee', barColor2: '#a3e635', barBackground: 'rgba(34, 211, 238, 0.12)', background: 'rgba(3, 7, 18, 0.9)', barHeight: 16, radius: 4 } },
    { id: 'clean', values: { font: 'Inter', fontSize: 18, textColor: '#111827', barColor: '#2563eb', barColor2: '#2563eb', barBackground: '#e5e7eb', background: '#ffffff', barHeight: 14, radius: 999 } },
    { id: 'minimal', values: { font: 'Montserrat', fontSize: 22, textColor: '#ffffff', barColor: '#ffffff', barColor2: '#ffffff', barBackground: 'rgba(255, 255, 255, 0.2)', background: 'transparent', barHeight: 8, radius: 0 } }
  ]
}
