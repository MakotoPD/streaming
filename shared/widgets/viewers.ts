import { customCssField, languageField, type WidgetDefinition } from './define'

export const viewers: WidgetDefinition = {
  type: 'viewers',
  icon: 'i-lucide-eye',
  category: 'progress',
  size: [400, 80],
  fields: [
    languageField(),
    { key: 'showTwitch', section: 'general', type: 'toggle', default: true },
    { key: 'showKick', section: 'general', type: 'toggle', default: true },
    { key: 'showYouTube', section: 'general', type: 'toggle', default: true },
    { key: 'combine', section: 'general', type: 'toggle', default: false },
    { key: 'showLabel', section: 'general', type: 'toggle', default: true },
    { key: 'hideWhenOffline', section: 'general', type: 'toggle', default: false },

    { key: 'font', section: 'style', type: 'font', default: 'Outfit', css: '--font' },
    { key: 'fontSize', section: 'style', type: 'number', default: 26, min: 10, max: 80, unit: 'px', css: '--font-size' },
    { key: 'textColor', section: 'style', type: 'color', default: '#ffffff', css: '--text' },
    { key: 'iconColor', section: 'style', type: 'select', default: 'brand', options: ['brand', 'text'] },
    { key: 'background', section: 'style', type: 'color', default: 'rgba(12, 14, 20, 0.8)', css: '--bg' },
    { key: 'radius', section: 'style', type: 'number', default: 999, min: 0, max: 999, unit: 'px', css: '--radius' },
    { key: 'gap', section: 'style', type: 'number', default: 10, min: 0, max: 60, unit: 'px', css: '--gap' },

    customCssField()
  ],
  tests: [],
  cssTemplate: [
    { selector: '.viewers', declarations: { 'font-family': '{font}', 'font-size': '{fontSize}', 'gap': '{gap}' } },
    { selector: '.viewers-item', declarations: { 'color': '{textColor}', 'background': '{background}', 'border-radius': '{radius}' } }
  ],
  cssClasses: [
    { id: 'root', selector: '.widget-root' },
    { id: 'viewers', selector: '.viewers' },
    { id: 'viewersItem', selector: '.viewers-item' },
    { id: 'viewersDot', selector: '.viewers-dot' },
    { id: 'viewersIcon', selector: '.viewers-icon' },
    { id: 'viewersCount', selector: '.viewers-count' },
    { id: 'viewersLabel', selector: '.viewers-label' }
  ],
  presets: [
    { id: 'glass', values: { font: 'Outfit', fontSize: 26, textColor: '#ffffff', iconColor: 'brand', background: 'rgba(12, 14, 20, 0.8)', radius: 999, gap: 10 } },
    { id: 'minimal', values: { font: 'Montserrat', fontSize: 28, textColor: '#ffffff', iconColor: 'text', background: 'transparent', radius: 0, gap: 24 } },
    { id: 'clean', values: { font: 'Inter', fontSize: 24, textColor: '#111827', iconColor: 'brand', background: '#ffffff', radius: 12, gap: 8 } }
  ]
}
