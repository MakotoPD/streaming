import { customCssField, type WidgetDefinition } from './define'

export const camFrame: WidgetDefinition = {
  type: 'cam-frame',
  icon: 'i-lucide-webcam',
  size: [640, 360],
  fields: [
    { key: 'frameLabel', section: 'general', type: 'text', default: '', max: 40 },
    { key: 'showLabel', section: 'general', type: 'toggle', default: false },
    { key: 'labelPosition', section: 'general', label: 'position', type: 'select', default: 'bottom-left', options: ['top-left', 'top-right', 'bottom-left', 'bottom-right'] },
    { key: 'animatedBorder', section: 'general', type: 'toggle', default: true },
    { key: 'cornerStyle', section: 'general', type: 'select', default: 'none', options: ['none', 'brackets'] },

    { key: 'borderWidth', section: 'style', type: 'number', default: 6, min: 0, max: 40, unit: 'px', css: '--border-width' },
    { key: 'radius', section: 'style', type: 'number', default: 18, min: 0, max: 120, unit: 'px', css: '--radius' },
    { key: 'color1', section: 'style', type: 'color', default: '#8b5cf6', css: '--color-1' },
    { key: 'color2', section: 'style', type: 'color', default: '#22d3ee', css: '--color-2' },
    { key: 'glow', section: 'style', type: 'number', default: 24, min: 0, max: 100, unit: 'px', css: '--glow' },
    { key: 'font', section: 'style', type: 'font', default: 'Outfit', css: '--font' },
    { key: 'fontSize', section: 'style', type: 'number', default: 20, min: 10, max: 60, unit: 'px', css: '--font-size' },
    { key: 'textColor', section: 'style', type: 'color', default: '#ffffff', css: '--text' },
    { key: 'labelBackground', section: 'style', type: 'color', default: 'rgba(12, 14, 20, 0.85)', css: '--label-bg' },

    customCssField()
  ],
  tests: [],
  cssTemplate: [
    { selector: '.cam-frame', declarations: { '--color-1': '{color1}', '--color-2': '{color2}', '--glow': '{glow}' } },
    { selector: '.cam-frame-border', declarations: { 'padding': '{borderWidth}', 'border-radius': '{radius}' } },
    { selector: '.cam-frame-label', declarations: { 'font-family': '{font}', 'font-size': '{fontSize}', 'color': '{textColor}', 'background': '{labelBackground}' } }
  ],
  cssClasses: [
    { id: 'root', selector: '.widget-root' },
    { id: 'camFrame', selector: '.cam-frame' },
    { id: 'camFrameBorder', selector: '.cam-frame-border' },
    { id: 'camFrameLabel', selector: '.cam-frame-label' },
    { id: 'camFrameCorner', selector: '.cam-frame-corner' }
  ],
  presets: [
    { id: 'neon', values: { borderWidth: 6, radius: 18, color1: '#8b5cf6', color2: '#22d3ee', glow: 24, font: 'Outfit', fontSize: 20, textColor: '#ffffff', labelBackground: 'rgba(12, 14, 20, 0.85)' } },
    { id: 'minimal', values: { borderWidth: 3, radius: 8, color1: '#ffffff', color2: '#ffffff', glow: 0, font: 'Inter', fontSize: 18, textColor: '#111827', labelBackground: '#ffffff' } },
    { id: 'sunset', values: { borderWidth: 8, radius: 28, color1: '#f97316', color2: '#ec4899', glow: 36, font: 'Poppins', fontSize: 20, textColor: '#ffffff', labelBackground: 'rgba(76, 5, 25, 0.85)' } },
    { id: 'retro', values: { borderWidth: 10, radius: 0, color1: '#fde047', color2: '#22d3ee', glow: 0, font: 'Press Start 2P', fontSize: 12, textColor: '#fde047', labelBackground: 'rgba(30, 27, 75, 0.95)' } }
  ]
}
