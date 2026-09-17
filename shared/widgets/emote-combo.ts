import { animationFields, customCssField, type WidgetDefinition } from './define'

export const emoteCombo: WidgetDefinition = {
  type: 'emote-combo',
  icon: 'i-lucide-flame',
  size: [500, 200],
  fields: [
    { key: 'minMessages', section: 'general', type: 'number', default: 3, min: 2, max: 50 },
    { key: 'window', section: 'general', type: 'number', default: 15, min: 3, max: 120, unit: 's' },
    { key: 'position', section: 'general', type: 'select', default: 'bottom-left', options: ['top-left', 'top-right', 'bottom-left', 'bottom-right', 'center'] },
    { key: 'bounce', section: 'general', type: 'toggle', default: true },
    { key: 'popScale', section: 'general', type: 'number', default: 1.2, min: 1, max: 2, step: 0.05 },
    { key: 'popRotate', section: 'general', type: 'number', default: 10, min: 0, max: 45, unit: '°' },

    { key: 'font', section: 'style', type: 'font', default: 'Outfit', css: '--font' },
    { key: 'emoteSize', section: 'style', type: 'number', default: 48, min: 16, max: 200, unit: 'px', css: '--emote-size' },
    { key: 'fontSize', section: 'style', type: 'number', default: 32, min: 10, max: 120, unit: 'px', css: '--font-size' },
    { key: 'textColor', section: 'style', type: 'color', default: '#ffffff', css: '--text' },
    { key: 'numberColor', section: 'style', type: 'color', default: '#ff5c97', css: '--accent' },
    { key: 'background', section: 'style', type: 'color', default: 'rgba(18, 18, 26, 0.85)', css: '--bg' },
    { key: 'borderColor', section: 'style', type: 'color', default: 'rgba(255, 255, 255, 0.12)', css: '--border' },
    { key: 'radius', section: 'style', type: 'number', default: 20, min: 0, max: 60, unit: 'px', css: '--radius' },

    ...animationFields('pop', 'swing', 420),
    customCssField()
  ],
  cssClasses: [
    { id: 'root', selector: '.widget-root' },
    { id: 'combo', selector: '.combo' },
    { id: 'comboBox', selector: '.combo-box' },
    { id: 'comboEmote', selector: '.combo-emote' },
    { id: 'comboCount', selector: '.combo-count' },
    { id: 'comboNumber', selector: '.combo-number' }
  ],
  presets: [
    { id: 'glass', values: { font: 'Outfit', emoteSize: 48, fontSize: 32, textColor: '#ffffff', numberColor: '#ff5c97', background: 'rgba(18, 18, 26, 0.85)', borderColor: 'rgba(255, 255, 255, 0.12)', radius: 20 } },
    { id: 'minimal', values: { font: 'Bebas Neue', emoteSize: 64, fontSize: 56, textColor: '#ffffff', numberColor: '#facc15', background: 'transparent', borderColor: 'transparent', radius: 0 } },
    { id: 'fire', values: { font: 'Rubik', emoteSize: 56, fontSize: 40, textColor: '#fff7ed', numberColor: '#f97316', background: 'rgba(69, 10, 10, 0.85)', borderColor: '#f97316', radius: 999 } }
  ]
}
