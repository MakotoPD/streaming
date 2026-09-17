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
        <UButton
          v-if="loggedIn"
          to="/dashboard/library"
          icon="i-lucide-folder-open"
          :aria-label="t('nav.library')"
          color="neutral"
          variant="ghost"
        >
          <span class="hidden sm:inline">{{ t('nav.library') }}</span>
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

    <footer class="border-t border-default py-10 text-sm text-muted">
      <UContainer class="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
        <div class="space-y-1">
          <div class="flex items-center gap-2 font-semibold text-default">
            <UIcon name="i-lucide-radio" class="size-5 text-primary" />
            Streaming
          </div>
          <p>{{ t('footer.tagline') }}</p>
          <p class="text-dimmed">
            {{ t('footer.rights') }}
          </p>
        </div>
        <nav class="flex flex-col gap-2 sm:items-end">
          <NuxtLink to="/privacy" class="hover:text-default">
            {{ t('nav.privacy') }}
          </NuxtLink>
          <NuxtLink to="/terms" class="hover:text-default">
            {{ t('nav.terms') }}
          </NuxtLink>
          <NuxtLink to="/cookies" class="hover:text-default">
            {{ t('nav.cookies') }}
          </NuxtLink>
          <span class="text-dimmed">{{ t('footer.contribute') }}</span>
        </nav>
      </UContainer>
    </footer>

    <CookieNotice />
  </div>
</template>
