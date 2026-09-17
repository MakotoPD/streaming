import type { AlertType } from '../types'
import { animationFields, customCssField, languageField, type Field, type WidgetDefinition } from './define'

export const ALERT_TYPES: AlertType[] = ['follow', 'sub', 'gifts', 'raid', 'bits']

const DEFAULTS: Record<AlertType, { color: string, sound: string }> = {
  follow: { color: '#22d3ee', sound: '/sounds/plakal2.mp3' },
  sub: { color: '#a855f7', sound: '/sounds/pterodaktyl.mp3' },
  gifts: { color: '#ec4899', sound: '/sounds/pasja-gotowania.mp3' },
  raid: { color: '#fb923c', sound: '/sounds/wide.mp3' },
  bits: { color: '#fbbf24', sound: '' }
}

function typeFields(type: AlertType): Field[] {
  const fields: Field[] = [
    { key: `${type}.enabled`, section: type, label: 'enabled', type: 'toggle', default: true },
    { key: `${type}.text`, section: type, label: 'text', type: 'text', default: '', max: 200 }
  ]
  if (type === 'sub') fields.push({ key: 'sub.textResub', section: type, label: 'textResub', type: 'text', default: '', max: 200 })
  if (type === 'bits' || type === 'raid') fields.push({ key: `${type}.min`, section: type, label: 'min', type: 'number', default: 1, min: 1, max: 100000 })
  fields.push(
    { key: `${type}.sound`, section: type, label: 'sound', type: 'sound', default: DEFAULTS[type].sound },
    { key: `${type}.color`, section: type, label: 'color', type: 'color', default: DEFAULTS[type].color }
  )
  return fields
}

export const alerts: WidgetDefinition = {
  type: 'alerts',
  icon: 'i-lucide-bell-ring',
  size: [900, 300],
  fields: [
    languageField(),
    { key: 'holdTime', section: 'general', type: 'number', default: 5, min: 1, max: 30, step: 0.5, unit: 's' },
    { key: 'volume', section: 'general', type: 'number', default: 80, min: 0, max: 100, unit: '%' },
    { key: 'position', section: 'general', type: 'select', default: 'center', options: ['top', 'center', 'bottom'] },

    ...ALERT_TYPES.flatMap(typeFields),

    { key: 'font', section: 'style', type: 'font', default: 'Inter', css: '--font' },
    { key: 'fontSize', section: 'style', type: 'number', default: 24, min: 10, max: 80, unit: 'px', css: '--font-size' },
    { key: 'textColor', section: 'style', type: 'color', default: '#ffffff', css: '--text' },
    { key: 'background', section: 'style', type: 'color', default: 'rgba(12, 14, 20, 0.72)', css: '--bg' },
    { key: 'radius', section: 'style', type: 'number', default: 1.1, min: 0, max: 3, step: 0.1, unit: 'em', css: '--radius' },
    { key: 'showIcon', section: 'style', type: 'toggle', default: true },
    { key: 'glow', section: 'style', type: 'toggle', default: true },
    { key: 'shine', section: 'style', type: 'toggle', default: true },

    ...animationFields('rise', 'lift', 750),
    customCssField()
  ],
  cssClasses: [
    { id: 'root', selector: '.widget-root' },
    { id: 'alerts', selector: '.alerts' },
    { id: 'alert', selector: '.alert' },
    { id: 'alertType', selector: '.alert-sub' },
    { id: 'alertIcon', selector: '.alert-icon' },
    { id: 'alertText', selector: '.alert-text' },
    { id: 'alertName', selector: '.alert-name' },
    { id: 'alertMessage', selector: '.alert-message' },
    { id: 'alertBurst', selector: '.alert-burst' },
    { id: 'alertShine', selector: '.alert-shine' }
  ],
  presets: [
    { id: 'glow', values: { font: 'Inter', fontSize: 24, textColor: '#ffffff', background: 'rgba(12, 14, 20, 0.72)', radius: 1.1, showIcon: true, glow: true, shine: true } },
    { id: 'flat', values: { font: 'Poppins', fontSize: 24, textColor: '#111827', background: '#ffffff', radius: 0.5, showIcon: true, glow: false, shine: false } },
    { id: 'minimal', values: { font: 'Montserrat', fontSize: 28, textColor: '#ffffff', background: 'transparent', radius: 0, showIcon: false, glow: true, shine: false } },
    { id: 'retro', values: { font: 'Press Start 2P', fontSize: 16, textColor: '#fef08a', background: 'rgba(30, 27, 75, 0.9)', radius: 0, showIcon: true, glow: false, shine: true } }
  ]
}
