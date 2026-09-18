export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  modules: ['@nuxt/ui', '@nuxtjs/i18n', 'nuxt-auth-utils'],
  css: ['~/assets/css/main.css'],

  runtimeConfig: {
    databaseUrl: '',
    uploadDir: './data/uploads',
    twitchWebhookSecret: '',
    piperUrl: '',
    lastfmApiKey: '',
    public: {
      siteUrl: 'http://localhost:3000'
    }
  },

  nitro: {
    serverAssets: [{ baseName: 'sounds', dir: '../server/assets/sounds' }]
  },

  routeRules: {
    '/o/**': { ssr: false },
    '/c/**': { ssr: false }
  },

  i18n: {
    strategy: 'no_prefix',
    defaultLocale: 'en',
    locales: [
      { code: 'en', language: 'en-US', name: 'English', file: 'en.json' },
      { code: 'pl', language: 'pl-PL', name: 'Polski', file: 'pl.json' },
      { code: 'es', language: 'es-ES', name: 'Español', file: 'es.json' },
      { code: 'de', language: 'de-DE', name: 'Deutsch', file: 'de.json' },
      { code: 'ru', language: 'ru-RU', name: 'Русский', file: 'ru.json' }
    ],
    detectBrowserLanguage: { useCookie: true, cookieKey: 'lang', redirectOn: 'root' }
  }
})
