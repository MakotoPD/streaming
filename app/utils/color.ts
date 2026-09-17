export type ColorFormat = 'hex' | 'rgb' | 'hsl'

export interface ParsedColor {
  r: number
  g: number
  b: number
  a: number
  format: ColorFormat
  hasAlpha: boolean
}

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))
const round = (value: number, digits = 0) => Number(value.toFixed(digits))

function parseAlpha(raw: string | undefined) {
  if (raw === undefined) return 1
  const value = raw.trim()
  return clamp(value.endsWith('%') ? Number.parseFloat(value) / 100 : Number.parseFloat(value), 0, 1)
}

function channels(inner: string) {
  const [main, slashAlpha] = inner.split('/')
  const parts = main!.split(/[\s,]+/).filter(Boolean)
  return { parts, alpha: slashAlpha ?? parts[3] }
}

export function hslToRgb(h: number, s: number, l: number) {
  const sat = s / 100
  const light = l / 100
  const k = (n: number) => (n + h / 30) % 12
  const f = (n: number) => light - sat * Math.min(light, 1 - light) * Math.max(-1, Math.min(k(n) - 3, 9 - k(n), 1))
  return { r: Math.round(f(0) * 255), g: Math.round(f(8) * 255), b: Math.round(f(4) * 255) }
}

export function rgbToHsl(r: number, g: number, b: number) {
  const rn = r / 255
  const gn = g / 255
  const bn = b / 255
  const max = Math.max(rn, gn, bn)
  const min = Math.min(rn, gn, bn)
  const l = (max + min) / 2
  const d = max - min
  if (!d) return { h: 0, s: 0, l: Math.round(l * 100) }
  const s = d / (1 - Math.abs(2 * l - 1))
  const h = max === rn ? ((gn - bn) / d) % 6 : max === gn ? (bn - rn) / d + 2 : (rn - gn) / d + 4
  return { h: Math.round((h * 60 + 360) % 360), s: Math.round(s * 100), l: Math.round(l * 100) }
}

export function parseColor(input: string): ParsedColor | undefined {
  const value = input.trim().toLowerCase()

  const hex = value.match(/^#([\da-f]{3,4}|[\da-f]{6}|[\da-f]{8})$/)
  if (hex) {
    const digits = hex[1]!.length <= 4 ? [...hex[1]!].map(c => c + c).join('') : hex[1]!
    const byte = (i: number) => Number.parseInt(digits.slice(i, i + 2), 16)
    return { r: byte(0), g: byte(2), b: byte(4), a: digits.length === 8 ? byte(6) / 255 : 1, format: 'hex', hasAlpha: digits.length === 8 }
  }

  const fn = value.match(/^(rgba?|hsla?)\(([^()]*)\)$/)
  if (!fn) return undefined
  const { parts, alpha } = channels(fn[2]!)
  if (parts.length < 3) return undefined
  const hasAlpha = fn[1]!.endsWith('a') || alpha !== undefined
  const a = parseAlpha(alpha)

  if (fn[1]!.startsWith('rgb')) {
    const channel = (raw: string) => clamp(raw.endsWith('%') ? Number.parseFloat(raw) * 2.55 : Number.parseFloat(raw), 0, 255)
    const [r, g, b] = parts.slice(0, 3).map(channel)
    if ([r, g, b].some(Number.isNaN)) return undefined
    return { r: Math.round(r!), g: Math.round(g!), b: Math.round(b!), a, format: 'rgb', hasAlpha }
  }

  const [h, s, l] = parts.slice(0, 3).map(raw => Number.parseFloat(raw))
  if ([h, s, l].some(Number.isNaN)) return undefined
  return { ...hslToRgb(((h! % 360) + 360) % 360, clamp(s!, 0, 100), clamp(l!, 0, 100)), a, format: 'hsl', hasAlpha }
}

export function toHex({ r, g, b }: { r: number, g: number, b: number }) {
  return `#${[r, g, b].map(v => v.toString(16).padStart(2, '0')).join('')}`
}

export function formatColor(color: { r: number, g: number, b: number, a: number }, format: ColorFormat, keepAlpha = false) {
  const a = round(color.a, 2)
  const alpha = keepAlpha || color.a < 1
  if (format === 'hex') return alpha ? `${toHex(color)}${Math.round(color.a * 255).toString(16).padStart(2, '0')}` : toHex(color)
  if (format === 'rgb') return alpha ? `rgba(${color.r}, ${color.g}, ${color.b}, ${a})` : `rgb(${color.r}, ${color.g}, ${color.b})`
  const { h, s, l } = rgbToHsl(color.r, color.g, color.b)
  return alpha ? `hsla(${h}, ${s}%, ${l}%, ${a})` : `hsl(${h}, ${s}%, ${l}%)`
}
