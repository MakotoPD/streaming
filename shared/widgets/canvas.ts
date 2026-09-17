import { CANVAS_HEIGHT, CANVAS_WIDTH } from '../canvas'
import { customCssField, type WidgetDefinition } from './define'

export const canvas: WidgetDefinition = {
  type: 'canvas',
  icon: 'i-lucide-pencil-ruler',
  category: 'scene',
  size: [CANVAS_WIDTH, CANVAS_HEIGHT],
  fields: [customCssField()],
  tests: [],
  panel: 'canvas',
  cssTemplate: [],
  cssClasses: [
    { id: 'root', selector: '.widget-root' },
    { id: 'canvasStage', selector: '.canvas-stage' },
    { id: 'canvasText', selector: '.canvas-text' },
    { id: 'canvasMedia', selector: '.canvas-media' }
  ],
  presets: []
}
