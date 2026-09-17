import { customCssField, languageField, type WidgetDefinition } from './define'

export const marquee: WidgetDefinition = {
  type: 'marquee',
  icon: 'i-lucide-text-cursor-input',
  size: [1920, 60],
  fields: [
    languageField(),
    { key: 'lines', section: 'general', type: 'list', default: [] },
    { key: 'separator', section: 'general', type: 'text', default: '•', max: 10 },
    { key: 'speed', section: 'general', type: 'number', default: 80, min: 10, max: 600, unit: 'px/s' },
    { key: 'marqueeDirection', section: 'general', type: 'select', default: 'left', options: ['left', 'right'] },

    { key: 'font', section: 'style', type: 'font', default: 'Outfit', css: '--font' },
    { key: 'fontSize', section: 'style', type: 'number', default: 24, min: 10, max: 80, unit: 'px', css: '--font-size' },
    { key: 'textColor', section: 'style', type: 'color', default: '#ffffff', css: '--text' },
    { key: 'separatorColor', section: 'style', type: 'color', default: '#8b5cf6', css: '--separator' },
    { key: 'background', section: 'style', type: 'color', default: 'rgba(12, 14, 20, 0.85)', css: '--bg' },
    { key: 'gap', section: 'style', type: 'number', default: 32, min: 0, max: 200, unit: 'px', css: '--gap' },

    customCssField()
  ],
  tests: [],
  cssTemplate: [
    { selector: '.marquee', declarations: { 'font-family': '{font}', 'font-size': '{fontSize}', 'color': '{textColor}', 'background': '{background}' } },
    { selector: '.marquee-track', declarations: { gap: '{gap}' } },
    { selector: '.marquee-separator', declarations: { color: '{separatorColor}' } }
  ],
  cssClasses: [
    { id: 'root', selector: '.widget-root' },
    { id: 'marquee', selector: '.marquee' },
    { id: 'marqueeTrack', selector: '.marquee-track' },
    { id: 'marqueeItem', selector: '.marquee-item' },
    { id: 'marqueeSeparator', selector: '.marquee-separator' }
  ],
  presets: [
    { id: 'glass', values: { font: 'Outfit', fontSize: 24, textColor: '#ffffff', separatorColor: '#8b5cf6', background: 'rgba(12, 14, 20, 0.85)', gap: 32 } },
    { id: 'broadcast', values: { font: 'Bebas Neue', fontSize: 32, textColor: '#ffffff', separatorColor: '#fecaca', background: '#dc2626', gap: 40 } },
    { id: 'clean', values: { font: 'Inter', fontSize: 22, textColor: '#111827', separatorColor: '#2563eb', background: '#ffffff', gap: 28 } }
  ]
}
