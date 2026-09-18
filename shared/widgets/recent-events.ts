import { customCssField, languageField, type WidgetDefinition } from './define'

export const recentEvents: WidgetDefinition = {
  type: 'recent-events',
  icon: 'i-lucide-history',
  category: 'alerts',
  size: [1200, 80],
  fields: [
    languageField(),
    { key: 'showFollow', section: 'general', type: 'toggle', default: true },
    { key: 'showSub', section: 'general', type: 'toggle', default: true },
    { key: 'showGifts', section: 'general', type: 'toggle', default: true },
    { key: 'showRaid', section: 'general', type: 'toggle', default: true },
    { key: 'showBits', section: 'general', type: 'toggle', default: false },
    { key: 'showDonation', section: 'general', type: 'toggle', default: true },
    { key: 'recentLayout', section: 'general', type: 'select', default: 'row', options: ['row', 'column', 'ticker'] },
    { key: 'tickerInterval', section: 'general', type: 'number', default: 5, min: 2, max: 60, unit: 's' },

    { key: 'font', section: 'style', type: 'font', default: 'Outfit', css: '--font' },
    { key: 'fontSize', section: 'style', type: 'number', default: 18, min: 10, max: 48, unit: 'px', css: '--font-size' },
    { key: 'textColor', section: 'style', type: 'color', default: '#ffffff', css: '--text' },
    { key: 'labelColor', section: 'style', type: 'color', default: '#a1a1aa', css: '--label' },
    { key: 'accentColor', section: 'style', type: 'color', default: '#8b5cf6', css: '--accent' },
    { key: 'background', section: 'style', type: 'color', default: 'rgba(12, 14, 20, 0.8)', css: '--bg' },
    { key: 'radius', section: 'style', type: 'number', default: 12, min: 0, max: 40, unit: 'px', css: '--radius' },
    { key: 'gap', section: 'style', type: 'number', default: 12, min: 0, max: 60, unit: 'px', css: '--gap' },
    { key: 'showIcons', section: 'style', type: 'toggle', default: true },

    customCssField()
  ],
  tests: ['follow', 'sub', 'gifts', 'raid', 'bits', 'donation'],
  actions: ['reset'],
  cssTemplate: [
    { selector: '.recent', declarations: { 'font-family': '{font}', 'font-size': '{fontSize}', 'gap': '{gap}' } },
    { selector: '.recent-item', declarations: { 'color': '{textColor}', 'background': '{background}', 'border-radius': '{radius}' } },
    { selector: '.recent-label', declarations: { color: '{labelColor}' } },
    { selector: '.recent-icon', declarations: { color: '{accentColor}' } }
  ],
  cssClasses: [
    { id: 'root', selector: '.widget-root' },
    { id: 'recent', selector: '.recent' },
    { id: 'recentItem', selector: '.recent-item' },
    { id: 'recentIcon', selector: '.recent-icon' },
    { id: 'recentLabel', selector: '.recent-label' },
    { id: 'recentName', selector: '.recent-name' }
  ],
  presets: [
    { id: 'glass', values: { font: 'Outfit', fontSize: 18, textColor: '#ffffff', labelColor: '#a1a1aa', accentColor: '#8b5cf6', background: 'rgba(12, 14, 20, 0.8)', radius: 12, gap: 12, showIcons: true } },
    { id: 'clean', values: { font: 'Inter', fontSize: 18, textColor: '#111827', labelColor: '#6b7280', accentColor: '#2563eb', background: '#ffffff', radius: 10, gap: 10, showIcons: true } },
    { id: 'minimal', values: { font: 'Montserrat', fontSize: 20, textColor: '#ffffff', labelColor: '#d4d4d8', accentColor: '#facc15', background: 'transparent', radius: 0, gap: 32, showIcons: false } },
    { id: 'broadcast', values: { font: 'Bebas Neue', fontSize: 26, textColor: '#ffffff', labelColor: '#fecaca', accentColor: '#ffffff', background: '#dc2626', radius: 0, gap: 0, showIcons: true } }
  ]
}
