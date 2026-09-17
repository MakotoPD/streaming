import { animationFields, customCssField, type WidgetDefinition } from './define'

export const chat: WidgetDefinition = {
  type: 'chat',
  icon: 'i-lucide-messages-square',
  category: 'chat',
  size: [450, 700],
  fields: [
    { key: 'maxMessages', section: 'general', type: 'number', default: 8, min: 1, max: 50 },
    { key: 'hideAfter', section: 'general', type: 'number', default: 0, min: 0, max: 600, unit: 's' },
    { key: 'direction', section: 'general', type: 'select', default: 'bottom', options: ['bottom', 'top'] },
    { key: 'showBadges', section: 'general', type: 'toggle', default: true },
    { key: 'showPlatform', section: 'general', type: 'toggle', default: false },
    { key: 'hideCommands', section: 'general', type: 'toggle', default: true },
    { key: 'ignoredUsers', section: 'general', type: 'list', default: [] },

    { key: 'font', section: 'style', type: 'font', default: 'Outfit', css: '--font' },
    { key: 'fontSize', section: 'style', type: 'number', default: 14, min: 8, max: 48, unit: 'px', css: '--font-size' },
    { key: 'emoteSize', section: 'style', type: 'number', default: 1.6, min: 1, max: 5, step: 0.1, unit: 'em', css: '--emote-size' },
    { key: 'textColor', section: 'style', type: 'color', default: '#f1f1f6', css: '--text' },
    { key: 'background', section: 'style', type: 'color', default: 'rgba(18, 18, 26, 0.82)', css: '--bg' },
    { key: 'borderColor', section: 'style', type: 'color', default: 'rgba(255, 255, 255, 0.08)', css: '--border' },
    { key: 'radius', section: 'style', type: 'number', default: 12, min: 0, max: 40, unit: 'px', css: '--radius' },
    { key: 'blur', section: 'style', type: 'number', default: 8, min: 0, max: 30, unit: 'px', css: '--blur' },
    { key: 'gap', section: 'style', type: 'number', default: 6, min: 0, max: 30, unit: 'px', css: '--gap' },
    { key: 'nameColor', section: 'style', type: 'select', default: 'user', options: ['user', 'fixed'] },
    { key: 'fixedNameColor', section: 'style', type: 'color', default: '#a78bfa', css: '--name-color' },

    ...animationFields('slide-up', 'fade', 250),
    customCssField()
  ],
  tests: ['chat'],
  cssTemplate: [
    { selector: '.chat', declarations: { 'font-family': '{font}', 'font-size': '{fontSize}', 'gap': '{gap}' } },
    { selector: '.chat-message', declarations: { 'color': '{textColor}', 'background': '{background}', 'border-color': '{borderColor}', 'border-radius': '{radius}', 'backdrop-filter': 'blur({blur})' } },
    { selector: '.emote img', declarations: { 'height': '{emoteSize}' } }
  ],
  cssClasses: [
    { id: 'root', selector: '.widget-root' },
    { id: 'chat', selector: '.chat' },
    { id: 'chatMessage', selector: '.chat-message' },
    { id: 'chatPlatformAttr', selector: '.chat-message[data-platform="kick"]' },
    { id: 'chatBadge', selector: '.chat-badge' },
    { id: 'chatPlatform', selector: '.chat-platform' },
    { id: 'chatName', selector: '.chat-name' },
    { id: 'chatText', selector: '.chat-text' },
    { id: 'emote', selector: '.emote img' }
  ],
  presets: [
    {
      id: 'glass',
      values: { font: 'Outfit', fontSize: 14, emoteSize: 1.6, textColor: '#f1f1f6', background: 'rgba(18, 18, 26, 0.82)', borderColor: 'rgba(255, 255, 255, 0.08)', radius: 12, blur: 8, gap: 6, nameColor: 'user', fixedNameColor: '#a78bfa' }
    },
    {
      id: 'minimal',
      values: { font: 'Inter', fontSize: 16, emoteSize: 1.8, textColor: '#ffffff', background: 'transparent', borderColor: 'transparent', radius: 0, blur: 0, gap: 2, nameColor: 'user', fixedNameColor: '#a78bfa' }
    },
    {
      id: 'bubble',
      values: { font: 'Poppins', fontSize: 14, emoteSize: 1.6, textColor: '#1f2937', background: 'rgba(255, 255, 255, 0.95)', borderColor: 'rgba(0, 0, 0, 0.06)', radius: 22, blur: 0, gap: 8, nameColor: 'fixed', fixedNameColor: '#7c3aed' }
    },
    {
      id: 'neon',
      values: { font: 'Rubik', fontSize: 15, emoteSize: 1.7, textColor: '#e0f2fe', background: 'rgba(3, 7, 18, 0.85)', borderColor: '#22d3ee', radius: 6, blur: 4, gap: 8, nameColor: 'user', fixedNameColor: '#22d3ee' }
    },
    {
      id: 'terminal',
      values: { font: 'JetBrains Mono', fontSize: 13, emoteSize: 1.5, textColor: '#86efac', background: 'rgba(0, 0, 0, 0.8)', borderColor: 'rgba(134, 239, 172, 0.3)', radius: 2, blur: 0, gap: 3, nameColor: 'fixed', fixedNameColor: '#fde047' }
    }
  ]
}
