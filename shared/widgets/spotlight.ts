import { animationFields, customCssField, permissionField, type WidgetDefinition } from './define'

export const spotlight: WidgetDefinition = {
  type: 'spotlight',
  icon: 'i-lucide-message-square-quote',
  category: 'chat',
  size: [1000, 300],
  fields: [
    { key: 'onHighlighted', section: 'triggers', type: 'toggle', default: true },
    { key: 'onBits', section: 'triggers', type: 'toggle', default: true },
    { key: 'minBits', section: 'triggers', type: 'number', default: 100, min: 1, max: 100000 },
    { key: 'spotlightCommand', section: 'triggers', type: 'text', default: '!msg', max: 30 },
    { ...permissionField('commandPermission', 'subscribers'), section: 'triggers' },

    { key: 'holdTime', section: 'general', type: 'number', default: 8, min: 2, max: 60, step: 0.5, unit: 's' },
    { key: 'showBadges', section: 'general', type: 'toggle', default: true },
    { key: 'sound', section: 'general', type: 'sound', default: '' },
    { key: 'volume', section: 'general', type: 'number', default: 80, min: 0, max: 100, unit: '%' },

    { key: 'font', section: 'style', type: 'font', default: 'Poppins', css: '--font' },
    { key: 'fontSize', section: 'style', type: 'number', default: 30, min: 12, max: 80, unit: 'px', css: '--font-size' },
    { key: 'emoteSize', section: 'style', type: 'number', default: 1.6, min: 1, max: 5, step: 0.1, unit: 'em', css: '--emote-size' },
    { key: 'textColor', section: 'style', type: 'color', default: '#ffffff', css: '--text' },
    { key: 'background', section: 'style', type: 'color', default: 'rgba(12, 14, 20, 0.88)', css: '--bg' },
    { key: 'accentColor', section: 'style', type: 'color', default: '#a855f7', css: '--accent' },
    { key: 'radius', section: 'style', type: 'number', default: 20, min: 0, max: 40, unit: 'px', css: '--radius' },

    ...animationFields('zoom', 'blur', 500),
    customCssField()
  ],
  tests: ['highlight'],
  cssTemplate: [
    { selector: '.spotlight-card', declarations: { 'font-family': '{font}', 'font-size': '{fontSize}', 'color': '{textColor}', 'background': '{background}', 'border-color': '{accentColor}', 'border-radius': '{radius}' } },
    { selector: '.spotlight-name', declarations: { color: '{accentColor}' } }
  ],
  cssClasses: [
    { id: 'root', selector: '.widget-root' },
    { id: 'spotlightCard', selector: '.spotlight-card' },
    { id: 'spotlightName', selector: '.spotlight-name' },
    { id: 'spotlightBits', selector: '.spotlight-bits' },
    { id: 'spotlightText', selector: '.spotlight-text' },
    { id: 'emote', selector: '.emote img' }
  ],
  presets: [
    { id: 'glass', values: { font: 'Poppins', fontSize: 30, emoteSize: 1.6, textColor: '#ffffff', background: 'rgba(12, 14, 20, 0.88)', accentColor: '#a855f7', radius: 20 } },
    { id: 'gold', values: { font: 'Montserrat', fontSize: 30, emoteSize: 1.6, textColor: '#fffbeb', background: 'rgba(41, 22, 4, 0.92)', accentColor: '#fbbf24', radius: 12 } },
    { id: 'clean', values: { font: 'Inter', fontSize: 28, emoteSize: 1.6, textColor: '#111827', background: '#ffffff', accentColor: '#9333ea', radius: 16 } }
  ]
}
