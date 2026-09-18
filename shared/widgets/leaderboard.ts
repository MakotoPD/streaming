import { customCssField, languageField, type WidgetDefinition } from './define'

export const leaderboard: WidgetDefinition = {
  type: 'leaderboard',
  icon: 'i-lucide-trophy',
  category: 'interactive',
  size: [420, 360],
  fields: [
    languageField(),
    { key: 'leaderboardMode', section: 'general', type: 'select', default: 'chatters', options: ['chatters', 'gifters', 'bits', 'donors'] },
    { key: 'leaderboardTitle', section: 'general', type: 'text', default: '', max: 60 },
    { key: 'limit', section: 'general', type: 'number', default: 5, min: 1, max: 20 },
    { key: 'showCount', section: 'general', type: 'toggle', default: true },
    { key: 'ignoredUsers', section: 'general', type: 'list', default: [] },

    { key: 'font', section: 'style', type: 'font', default: 'Outfit', css: '--font' },
    { key: 'fontSize', section: 'style', type: 'number', default: 18, min: 10, max: 48, unit: 'px', css: '--font-size' },
    { key: 'textColor', section: 'style', type: 'color', default: '#ffffff', css: '--text' },
    { key: 'background', section: 'style', type: 'color', default: 'rgba(12, 14, 20, 0.8)', css: '--bg' },
    { key: 'firstColor', section: 'style', type: 'color', default: '#facc15', css: '--first' },
    { key: 'radius', section: 'style', type: 'number', default: 16, min: 0, max: 40, unit: 'px', css: '--radius' },
    { key: 'gap', section: 'style', type: 'number', default: 6, min: 0, max: 30, unit: 'px', css: '--gap' },

    customCssField()
  ],
  tests: ['chat', 'gifts', 'bits', 'donation'],
  actions: ['reset'],
  cssTemplate: [
    { selector: '.leaderboard', declarations: { 'font-family': '{font}', 'font-size': '{fontSize}', 'color': '{textColor}', 'background': '{background}', 'border-radius': '{radius}', 'gap': '{gap}' } },
    { selector: '.leaderboard-first', declarations: { color: '{firstColor}' } }
  ],
  cssClasses: [
    { id: 'root', selector: '.widget-root' },
    { id: 'leaderboard', selector: '.leaderboard' },
    { id: 'leaderboardTitle', selector: '.leaderboard-title' },
    { id: 'leaderboardRow', selector: '.leaderboard-row' },
    { id: 'leaderboardRank', selector: '.leaderboard-rank' },
    { id: 'leaderboardName', selector: '.leaderboard-name' },
    { id: 'leaderboardCount', selector: '.leaderboard-count' },
    { id: 'leaderboardFirst', selector: '.leaderboard-first' }
  ],
  presets: [
    { id: 'glass', values: { font: 'Outfit', fontSize: 18, textColor: '#ffffff', background: 'rgba(12, 14, 20, 0.8)', firstColor: '#facc15', radius: 16, gap: 6 } },
    { id: 'gold', values: { font: 'Montserrat', fontSize: 18, textColor: '#fef3c7', background: 'rgba(41, 22, 4, 0.9)', firstColor: '#fbbf24', radius: 8, gap: 8 } },
    { id: 'clean', values: { font: 'Inter', fontSize: 18, textColor: '#111827', background: '#ffffff', firstColor: '#d97706', radius: 12, gap: 4 } },
    { id: 'retro', values: { font: 'Press Start 2P', fontSize: 12, textColor: '#a5f3fc', background: 'rgba(30, 27, 75, 0.9)', firstColor: '#fde047', radius: 0, gap: 10 } }
  ]
}
