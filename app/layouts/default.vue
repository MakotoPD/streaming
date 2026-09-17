<script setup lang="ts">
import { de, en, es, pl, ru } from '@nuxt/ui/locale'

const { t, locale, setLocale } = useI18n()
const { loggedIn, clear } = useUserSession()

async function logout() {
  await clear()
  clearNuxtData('me')
  await navigateTo('/')
}
</script>

<template>
  <div class="min-h-screen flex flex-col">
    <header class="border-b border-default bg-default/75 backdrop-blur sticky top-0 z-50">
      <UContainer class="h-16 flex items-center gap-1 sm:gap-3">
        <NuxtLink to="/" class="flex items-center gap-2 font-bold text-lg">
          <UIcon name="i-lucide-radio" class="size-6 text-primary" />
          <span class="hidden sm:inline">Streaming</span>
        </NuxtLink>

        <div class="flex-1" />

        <UButton
          v-if="loggedIn"
          to="/dashboard"
          icon="i-lucide-layout-dashboard"
          :aria-label="t('nav.dashboard')"
          color="neutral"
          variant="ghost"
        >
          <span class="hidden sm:inline">{{ t('nav.dashboard') }}</span>
        </UButton>
        <ULocaleSelect
          :model-value="locale"
          :locales="[en, pl, es, de, ru]"
          class="w-28 sm:w-36"
          @update:model-value="setLocale($event as 'en')"
        />
        <UColorModeButton />
        <UButton
          v-if="loggedIn"
          icon="i-lucide-log-out"
          color="neutral"
          variant="ghost"
          :aria-label="t('nav.logout')"
          @click="logout"
        />
      </UContainer>
    </header>

    <main class="flex-1">
      <slot />
    </main>

    <footer class="border-t border-default py-6 text-sm text-muted">
      <UContainer class="flex flex-wrap items-center justify-between gap-2">
        <span>{{ t('footer.tagline') }}</span>
        <span>{{ t('footer.contribute') }}</span>
      </UContainer>
    </footer>
  </div>
</template>
