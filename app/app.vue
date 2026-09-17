<script setup lang="ts">
import * as uiLocales from '@nuxt/ui/locale'

const { locale, t } = useI18n()
const uiLocale = computed(() => uiLocales[locale.value as keyof typeof uiLocales] ?? uiLocales.en)
const site = useRuntimeConfig().public.siteUrl.replace(/\/$/, '')
const route = useRoute()

useHead({
  htmlAttrs: { lang: locale },
  titleTemplate: title => (title ? `${title} · Streaming` : 'Streaming · Stream widgets for OBS'),
  link: [
    { rel: 'icon', href: '/favicon.ico', sizes: 'any' },
    { rel: 'icon', type: 'image/png', sizes: '32x32', href: '/favicon-32.png' },
    { rel: 'apple-touch-icon', sizes: '180x180', href: '/apple-touch-icon.png' },
    { rel: 'canonical', href: () => `${site}${route.path === '/' ? '' : route.path}` }
  ]
})

useSeoMeta({
  description: () => t('seo.description'),
  ogTitle: () => t('seo.title'),
  ogDescription: () => t('seo.description'),
  ogType: 'website',
  ogSiteName: 'Streaming',
  ogUrl: () => `${site}${route.path === '/' ? '' : route.path}`,
  ogImage: `${site}/og.png`,
  ogImageWidth: 1200,
  ogImageHeight: 630,
  ogLocale: () => locale.value,
  twitterCard: 'summary_large_image',
  twitterTitle: () => t('seo.title'),
  twitterDescription: () => t('seo.description'),
  twitterImage: `${site}/og.png`
})
</script>

<template>
  <UApp :locale="uiLocale">
    <NuxtRouteAnnouncer />
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </UApp>
</template>
