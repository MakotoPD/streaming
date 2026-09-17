<script setup lang="ts">
const { t } = useI18n()
const toast = useToast()
const route = useRoute()
const { loggedIn, fetch: refreshSession } = useUserSession()

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

const features = [
  { icon: 'i-lucide-monitor', key: 'obs' },
  { icon: 'i-lucide-smile-plus', key: 'emotes' },
  { icon: 'i-lucide-palette', key: 'styles' }
]
</script>

<template>
  <UContainer class="py-16 lg:py-24">
    <div class="grid lg:grid-cols-2 gap-12 items-center">
      <div>
        <UBadge :label="t('landing.badge')" variant="subtle" class="mb-4" />
        <h1 class="text-4xl lg:text-6xl font-bold tracking-tight text-highlighted">
          {{ t('landing.headline') }}
        </h1>
        <p class="mt-6 text-lg text-muted">
          {{ t('landing.description') }}
        </p>
      </div>

      <UCard>
        <template v-if="loggedIn">
          <p class="mb-4 text-muted">
            {{ t('landing.welcomeBack') }}
          </p>
          <UButton to="/dashboard" size="xl" block icon="i-lucide-layout-dashboard" :label="t('nav.dashboard')" />
        </template>

        <template v-else>
          <h2 class="text-lg font-semibold mb-1">
            {{ t('landing.guestTitle') }}
          </h2>
          <p class="text-sm text-muted mb-4">
            {{ t('landing.guestDescription') }}
          </p>

          <UForm :state="form" class="space-y-3" @submit="continueAsGuest">
            <UFormField :label="t('platforms.twitch')" name="twitch">
              <UInput v-model="form.twitch" icon="i-simple-icons-twitch" placeholder="nick" class="w-full" />
            </UFormField>
            <UFormField :label="t('platforms.kick')" name="kick">
              <UInput v-model="form.kick" icon="i-simple-icons-kick" placeholder="nick" class="w-full" />
            </UFormField>
            <UFormField :label="t('platforms.youtube')" name="youtube" :hint="t('common.soon')">
              <UInput icon="i-simple-icons-youtube" disabled class="w-full" />
            </UFormField>
            <UButton type="submit" block size="lg" :loading="loading" :label="t('landing.continue')" trailing-icon="i-lucide-arrow-right" />
          </UForm>

          <USeparator :label="t('landing.or')" class="my-6" />

          <p class="text-sm text-muted mb-3">
            {{ t('landing.loginDescription') }}
          </p>
          <div class="grid sm:grid-cols-2 gap-2">
            <UButton to="/auth/twitch" external icon="i-simple-icons-twitch" color="neutral" variant="outline" block :label="t('landing.loginWith', { platform: 'Twitch' })" />
            <UButton to="/auth/kick" external icon="i-simple-icons-kick" color="neutral" variant="outline" block :label="t('landing.loginWith', { platform: 'Kick' })" />
          </div>
        </template>
      </UCard>
    </div>

    <div class="grid md:grid-cols-3 gap-6 mt-20">
      <UCard v-for="feature in features" :key="feature.key">
        <UIcon :name="feature.icon" class="size-8 text-primary mb-3" />
        <h3 class="font-semibold mb-1">
          {{ t(`landing.features.${feature.key}.title`) }}
        </h3>
        <p class="text-sm text-muted">
          {{ t(`landing.features.${feature.key}.text`) }}
        </p>
      </UCard>
    </div>
  </UContainer>
</template>
