import { animationFields, customCssField, type WidgetDefinition } from './define'

export const lowerThird: WidgetDefinition = {
  type: 'lower-third',
  icon: 'i-lucide-panel-bottom',
  size: [900, 200],
  fields: [
    { key: 'thirdTitle', section: 'general', type: 'text', default: '', max: 60 },
    { key: 'subtitle', section: 'general', type: 'text', default: '', max: 120 },
    { key: 'align', section: 'general', type: 'select', default: 'left', options: ['left', 'right'] },
    { key: 'showMode', section: 'general', type: 'select', default: 'always', options: ['always', 'interval'] },
    { key: 'showFor', section: 'general', type: 'number', default: 10, min: 2, max: 600, unit: 's' },
    { key: 'hideFor', section: 'general', type: 'number', default: 60, min: 2, max: 3600, unit: 's' },

    { key: 'font', section: 'style', type: 'font', default: 'Montserrat', css: '--font' },
    { key: 'titleSize', section: 'style', type: 'number', default: 44, min: 12, max: 120, unit: 'px', css: '--title-size' },
    { key: 'subtitleSize', section: 'style', type: 'number', default: 22, min: 10, max: 80, unit: 'px', css: '--subtitle-size' },
    { key: 'textColor', section: 'style', type: 'color', default: '#ffffff', css: '--text' },
    { key: 'subtitleColor', section: 'style', type: 'color', default: '#d4d4d8', css: '--subtitle' },
    { key: 'accentColor', section: 'style', type: 'color', default: '#8b5cf6', css: '--accent' },
    { key: 'background', section: 'style', type: 'color', default: 'rgba(12, 14, 20, 0.85)', css: '--bg' },
    { key: 'radius', section: 'style', type: 'number', default: 8, min: 0, max: 40, unit: 'px', css: '--radius' },

    ...animationFields('slide-right', 'slide-left', 600),
    customCssField()
  ],
  tests: [],
  cssTemplate: [
    { selector: '.lower-third', declarations: { 'font-family': '{font}', 'background': '{background}', 'border-radius': '{radius}' } },
    { selector: '.lower-third-accent', declarations: { background: '{accentColor}' } },
    { selector: '.lower-third-title', declarations: { 'font-size': '{titleSize}', 'color': '{textColor}' } },
    { selector: '.lower-third-subtitle', declarations: { 'font-size': '{subtitleSize}', 'color': '{subtitleColor}' } }
  ],
  cssClasses: [
    { id: 'root', selector: '.widget-root' },
    { id: 'lowerThird', selector: '.lower-third' },
    { id: 'lowerThirdAccent', selector: '.lower-third-accent' },
    { id: 'lowerThirdTitle', selector: '.lower-third-title' },
    { id: 'lowerThirdSubtitle', selector: '.lower-third-subtitle' }
  ],
  presets: [
    { id: 'glass', values: { font: 'Montserrat', titleSize: 44, subtitleSize: 22, textColor: '#ffffff', subtitleColor: '#d4d4d8', accentColor: '#8b5cf6', background: 'rgba(12, 14, 20, 0.85)', radius: 8 } },
    { id: 'broadcast', values: { font: 'Bebas Neue', titleSize: 56, subtitleSize: 26, textColor: '#ffffff', subtitleColor: '#fee2e2', accentColor: '#ffffff', background: '#dc2626', radius: 0 } },
    { id: 'clean', values: { font: 'Inter', titleSize: 40, subtitleSize: 20, textColor: '#111827', subtitleColor: '#4b5563', accentColor: '#2563eb', background: '#ffffff', radius: 12 } },
    { id: 'neon', values: { font: 'Rubik', titleSize: 44, subtitleSize: 22, textColor: '#e0f2fe', subtitleColor: '#a5f3fc', accentColor: '#22d3ee', background: 'rgba(3, 7, 18, 0.9)', radius: 4 } }
  ]
}
