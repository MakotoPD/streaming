import { customCssField, languageField, type WidgetDefinition } from './define'

export const subathon: WidgetDefinition = {
  type: 'subathon',
  icon: 'i-lucide-timer',
  category: 'progress',
  size: [600, 200],
  fields: [
    languageField(),
    { key: 'subathonTitle', section: 'general', type: 'text', default: '', max: 60 },
    { key: 'startMinutes', section: 'general', type: 'number', default: 60, min: 1, max: 100000, unit: 'min' },
    { key: 'maxHours', section: 'general', type: 'number', default: 0, min: 0, max: 10000, unit: 'h' },
    { key: 'showAdded', section: 'general', type: 'toggle', default: true },

    { key: 'secondsPerSub', section: 'time', type: 'number', default: 60, min: 0, max: 3600, unit: 's' },
    { key: 'tierMultiplier', section: 'time', type: 'toggle', default: true },
    { key: 'secondsPerGift', section: 'time', type: 'number', default: 60, min: 0, max: 3600, unit: 's' },
    { key: 'secondsPer100Bits', section: 'time', type: 'number', default: 30, min: 0, max: 3600, unit: 's' },
    { key: 'secondsPerFollow', section: 'time', type: 'number', default: 0, min: 0, max: 3600, unit: 's' },
    { key: 'secondsPerRaid', section: 'time', type: 'number', default: 0, min: 0, max: 3600, unit: 's' },

    { key: 'font', section: 'style', type: 'font', default: 'JetBrains Mono', css: '--font' },
    { key: 'fontSize', section: 'style', type: 'number', default: 64, min: 16, max: 200, unit: 'px', css: '--font-size' },
    { key: 'textColor', section: 'style', type: 'color', default: '#ffffff', css: '--text' },
    { key: 'labelColor', section: 'style', type: 'color', default: '#a1a1aa', css: '--label' },
    { key: 'accentColor', section: 'style', type: 'color', default: '#22c55e', css: '--accent' },
    { key: 'background', section: 'style', type: 'color', default: 'rgba(12, 14, 20, 0.8)', css: '--bg' },
    { key: 'radius', section: 'style', type: 'number', default: 16, min: 0, max: 40, unit: 'px', css: '--radius' },

    customCssField()
  ],
  tests: ['sub', 'gifts', 'bits', 'follow'],
  actions: ['start', 'pause', 'addMinute', 'removeMinute', 'reset'],
  cssTemplate: [
    { selector: '.subathon', declarations: { 'font-family': '{font}', 'background': '{background}', 'border-radius': '{radius}' } },
    { selector: '.subathon-time', declarations: { 'font-size': '{fontSize}', 'color': '{textColor}' } },
    { selector: '.subathon-title', declarations: { color: '{labelColor}' } },
    { selector: '.subathon-added', declarations: { color: '{accentColor}' } }
  ],
  cssClasses: [
    { id: 'root', selector: '.widget-root' },
    { id: 'subathon', selector: '.subathon' },
    { id: 'subathonTitle', selector: '.subathon-title' },
    { id: 'subathonTime', selector: '.subathon-time' },
    { id: 'subathonStatus', selector: '.subathon-status' },
    { id: 'subathonAdded', selector: '.subathon-added' }
  ],
  presets: [
    { id: 'glass', values: { font: 'JetBrains Mono', fontSize: 64, textColor: '#ffffff', labelColor: '#a1a1aa', accentColor: '#22c55e', background: 'rgba(12, 14, 20, 0.8)', radius: 16 } },
    { id: 'bold', values: { font: 'Bebas Neue', fontSize: 96, textColor: '#fef2f2', labelColor: '#fecaca', accentColor: '#facc15', background: 'rgba(127, 29, 29, 0.9)', radius: 0 } },
    { id: 'minimal', values: { font: 'Montserrat', fontSize: 72, textColor: '#ffffff', labelColor: '#e4e4e7', accentColor: '#4ade80', background: 'transparent', radius: 0 } },
    { id: 'retro', values: { font: 'Press Start 2P', fontSize: 36, textColor: '#fde047', labelColor: '#a5f3fc', accentColor: '#f472b6', background: 'rgba(30, 27, 75, 0.9)', radius: 0 } }
  ]
}
