import { animationFields, customCssField, languageField, type WidgetDefinition } from './define'

export const twitchPoll: WidgetDefinition = {
  type: 'twitch-poll',
  icon: 'i-lucide-vote',
  size: [600, 400],
  fields: [
    languageField(),
    { key: 'pollKinds', section: 'general', type: 'select', default: 'both', options: ['both', 'polls', 'predictions'] },
    { key: 'resultsHold', section: 'general', type: 'number', default: 15, min: 0, max: 300, unit: 's' },
    { key: 'showVotes', section: 'general', type: 'toggle', default: true },
    { key: 'showPoints', section: 'general', type: 'toggle', default: true },

    { key: 'font', section: 'style', type: 'font', default: 'Outfit', css: '--font' },
    { key: 'fontSize', section: 'style', type: 'number', default: 20, min: 10, max: 60, unit: 'px', css: '--font-size' },
    { key: 'textColor', section: 'style', type: 'color', default: '#ffffff', css: '--text' },
    { key: 'background', section: 'style', type: 'color', default: 'rgba(12, 14, 20, 0.85)', css: '--bg' },
    { key: 'barColor', section: 'style', type: 'color', default: '#9147ff', css: '--bar' },
    { key: 'barBackground', section: 'style', type: 'color', default: 'rgba(255, 255, 255, 0.08)', css: '--bar-bg' },
    { key: 'blueColor', section: 'style', type: 'color', default: '#387aff', css: '--blue' },
    { key: 'pinkColor', section: 'style', type: 'color', default: '#f5009b', css: '--pink' },
    { key: 'winnerColor', section: 'style', type: 'color', default: '#22c55e', css: '--winner' },
    { key: 'radius', section: 'style', type: 'number', default: 16, min: 0, max: 40, unit: 'px', css: '--radius' },

    ...animationFields('slide-up', 'fade', 500),
    customCssField()
  ],
  tests: ['pollProgress', 'pollEnd', 'predictionProgress', 'predictionEnd'],
  cssTemplate: [
    { selector: '.tpoll', declarations: { 'font-family': '{font}', 'font-size': '{fontSize}', 'color': '{textColor}', 'background': '{background}', 'border-radius': '{radius}' } },
    { selector: '.tpoll-bar', declarations: { background: '{barBackground}' } },
    { selector: '.tpoll-fill', declarations: { background: '{barColor}' } },
    { selector: '.tpoll-blue .tpoll-fill', declarations: { background: '{blueColor}' } },
    { selector: '.tpoll-pink .tpoll-fill', declarations: { background: '{pinkColor}' } },
    { selector: '.tpoll-winner .tpoll-fill', declarations: { background: '{winnerColor}' } }
  ],
  cssClasses: [
    { id: 'root', selector: '.widget-root' },
    { id: 'tpoll', selector: '.tpoll' },
    { id: 'tpollTitle', selector: '.tpoll-title' },
    { id: 'tpollOption', selector: '.tpoll-option' },
    { id: 'tpollBar', selector: '.tpoll-bar' },
    { id: 'tpollFill', selector: '.tpoll-fill' },
    { id: 'tpollLabel', selector: '.tpoll-label' },
    { id: 'tpollCount', selector: '.tpoll-count' },
    { id: 'tpollWinner', selector: '.tpoll-winner' },
    { id: 'tpollStatus', selector: '.tpoll-status' }
  ],
  presets: [
    { id: 'glass', values: { font: 'Outfit', fontSize: 20, textColor: '#ffffff', background: 'rgba(12, 14, 20, 0.85)', barColor: '#9147ff', barBackground: 'rgba(255, 255, 255, 0.08)', blueColor: '#387aff', pinkColor: '#f5009b', winnerColor: '#22c55e', radius: 16 } },
    { id: 'clean', values: { font: 'Inter', fontSize: 20, textColor: '#111827', background: '#ffffff', barColor: '#7c3aed', barBackground: '#e5e7eb', blueColor: '#2563eb', pinkColor: '#db2777', winnerColor: '#16a34a', radius: 12 } },
    { id: 'neon', values: { font: 'Rubik', fontSize: 22, textColor: '#e0f2fe', background: 'rgba(3, 7, 18, 0.9)', barColor: '#22d3ee', barBackground: 'rgba(34, 211, 238, 0.12)', blueColor: '#22d3ee', pinkColor: '#f472b6', winnerColor: '#a3e635', radius: 6 } }
  ]
}
