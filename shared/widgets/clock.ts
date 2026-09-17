import { customCssField, languageField, type WidgetDefinition } from './define'

export const clock: WidgetDefinition = {
  type: 'clock',
  icon: 'i-lucide-clock',
  category: 'progress',
  size: [400, 120],
  fields: [
    languageField(),
    { key: 'clockMode', section: 'general', type: 'select', default: 'clock', options: ['clock', 'date', 'uptime', 'countdown'] },
    { key: 'clockLabel', section: 'general', type: 'text', default: '', max: 40 },
    { key: 'showLabel', section: 'general', type: 'toggle', default: true },
    { key: 'hour12', section: 'general', type: 'toggle', default: false },
    { key: 'showSeconds', section: 'general', type: 'toggle', default: true },
    { key: 'countdownTo', section: 'general', type: 'time', default: '' },

    { key: 'font', section: 'style', type: 'font', default: 'JetBrains Mono', css: '--font' },
    { key: 'fontSize', section: 'style', type: 'number', default: 40, min: 10, max: 200, unit: 'px', css: '--font-size' },
    { key: 'textColor', section: 'style', type: 'color', default: '#ffffff', css: '--text' },
    { key: 'labelColor', section: 'style', type: 'color', default: '#a1a1aa', css: '--label' },
    { key: 'background', section: 'style', type: 'color', default: 'rgba(12, 14, 20, 0.8)', css: '--bg' },
    { key: 'radius', section: 'style', type: 'number', default: 14, min: 0, max: 40, unit: 'px', css: '--radius' },

    customCssField()
  ],
  tests: [],
  cssTemplate: [
    { selector: '.clock', declarations: { 'font-family': '{font}', 'background': '{background}', 'border-radius': '{radius}' } },
    { selector: '.clock-time', declarations: { 'font-size': '{fontSize}', 'color': '{textColor}' } },
    { selector: '.clock-label', declarations: { color: '{labelColor}' } }
  ],
  cssClasses: [
    { id: 'root', selector: '.widget-root' },
    { id: 'clock', selector: '.clock' },
    { id: 'clockLabel', selector: '.clock-label' },
    { id: 'clockTime', selector: '.clock-time' }
  ],
  presets: [
    { id: 'glass', values: { font: 'JetBrains Mono', fontSize: 40, textColor: '#ffffff', labelColor: '#a1a1aa', background: 'rgba(12, 14, 20, 0.8)', radius: 14 } },
    { id: 'minimal', values: { font: 'Montserrat', fontSize: 48, textColor: '#ffffff', labelColor: '#e4e4e7', background: 'transparent', radius: 0 } },
    { id: 'neon', values: { font: 'Rubik', fontSize: 44, textColor: '#67e8f9', labelColor: '#f0abfc', background: 'rgba(3, 7, 18, 0.9)', radius: 6 } },
    { id: 'retro', values: { font: 'Press Start 2P', fontSize: 24, textColor: '#fde047', labelColor: '#a5f3fc', background: 'rgba(30, 27, 75, 0.9)', radius: 0 } }
  ]
}
