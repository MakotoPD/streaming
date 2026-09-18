import { animationFields, customCssField, languageField, type WidgetDefinition } from './define'

export const MUSIC_SOURCES = ['lastfm', 'listenbrainz'] as const

export const nowPlaying: WidgetDefinition = {
  type: 'now-playing',
  icon: 'i-lucide-music-2',
  category: 'scene',
  size: [600, 160],
  fields: [
    languageField(),
    { key: 'musicSource', section: 'general', type: 'select', default: 'lastfm', options: MUSIC_SOURCES },
    { key: 'musicUser', section: 'general', type: 'text', default: '', max: 64 },
    { key: 'nowPlayingLabel', section: 'general', type: 'text', default: '', max: 40 },
    { key: 'hideWhenIdle', section: 'general', type: 'toggle', default: true },
    { key: 'pollSeconds', section: 'general', type: 'number', default: 10, min: 5, max: 60, unit: 's' },

    { key: 'nowPlayingLayout', section: 'style', type: 'select', default: 'card', options: ['card', 'compact'] },
    { key: 'showCover', section: 'style', type: 'toggle', default: true },
    { key: 'showEqualizer', section: 'style', type: 'toggle', default: true },
    { key: 'coverSize', section: 'style', type: 'number', default: 96, min: 32, max: 240, unit: 'px', css: '--cover-size' },
    { key: 'font', section: 'style', type: 'font', default: 'Outfit', css: '--font' },
    { key: 'fontSize', section: 'style', type: 'number', default: 22, min: 10, max: 60, unit: 'px', css: '--font-size' },
    { key: 'textColor', section: 'style', type: 'color', default: '#ffffff', css: '--text' },
    { key: 'accentColor', section: 'style', type: 'color', default: '#1ed760', css: '--accent' },
    { key: 'background', section: 'style', type: 'color', default: 'rgba(12, 14, 20, 0.82)', css: '--bg' },
    { key: 'radius', section: 'style', type: 'number', default: 16, min: 0, max: 60, unit: 'px', css: '--radius' },

    ...animationFields('slide-up', 'fade', 450),
    customCssField()
  ],
  tests: ['track'],
  cssTemplate: [
    { selector: '.now-playing-card', declarations: { 'font-family': '{font}', 'font-size': '{fontSize}', 'color': '{textColor}', 'background': '{background}', 'border-radius': '{radius}' } },
    { selector: '.now-playing-cover', declarations: { width: '{coverSize}', height: '{coverSize}' } },
    { selector: '.now-playing-label', declarations: { color: '{accentColor}' } }
  ],
  cssClasses: [
    { id: 'root', selector: '.widget-root' },
    { id: 'nowPlayingCard', selector: '.now-playing-card' },
    { id: 'nowPlayingCover', selector: '.now-playing-cover' },
    { id: 'nowPlayingLabel', selector: '.now-playing-label' },
    { id: 'nowPlayingTitle', selector: '.now-playing-title' },
    { id: 'nowPlayingArtist', selector: '.now-playing-artist' },
    { id: 'nowPlayingBars', selector: '.now-playing-bars' }
  ],
  presets: [
    { id: 'glass', values: { nowPlayingLayout: 'card', showCover: true, showEqualizer: true, coverSize: 96, font: 'Outfit', fontSize: 22, textColor: '#ffffff', accentColor: '#1ed760', background: 'rgba(12, 14, 20, 0.82)', radius: 16 } },
    { id: 'minimal', values: { nowPlayingLayout: 'compact', showCover: false, showEqualizer: true, coverSize: 64, font: 'Inter', fontSize: 20, textColor: '#ffffff', accentColor: '#ffffff', background: 'transparent', radius: 0 } },
    { id: 'neon', values: { nowPlayingLayout: 'card', showCover: true, showEqualizer: true, coverSize: 110, font: 'Rubik', fontSize: 24, textColor: '#e0f2fe', accentColor: '#f472b6', background: 'rgba(3, 7, 18, 0.9)', radius: 60 } }
  ]
}
