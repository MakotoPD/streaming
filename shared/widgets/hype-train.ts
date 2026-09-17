import { animationFields, customCssField, languageField, type WidgetDefinition } from './define'

export const hypeTrain: WidgetDefinition = {
  type: 'hype-train',
  icon: 'i-lucide-train-front',
  category: 'alerts',
  platforms: ['twitch'],
  requiresTwitchLogin: true,
  size: [700, 180],
  fields: [
    languageField(),
    { key: 'showContributors', section: 'general', type: 'toggle', default: true },
    { key: 'contributorsCount', section: 'general', type: 'number', default: 3, min: 1, max: 10 },
    { key: 'endHold', section: 'general', type: 'number', default: 10, min: 0, max: 120, unit: 's' },
    { key: 'showWhenIdle', section: 'general', type: 'toggle', default: false },

    { key: 'font', section: 'style', type: 'font', default: 'Rubik', css: '--font' },
    { key: 'fontSize', section: 'style', type: 'number', default: 20, min: 10, max: 60, unit: 'px', css: '--font-size' },
    { key: 'textColor', section: 'style', type: 'color', default: '#ffffff', css: '--text' },
    { key: 'background', section: 'style', type: 'color', default: 'rgba(12, 14, 20, 0.85)', css: '--bg' },
    { key: 'barColor', section: 'style', type: 'color', default: '#9147ff', css: '--bar' },
    { key: 'barColor2', section: 'style', type: 'color', default: '#f472b6', css: '--bar-2' },
    { key: 'goldenColor', section: 'style', type: 'color', default: '#facc15', css: '--golden' },
    { key: 'barHeight', section: 'style', type: 'number', default: 18, min: 4, max: 60, unit: 'px', css: '--bar-height' },
    { key: 'radius', section: 'style', type: 'number', default: 16, min: 0, max: 40, unit: 'px', css: '--radius' },

    ...animationFields('slide-down', 'slide-up', 500),
    customCssField()
  ],
  tests: ['hypeProgress', 'hypeEnd'],
  cssTemplate: [
    { selector: '.hype', declarations: { 'font-family': '{font}', 'font-size': '{fontSize}', 'color': '{textColor}', 'background': '{background}', 'border-radius': '{radius}' } },
    { selector: '.hype-bar', declarations: { height: '{barHeight}' } },
    { selector: '.hype-fill', declarations: { background: 'linear-gradient(90deg, {barColor}, {barColor2})' } }
  ],
  cssClasses: [
    { id: 'root', selector: '.widget-root' },
    { id: 'hype', selector: '.hype' },
    { id: 'hypeTitle', selector: '.hype-title' },
    { id: 'hypeLevel', selector: '.hype-level' },
    { id: 'hypeTimer', selector: '.hype-timer' },
    { id: 'hypeBar', selector: '.hype-bar' },
    { id: 'hypeFill', selector: '.hype-fill' },
    { id: 'hypeContributors', selector: '.hype-contributors' },
    { id: 'hypeGolden', selector: '.hype-golden' }
  ],
  presets: [
    { id: 'glass', values: { font: 'Rubik', fontSize: 20, textColor: '#ffffff', background: 'rgba(12, 14, 20, 0.85)', barColor: '#9147ff', barColor2: '#f472b6', goldenColor: '#facc15', barHeight: 18, radius: 16 } },
    { id: 'neon', values: { font: 'Rubik', fontSize: 20, textColor: '#e0f2fe', background: 'rgba(3, 7, 18, 0.9)', barColor: '#22d3ee', barColor2: '#a3e635', goldenColor: '#fde047', barHeight: 14, radius: 6 } },
    { id: 'gold', values: { font: 'Montserrat', fontSize: 20, textColor: '#fffbeb', background: 'rgba(41, 22, 4, 0.92)', barColor: '#f59e0b', barColor2: '#fde047', goldenColor: '#fde047', barHeight: 16, radius: 10 } },
    { id: 'clean', values: { font: 'Inter', fontSize: 18, textColor: '#111827', background: '#ffffff', barColor: '#7c3aed', barColor2: '#db2777', goldenColor: '#ca8a04', barHeight: 12, radius: 12 } }
  ]
}
