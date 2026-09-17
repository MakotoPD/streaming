import type { CanvasShape } from '#shared/canvas'

export type CanvasToolName = 'move' | CanvasShape | 'text' | 'fill' | 'eraser'

export interface CanvasToolState {
  name: CanvasToolName
  stroke: string
  width: number
  fillOn: boolean
  fillColor: string
  font: string
  size: number
  bold: boolean
  italic: boolean
  underline: boolean
  strike: boolean
}

export const CANVAS_TOOL_ICONS: Record<CanvasToolName, string> = {
  move: 'i-lucide-mouse-pointer-2',
  pencil: 'i-lucide-pencil',
  line: 'i-lucide-minus',
  rect: 'i-lucide-square',
  ellipse: 'i-lucide-circle',
  triangle: 'i-lucide-triangle',
  arrow: 'i-lucide-move-up-right',
  text: 'i-lucide-type',
  fill: 'i-lucide-paint-bucket',
  eraser: 'i-lucide-eraser'
}
