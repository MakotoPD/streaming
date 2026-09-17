import { animationFields, customCssField, type WidgetDefinition } from './define'
import { SOCIALS } from './scene'

export const socials: WidgetDefinition = {
  type: 'socials',
  icon: 'i-lucide-at-sign',
  category: 'scene',
  size: [500, 100],
  fields: [
    ...SOCIALS.map(s => ({ key: `social.${s}`, section: 'general', label: s, type: 'text' as const, default: '', max: 60 })),
    { key: 'socialsLayout', section: 'general', type: 'select', default: 'rotate', options: ['rotate', 'row', 'column'] },
    { key: 'interval', section: 'general', type: 'number', default: 5, min: 2, max: 60, unit: 's' },

    { key: 'font', section: 'style', type: 'font', default: 'Outfit', css: '--font' },
    { key: 'fontSize', section: 'style', type: 'number', default: 24, min: 10, max: 80, unit: 'px', css: '--font-size' },
    { key: 'textColor', section: 'style', type: 'color', default: '#ffffff', css: '--text' },
    { key: 'iconColor', section: 'style', type: 'select', default: 'brand', options: ['brand', 'text'] },
    { key: 'background', section: 'style', type: 'color', default: 'rgba(12, 14, 20, 0.8)', css: '--bg' },
    { key: 'radius', section: 'style', type: 'number', default: 999, min: 0, max: 999, unit: 'px', css: '--radius' },
    { key: 'gap', section: 'style', type: 'number', default: 16, min: 0, max: 60, unit: 'px', css: '--gap' },

    ...animationFields('slide-up', 'slide-up', 400),
    customCssField()
  ],
  tests: [],
  cssTemplate: [
    { selector: '.socials', declarations: { 'font-family': '{font}', 'font-size': '{fontSize}', 'gap': '{gap}' } },
    { selector: '.socials-item', declarations: { 'color': '{textColor}', 'background': '{background}', 'border-radius': '{radius}' } }
  ],
  cssClasses: [
    { id: 'root', selector: '.widget-root' },
    { id: 'socials', selector: '.socials' },
    { id: 'socialsItem', selector: '.socials-item' },
    { id: 'socialsIcon', selector: '.socials-icon' },
    { id: 'socialsHandle', selector: '.socials-handle' }
  ],
  presets: [
    { id: 'glass', values: { font: 'Outfit', fontSize: 24, textColor: '#ffffff', iconColor: 'brand', background: 'rgba(12, 14, 20, 0.8)', radius: 999, gap: 16 } },
    { id: 'minimal', values: { font: 'Montserrat', fontSize: 26, textColor: '#ffffff', iconColor: 'text', background: 'transparent', radius: 0, gap: 32 } },
    { id: 'clean', values: { font: 'Inter', fontSize: 22, textColor: '#111827', iconColor: 'brand', background: '#ffffff', radius: 12, gap: 12 } }
  ]
}
