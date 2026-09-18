<script setup lang="ts">
import { WIDGETS } from '#shared/widgets'

const { t } = useI18n()
const toast = useToast()
const route = useRoute()
const { loggedIn, fetch: refreshSession } = useUserSession()
const { appName } = useRuntimeConfig().public

useHead({ title: () => t('landing.title') })

const form = reactive({ twitch: '', kick: '' })
const loading = ref(false)

onMounted(() => {
  if (route.query.error) toast.add({ title: t('landing.loginError'), color: 'error', icon: 'i-lucide-circle-alert' })
})

async function continueAsGuest() {
  if (!form.twitch.trim() && !form.kick.trim()) {
    toast.add({ title: t('landing.nickRequired'), color: 'warning' })
    return
  }
  loading.value = true
  try {
    await $fetch('/api/guest', { method: 'POST', body: form })
    await refreshSession()
    await navigateTo('/dashboard')
  }
  catch {
    toast.add({ title: t('landing.invalidNick'), color: 'error' })
  }
  finally {
    loading.value = false
  }
}

const widgets = Object.values(WIDGETS)
const bullets = ['free', 'noInstall', 'live']
const steps = ['pick', 'style', 'paste']
const features = [
  { icon: 'i-lucide-monitor', key: 'obs' },
  { icon: 'i-lucide-smile-plus', key: 'emotes' },
  { icon: 'i-lucide-palette', key: 'styles' },
  { icon: 'i-lucide-users', key: 'canvas' }
]

function backToTop() {
  window.scrollTo({ top: 0, behavior: 'smooth' })
}
</script>

<template>
  <div>
    <section class="relative overflow-hidden border-b border-default">
      <div class="pointer-events-none absolute inset-0 hero-grid" />
      <UContainer class="relative py-14 lg:py-20">
        <div class="grid items-start gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,26rem)]">
          <div>
            <p class="mb-4 font-mono text-sm font-semibold uppercase tracking-widest text-primary">
              {{ appName }}
            </p>
            <div class="flex flex-wrap items-center gap-2 text-xs font-medium text-muted">
              <span class="inline-flex items-center gap-1.5 rounded-full border border-default px-2.5 py-1">
                <UIcon name="i-simple-icons-twitch" class="size-3.5" /> Twitch
              </span>
              <span class="inline-flex items-center gap-1.5 rounded-full border border-default px-2.5 py-1">
                <UIcon name="i-simple-icons-kick" class="size-3.5" /> Kick
              </span>
              <span class="inline-flex items-center gap-1.5 rounded-full border border-default px-2.5 py-1">
                <UIcon name="i-simple-icons-youtube" class="size-3.5" /> YouTube
              </span>
              <span class="rounded-full border border-default px-2.5 py-1">7TV</span>
              <span class="rounded-full border border-default px-2.5 py-1">BetterTTV</span>
            </div>

            <h1 class="mt-5 text-4xl font-bold leading-[1.05] tracking-tight text-highlighted sm:text-5xl lg:text-6xl">
              {{ t('landing.headline') }}
            </h1>
            <p class="mt-5 max-w-xl text-lg text-muted">
              {{ t('landing.description') }}
            </p>

            <ul class="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-sm">
              <li v-for="bullet in bullets" :key="bullet" class="flex items-center gap-2">
                <UIcon name="i-lucide-check" class="size-4 text-primary" />
                {{ t(`landing.bullets.${bullet}`) }}
              </li>
            </ul>

            <div class="mt-10">
              <LandingShowcase />
            </div>
          </div>

          <UCard class="lg:sticky lg:top-24" :ui="{ body: 'space-y-4' }">
            <template v-if="loggedIn">
              <p class="text-muted">
                {{ t('landing.welcomeBack') }}
              </p>
              <UButton to="/dashboard" size="xl" block icon="i-lucide-layout-dashboard" :label="t('nav.dashboard')" />
            </template>

            <template v-else>
              <div>
                <h2 class="text-lg font-semibold text-highlighted">
                  {{ t('landing.guestTitle') }}
                </h2>
                <p class="mt-1 text-sm text-muted">
                  {{ t('landing.guestDescription') }}
                </p>
              </div>

              <UForm :state="form" class="space-y-3" @submit="continueAsGuest">
                <UFormField :label="t('platforms.twitch')" name="twitch">
                  <UInput v-model="form.twitch" icon="i-simple-icons-twitch" placeholder="nick" class="w-full" />
                </UFormField>
                <UFormField :label="t('platforms.kick')" name="kick">
                  <UInput v-model="form.kick" icon="i-simple-icons-kick" placeholder="nick" class="w-full" />
                </UFormField>
                <UButton type="submit" block size="lg" :loading="loading" :label="t('landing.continue')" trailing-icon="i-lucide-arrow-right" />
              </UForm>

              <USeparator :label="t('landing.or')" />

              <div class="space-y-2">
                <p class="text-sm text-muted">
                  {{ t('landing.loginDescription') }}
                </p>
                <UButton to="/auth/twitch" external icon="i-simple-icons-twitch" color="neutral" variant="outline" block :label="t('landing.loginWith', { platform: 'Twitch' })" />
                <UButton to="/auth/kick" external icon="i-simple-icons-kick" color="neutral" variant="outline" block :label="t('landing.loginWith', { platform: 'Kick' })" />
                <UButton to="/auth/youtube" external icon="i-simple-icons-youtube" color="neutral" variant="outline" block :label="t('landing.loginWith', { platform: 'YouTube' })" />
                <p class="text-xs text-dimmed">
                  {{ t('landing.youtubeNeedsLogin') }}
                </p>
              </div>
            </template>
          </UCard>
        </div>
      </UContainer>
    </section>

    <section class="border-b border-default">
      <UContainer class="py-14 lg:py-20">
        <div class="grid gap-10 lg:grid-cols-2">
          <div>
            <h2 class="text-3xl font-bold tracking-tight text-highlighted">
              {{ t('landing.whatIs.title', { app: appName }) }}
            </h2>
            <p class="mt-4 text-lg text-muted">
              {{ t('landing.whatIs.text', { app: appName }) }}
            </p>
          </div>
          <div class="rounded-xl border border-default p-6">
            <span class="inline-flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-primary">
              <UIcon name="i-simple-icons-youtube" class="size-4" /> {{ t('landing.google.eyebrow') }}
            </span>
            <h3 class="mt-2 text-xl font-semibold text-highlighted">
              {{ t('landing.google.title') }}
            </h3>
            <ul class="mt-4 space-y-3 text-sm text-muted">
              <li v-for="item in ['channel', 'subscribers', 'chat', 'never']" :key="item" class="flex gap-2">
                <UIcon :name="item === 'never' ? 'i-lucide-shield-check' : 'i-lucide-check'" class="mt-0.5 size-4 shrink-0 text-primary" />
                {{ t(`landing.google.${item}`) }}
              </li>
            </ul>
            <UButton to="/privacy" variant="link" class="mt-3 -ms-2.5" trailing-icon="i-lucide-arrow-right" :label="t('landing.google.policy')" />
          </div>
        </div>
      </UContainer>
    </section>

    <section class="border-b border-default">
      <UContainer class="py-14 lg:py-20">
        <div class="max-w-2xl">
          <span class="font-mono text-xs uppercase tracking-widest text-primary">{{ t('landing.steps.eyebrow') }}</span>
          <h2 class="mt-2 text-3xl font-bold tracking-tight text-highlighted">
            {{ t('landing.steps.title') }}
          </h2>
        </div>

        <ol class="mt-10 grid gap-px overflow-hidden rounded-xl border border-default bg-accented md:grid-cols-3">
          <li v-for="(step, index) in steps" :key="step" class="bg-default p-6">
            <span class="font-mono text-sm text-primary">{{ String(index + 1).padStart(2, '0') }}</span>
            <h3 class="mt-2 font-semibold text-highlighted">
              {{ t(`landing.steps.${step}.title`) }}
            </h3>
            <p class="mt-1.5 text-sm text-muted">
              {{ t(`landing.steps.${step}.text`) }}
            </p>
          </li>
        </ol>
      </UContainer>
    </section>

    <section class="border-b border-default">
      <UContainer class="py-14 lg:py-20">
        <div class="max-w-2xl">
          <span class="font-mono text-xs uppercase tracking-widest text-primary">{{ t('landing.catalog.eyebrow') }}</span>
          <h2 class="mt-2 text-3xl font-bold tracking-tight text-highlighted">
            {{ t('landing.catalog.title', { count: widgets.length }) }}
          </h2>
          <p class="mt-2 text-muted">
            {{ t('landing.catalog.text') }}
          </p>
        </div>

        <div class="mt-8 flex flex-wrap gap-2">
          <div
            v-for="widget in widgets"
            :key="widget.type"
            class="flex items-center gap-2 rounded-lg border border-default px-3 py-2 text-sm"
          >
            <UIcon :name="widget.icon" class="size-4 text-primary" />
            {{ t(`widgets.${widget.type}.name`) }}
          </div>
        </div>
      </UContainer>
    </section>

    <section class="border-b border-default">
      <UContainer class="py-14 lg:py-20">
        <div class="grid gap-8 sm:grid-cols-2">
          <div v-for="feature in features" :key="feature.key" class="flex gap-4">
            <UIcon :name="feature.icon" class="mt-0.5 size-6 shrink-0 text-primary" />
            <div>
              <h3 class="font-semibold text-highlighted">
                {{ t(`landing.features.${feature.key}.title`) }}
              </h3>
              <p class="mt-1 text-sm text-muted">
                {{ t(`landing.features.${feature.key}.text`) }}
              </p>
            </div>
          </div>
        </div>
      </UContainer>
    </section>

    <section>
      <UContainer class="py-14 lg:py-20">
        <div class="flex flex-col items-start gap-6 rounded-xl border border-default p-8 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 class="text-2xl font-bold tracking-tight text-highlighted">
              {{ t('landing.cta.title') }}
            </h2>
            <p class="mt-1 text-muted">
              {{ t('landing.cta.text') }}
            </p>
          </div>
          <UButton
            v-if="loggedIn"
            to="/dashboard"
            size="xl"
            :label="t('nav.dashboard')"
            trailing-icon="i-lucide-arrow-right"
          />
          <UButton
            v-else
            size="xl"
            :label="t('landing.cta.button')"
            trailing-icon="i-lucide-arrow-up"
            @click="backToTop"
          />
        </div>
      </UContainer>
    </section>
  </div>
</template>

<style scoped>
.hero-grid {
  background-image:
    linear-gradient(to right, var(--ui-border) 1px, transparent 1px),
    linear-gradient(to bottom, var(--ui-border) 1px, transparent 1px);
  background-size: 64px 64px;
  mask-image: radial-gradient(ellipse 80% 60% at 50% 0%, black, transparent 70%);
}
</style>
