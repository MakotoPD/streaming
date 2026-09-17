export const CANVAS_WIDTH = 2560
export const CANVAS_HEIGHT = 1440
export const CANVAS_MAX_OBJECTS = 400
export const CANVAS_MAX_POINTS = 2000
export const CANVAS_MAX_OPS = 200
export const CANVAS_MAX_BODY = 4 * 1024 * 1024

export const CANVAS_SHAPES = ['pencil', 'line', 'rect', 'ellipse', 'triangle', 'arrow'] as const
export type CanvasShape = typeof CANVAS_SHAPES[number]

export interface CanvasDraw {
  id: string
  kind: 'draw'
  shape: CanvasShape
  points: number[]
  stroke: string
  width: number
  fill: string
}

export interface CanvasText {
  id: string
  kind: 'text'
  x: number
  y: number
  w: number
  text: string
  color: string
  font: string
  size: number
  bold: boolean
  italic: boolean
  underline: boolean
  strike: boolean
}

export interface CanvasMedia {
  id: string
  kind: 'media'
  x: number
  y: number
  w: number
  h: number
  url: string
  video: boolean
}

export type CanvasObject = CanvasDraw | CanvasText | CanvasMedia

export interface CanvasScene {
  background: string
  objects: CanvasObject[]
}

export type CanvasOp =
  | { t: 'put', o: CanvasObject }
  | { t: 'del', ids: string[] }
  | { t: 'bg', color: string }
  | { t: 'set', scene: CanvasScene }

export const emptyScene = (): CanvasScene => ({ background: '', objects: [] })

const ID = /^[\w-]{1,40}$/
const COLOR = /^(transparent|none|[#\w(),.%\s/-]{1,60})$/
const MEDIA_URL = /^\/api\/images\/[\da-f-]{36}\/file$/
const FONT = /^[\w ]{1,40}$/

function num(value: unknown, min: number, max: number, fallback = 0) {
  const n = Number(value)
  return Number.isFinite(n) ? Math.min(max, Math.max(min, Math.round(n * 10) / 10)) : fallback
}

function color(value: unknown, fallback: string) {
  return typeof value === 'string' && COLOR.test(value) ? value : fallback
}

export function sanitizeObject(input: unknown): CanvasObject | undefined {
  const raw = input as Record<string, any>
  if (!raw || typeof raw !== 'object' || typeof raw.id !== 'string' || !ID.test(raw.id)) return

  if (raw.kind === 'draw') {
    if (!CANVAS_SHAPES.includes(raw.shape)) return
    if (!Array.isArray(raw.points) || raw.points.length < 2) return
    const points = raw.points.slice(0, CANVAS_MAX_POINTS * 2)
      .map((value: unknown, index: number) => num(value, -CANVAS_WIDTH, index % 2 ? CANVAS_HEIGHT * 2 : CANVAS_WIDTH * 2))
    if (points.length % 2) points.pop()
    return {
      id: raw.id,
      kind: 'draw',
      shape: raw.shape,
      points,
      stroke: color(raw.stroke, '#ffffff'),
      width: num(raw.width, 1, 200, 8),
      fill: color(raw.fill, 'none')
    }
  }

  if (raw.kind === 'text') {
    return {
      id: raw.id,
      kind: 'text',
      x: num(raw.x, 0, CANVAS_WIDTH),
      y: num(raw.y, 0, CANVAS_HEIGHT),
      w: num(raw.w, 40, CANVAS_WIDTH, 800),
      text: typeof raw.text === 'string' ? raw.text.slice(0, 2000) : '',
      color: color(raw.color, '#ffffff'),
      font: typeof raw.font === 'string' && FONT.test(raw.font) ? raw.font : 'Outfit',
      size: num(raw.size, 8, 400, 64),
      bold: raw.bold === true,
      italic: raw.italic === true,
      underline: raw.underline === true,
      strike: raw.strike === true
    }
  }

  if (raw.kind === 'media') {
    if (typeof raw.url !== 'string' || !MEDIA_URL.test(raw.url)) return
    return {
      id: raw.id,
      kind: 'media',
      x: num(raw.x, -CANVAS_WIDTH, CANVAS_WIDTH),
      y: num(raw.y, -CANVAS_HEIGHT, CANVAS_HEIGHT),
      w: num(raw.w, 16, CANVAS_WIDTH * 2, 640),
      h: num(raw.h, 16, CANVAS_HEIGHT * 2, 360),
      url: raw.url,
      video: raw.video === true
    }
  }
}

export function sanitizeScene(input: unknown): CanvasScene {
  const raw = input as Record<string, any>
  if (!raw || typeof raw !== 'object') return emptyScene()
  const seen = new Set<string>()
  const objects: CanvasObject[] = []
  for (const item of Array.isArray(raw.objects) ? raw.objects : []) {
    const object = sanitizeObject(item)
    if (!object || seen.has(object.id)) continue
    seen.add(object.id)
    objects.push(object)
    if (objects.length >= CANVAS_MAX_OBJECTS) break
  }
  return { background: color(raw.background, ''), objects }
}

export function sanitizeOps(input: unknown): CanvasOp[] {
  const ops: CanvasOp[] = []
  for (const item of (Array.isArray(input) ? input : []).slice(0, CANVAS_MAX_OPS)) {
    const raw = item as Record<string, any>
    if (!raw || typeof raw !== 'object') continue
    if (raw.t === 'put') {
      const object = sanitizeObject(raw.o)
      if (object) ops.push({ t: 'put', o: object })
    }
    else if (raw.t === 'del' && Array.isArray(raw.ids)) {
      const ids = raw.ids.filter((id: unknown): id is string => typeof id === 'string' && ID.test(id)).slice(0, CANVAS_MAX_OBJECTS)
      if (ids.length) ops.push({ t: 'del', ids })
    }
    else if (raw.t === 'bg') {
      ops.push({ t: 'bg', color: color(raw.color, '') })
    }
    else if (raw.t === 'set') {
      ops.push({ t: 'set', scene: sanitizeScene(raw.scene) })
    }
  }
  return ops
}

export function applyOps(scene: CanvasScene, ops: CanvasOp[]): CanvasScene {
  let next = scene
  for (const op of ops) {
    if (op.t === 'set') {
      next = op.scene
    }
    else if (op.t === 'bg') {
      next = { ...next, background: op.color }
    }
    else if (op.t === 'del') {
      const ids = new Set(op.ids)
      next = { ...next, objects: next.objects.filter(object => !ids.has(object.id)) }
    }
    else {
      const objects = [...next.objects]
      const index = objects.findIndex(object => object.id === op.o.id)
      if (index < 0) objects.push(op.o)
      else objects[index] = op.o
      next = { ...next, objects }
    }
  }
  return next
}

export function canvasBounds(object: CanvasObject) {
  if (object.kind !== 'draw') {
    const height = object.kind === 'media' ? object.h : object.size * 1.4 * (object.text.split('\n').length || 1)
    return { x: object.x, y: object.y, w: object.w, h: height }
  }
  const xs = object.points.filter((_, index) => index % 2 === 0)
  const ys = object.points.filter((_, index) => index % 2 === 1)
  const pad = object.width / 2
  const x = Math.min(...xs) - pad
  const y = Math.min(...ys) - pad
  return { x, y, w: Math.max(...xs) + pad - x, h: Math.max(...ys) + pad - y }
}

export function canvasPath(object: CanvasDraw): string {
  const p = object.points
  const [x1 = 0, y1 = 0] = p
  const x2 = p[p.length - 2] ?? x1
  const y2 = p[p.length - 1] ?? y1

  switch (object.shape) {
    case 'pencil': {
      if (p.length < 4) return `M ${x1} ${y1} l 0.01 0`
      let d = `M ${x1} ${y1}`
      for (let i = 2; i < p.length; i += 2) d += ` L ${p[i]} ${p[i + 1]}`
      return d
    }
    case 'line':
      return `M ${x1} ${y1} L ${x2} ${y2}`
    case 'rect':
      return `M ${x1} ${y1} H ${x2} V ${y2} H ${x1} Z`
    case 'triangle':
      return `M ${(x1 + x2) / 2} ${y1} L ${x2} ${y2} L ${x1} ${y2} Z`
    case 'ellipse': {
      const rx = Math.abs(x2 - x1) / 2
      const ry = Math.abs(y2 - y1) / 2
      const cx = (x1 + x2) / 2
      const cy = (y1 + y2) / 2
      return `M ${cx - rx} ${cy} a ${rx} ${ry} 0 1 0 ${rx * 2} 0 a ${rx} ${ry} 0 1 0 ${-rx * 2} 0`
    }
    case 'arrow': {
      const angle = Math.atan2(y2 - y1, x2 - x1)
      const size = Math.min(Math.hypot(x2 - x1, y2 - y1) * 0.35, 24 + object.width * 3)
      const wing = (offset: number) => `${x2 - size * Math.cos(angle + offset)} ${y2 - size * Math.sin(angle + offset)}`
      return `M ${x1} ${y1} L ${x2} ${y2} M ${wing(-0.45)} L ${x2} ${y2} L ${wing(0.45)}`
    }
  }
}
