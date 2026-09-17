import { animationFields, customCssField, languageField, type WidgetDefinition } from './define'

export const SOCIALS = ['twitch', 'kick', 'youtube', 'instagram', 'tiktok', 'x', 'discord'] as const

export const scene: WidgetDefinition = {
  type: 'scene',
  icon: 'i-lucide-clapperboard',
  category: 'scene',
  size: [1920, 1080],
  fields: [
    languageField(),
    { key: 'mode', section: 'general', type: 'select', default: 'starting', options: ['starting', 'brb', 'ending'] },
    { key: 'title', section: 'general', type: 'text', default: '', max: 60 },
    { key: 'titleAccent', section: 'general', type: 'text', default: '', max: 60 },
    { key: 'status', section: 'general', type: 'text', default: '', max: 120 },
    { key: 'countdownTo', section: 'general', type: 'time', default: '' },
    ...SOCIALS.map(s => ({ key: `social.${s}`, section: 'socials', label: s, type: 'text' as const, default: '', max: 60 })),

    { key: 'background', section: 'style', label: 'sceneBackground', type: 'select', default: 'orbs', options: ['none', 'gradient', 'orbs', '3d'] },
    { key: 'font', section: 'style', type: 'font', default: 'Inter', css: '--font' },
    { key: 'titleSize', section: 'style', type: 'number', default: 112, min: 24, max: 300, unit: 'px', css: '--title-size' },
    { key: 'backgroundColor', section: 'style', type: 'color', default: '#050505', css: '--bg' },
    { key: 'accent1', section: 'style', type: 'color', default: '#3b82f6', css: '--accent-1' },
    { key: 'accent2', section: 'style', type: 'color', default: '#a855f7', css: '--accent-2' },
    { key: 'textColor', section: 'style', type: 'color', default: '#ffffff', css: '--text' },
    { key: 'italic', section: 'style', type: 'toggle', default: true },

    ...animationFields('rise', 'fade', 900),
    customCssField()
  ],
  tests: [],
  cssTemplate: [
    { selector: '.scene', declarations: { 'font-family': '{font}' } },
    { selector: '.scene-title', declarations: { 'font-size': '{titleSize}', 'color': '{textColor}' } },
    { selector: '.scene-accent', declarations: { 'background-image': 'linear-gradient(90deg, {accent1}, {accent2})' } },
    { selector: '.scene-status-text', declarations: { 'color': '{accent1}' } }
  ],
  cssClasses: [
    { id: 'root', selector: '.widget-root' },
    { id: 'scene', selector: '.scene' },
    { id: 'sceneBackground', selector: '.scene-gradient, .scene-orbs span' },
    { id: 'sceneStatusLabel', selector: '.scene-status-label' },
    { id: 'sceneStatusText', selector: '.scene-status-text' },
    { id: 'sceneCard', selector: '.scene-card' },
    { id: 'sceneTitle', selector: '.scene-title' },
    { id: 'sceneAccent', selector: '.scene-accent' },
    { id: 'sceneCountdown', selector: '.scene-countdown' },
    { id: 'sceneSocials', selector: '.scene-socials' },
    { id: 'sceneSocial', selector: '.scene-social' }
  ],
  presets: [
    { id: 'neon', values: { background: 'orbs', font: 'Inter', titleSize: 112, backgroundColor: '#050505', accent1: '#3b82f6', accent2: '#a855f7', textColor: '#ffffff', italic: true } },
    { id: 'sunset', values: { background: 'gradient', font: 'Montserrat', titleSize: 104, backgroundColor: '#1c0a14', accent1: '#f97316', accent2: '#ec4899', textColor: '#fff7ed', italic: false } },
    { id: 'mint', values: { background: 'orbs', font: 'Poppins', titleSize: 100, backgroundColor: '#03120e', accent1: '#10b981', accent2: '#22d3ee', textColor: '#ecfdf5', italic: false } },
    { id: 'mono', values: { background: 'none', font: 'Bebas Neue', titleSize: 160, backgroundColor: '#000000', accent1: '#ffffff', accent2: '#a3a3a3', textColor: '#ffffff', italic: false } },
    { id: 'space-3d', values: { background: '3d', font: 'Inter', titleSize: 112, backgroundColor: '#050505', accent1: '#3b82f6', accent2: '#a855f7', textColor: '#ffffff', italic: true } }
  ]
}
