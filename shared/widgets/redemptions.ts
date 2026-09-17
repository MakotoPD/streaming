import { animationFields, customCssField, languageField, type WidgetDefinition } from './define'

export const redemptions: WidgetDefinition = {
  type: 'redemptions',
  icon: 'i-lucide-sparkles',
  size: [700, 200],
  fields: [
    languageField(),
    { key: 'rewardFilter', section: 'general', type: 'select', default: 'all', options: ['all', 'only', 'except'] },
    { key: 'rewards', section: 'general', type: 'list', default: [] },
    { key: 'showInput', section: 'general', type: 'toggle', default: true },
    { key: 'showCost', section: 'general', type: 'toggle', default: true },
    { key: 'holdTime', section: 'general', type: 'number', default: 6, min: 1, max: 30, step: 0.5, unit: 's' },
    { key: 'sound', section: 'general', type: 'sound', default: '' },
    { key: 'volume', section: 'general', type: 'number', default: 80, min: 0, max: 100, unit: '%' },

    { key: 'font', section: 'style', type: 'font', default: 'Outfit', css: '--font' },
    { key: 'fontSize', section: 'style', type: 'number', default: 22, min: 10, max: 60, unit: 'px', css: '--font-size' },
    { key: 'textColor', section: 'style', type: 'color', default: '#ffffff', css: '--text' },
    { key: 'background', section: 'style', type: 'color', default: 'rgba(12, 14, 20, 0.85)', css: '--bg' },
    { key: 'accentColor', section: 'style', type: 'color', default: '#9147ff', css: '--accent' },
    { key: 'radius', section: 'style', type: 'number', default: 16, min: 0, max: 40, unit: 'px', css: '--radius' },
    { key: 'showIcon', section: 'style', type: 'toggle', default: true },

    ...animationFields('slide-up', 'fade', 450),
    customCssField()
  ],
  tests: ['redemption'],
  cssTemplate: [
    { selector: '.redemption-card', declarations: { 'font-family': '{font}', 'font-size': '{fontSize}', 'color': '{textColor}', 'background': '{background}', 'border-color': '{accentColor}', 'border-radius': '{radius}' } },
    { selector: '.redemption-reward', declarations: { color: '{accentColor}' } }
  ],
  cssClasses: [
    { id: 'root', selector: '.widget-root' },
    { id: 'redemptionCard', selector: '.redemption-card' },
    { id: 'redemptionIcon', selector: '.redemption-icon' },
    { id: 'redemptionName', selector: '.redemption-name' },
    { id: 'redemptionReward', selector: '.redemption-reward' },
    { id: 'redemptionCost', selector: '.redemption-cost' },
    { id: 'redemptionInput', selector: '.redemption-input' }
  ],
  presets: [
    { id: 'glass', values: { font: 'Outfit', fontSize: 22, textColor: '#ffffff', background: 'rgba(12, 14, 20, 0.85)', accentColor: '#9147ff', radius: 16, showIcon: true } },
    { id: 'clean', values: { font: 'Inter', fontSize: 22, textColor: '#111827', background: '#ffffff', accentColor: '#7c3aed', radius: 12, showIcon: true } },
    { id: 'neon', values: { font: 'Rubik', fontSize: 24, textColor: '#e0f2fe', background: 'rgba(3, 7, 18, 0.9)', accentColor: '#22d3ee', radius: 6, showIcon: true } }
  ]
}
