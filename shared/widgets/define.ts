import type { Settings } from '../types'
import { ANIMATIONS_IN, ANIMATIONS_OUT } from './animations'

export const LANGUAGES = ['en', 'pl', 'es', 'de', 'ru'] as const
export type Language = typeof LANGUAGES[number]

export const FONTS = ['Outfit', 'Inter', 'Poppins', 'Montserrat', 'Roboto', 'Rubik', 'Bebas Neue', 'Press Start 2P', 'JetBrains Mono'] as const

export type Section = 'general' | 'style' | 'animation' | 'advanced' | string

interface Base {
  key: string
  section: Section
  label?: string
  css?: string
}

export type Field = Base & (
  | { type: 'text', default: string, max?: number, multiline?: boolean }
  | { type: 'number', default: number, min: number, max: number, step?: number, unit?: string }
  | { type: 'toggle', default: boolean }
  | { type: 'select', default: string, options: readonly string[] }
  | { type: 'multi', default: string[], options: readonly string[] }
  | { type: 'color', default: string }
  | { type: 'font', default: string }
  | { type: 'animation', default: string, kind: 'in' | 'out' }
  | { type: 'sound', default: string }
  | { type: 'list', default: string[] }
  | { type: 'time', default: string }
  | { type: 'code', default: string }
)

export interface WidgetDefinition {
  type: string
  icon: string
  size: [number, number]
  fields: Field[]
  presets: { id: string, values: Settings }[]
  cssClasses: { id: string, selector: string }[]
  cssTemplate: { selector: string, declarations: Record<string, string> }[]
  tests: string[]
  actions?: string[]
  panel?: 'pin'
}

const COLOR = /^[#\w(),.%\s-]{1,80}$/
const SOUND = /^(\/sounds\/[\w.-]+|\/api\/sounds\/[\w-]+\/file|https?:\/\/\S{1,500})$/
const TIME = /^([01]\d|2[0-3]):[0-5]\d$/

function clean(field: Field, value: unknown): unknown {
  switch (field.type) {
    case 'text':
      return typeof value === 'string' ? value.slice(0, field.max ?? 500) : field.default
    case 'code':
      return typeof value === 'string' ? value.replaceAll('<', '').slice(0, 20000) : field.default
    case 'number': {
      const n = Number(value)
      return Number.isFinite(n) ? Math.min(field.max, Math.max(field.min, n)) : field.default
    }
    case 'toggle':
      return typeof value === 'boolean' ? value : field.default
    case 'select':
      return field.options.includes(value as string) ? value : field.default
    case 'multi':
      return Array.isArray(value) ? [...new Set(value.filter(v => field.options.includes(v)))] : field.default
    case 'font':
      return FONTS.includes(value as typeof FONTS[number]) ? value : field.default
    case 'animation':
      return ((field.kind === 'in' ? ANIMATIONS_IN : ANIMATIONS_OUT) as readonly string[]).includes(value as string) ? value : field.default
    case 'color':
      return typeof value === 'string' && COLOR.test(value) ? value : field.default
    case 'sound':
      return value === '' || (typeof value === 'string' && SOUND.test(value)) ? value : field.default
    case 'time':
      return value === '' || (typeof value === 'string' && TIME.test(value)) ? value : field.default
    case 'list':
      return Array.isArray(value)
        ? value.filter(v => typeof v === 'string').map(v => v.trim().slice(0, 100)).filter(Boolean).slice(0, 200)
        : field.default
  }
}

export function sanitizeSettings(def: WidgetDefinition, input: unknown): Settings {
  const raw = (input && typeof input === 'object' ? input : {}) as Settings
  const out: Settings = {}
  for (const field of def.fields) {
    out[field.key] = field.key in raw ? clean(field, raw[field.key]) : structuredClone(field.default)
  }
  return out
}

export function defaultSettings(def: WidgetDefinition, language: string): Settings {
  const settings = sanitizeSettings(def, {})
  if ('language' in settings) settings.language = LANGUAGES.includes(language as Language) ? language : 'en'
  return settings
}

function cssValue(field: Field, value: unknown) {
  if (field.type === 'number') return `${value}${field.unit ?? ''}`
  if (field.type === 'font') return `"${value}", system-ui, sans-serif`
  if (field.type === 'toggle') return value ? '1' : '0'
  return String(value)
}

export function cssVars(def: WidgetDefinition, settings: Settings): Record<string, string> {
  const vars: Record<string, string> = {}
  for (const field of def.fields) {
    if (field.css) vars[field.css] = cssValue(field, settings[field.key])
  }
  return vars
}

export function baseCss(def: WidgetDefinition, settings: Settings): string {
  const fields = new Map(def.fields.map(field => [field.key, field]))
  const fill = (template: string) => template.replace(/\{([\w.]+)\}/g, (whole, key: string) => {
    const field = fields.get(key)
    return field ? cssValue(field, settings[key]) : whole
  })
  return def.cssTemplate
    .map((rule) => {
      const lines = Object.entries(rule.declarations).map(([property, value]) => `  ${property}: ${fill(value)};`)
      return [`${rule.selector} {`, ...lines, '}'].join('\n')
    })
    .join('\n\n')
}

export function styleKeys(def: WidgetDefinition): string[] {
  return def.fields.filter(f => f.section === 'style').map(f => f.key)
}

export function languageField(): Field {
  return { key: 'language', section: 'general', label: 'language', type: 'select', default: 'en', options: LANGUAGES }
}

export function animationFields(inDefault: string, outDefault: string, duration: number): Field[] {
  return [
    { key: 'animIn', section: 'animation', label: 'animIn', type: 'animation', kind: 'in', default: inDefault },
    { key: 'animOut', section: 'animation', label: 'animOut', type: 'animation', kind: 'out', default: outDefault },
    { key: 'animDuration', section: 'animation', label: 'animDuration', type: 'number', default: duration, min: 0, max: 3000, step: 50, unit: 'ms', css: '--anim-duration' }
  ]
}

export const PERMISSIONS = ['everyone', 'subscribers', 'vips', 'moderators', 'broadcaster'] as const

export function permissionField(key: string, fallback: typeof PERMISSIONS[number]): Field {
  return { key, section: 'general', label: 'permission', type: 'select', default: fallback, options: PERMISSIONS }
}

export function customCssField(): Field {
  return { key: 'customCss', section: 'advanced', label: 'customCss', type: 'code', default: '' }
}
