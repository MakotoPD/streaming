<script setup lang="ts">
import type { Settings } from '#shared/types'
import { WIDGET_TYPES, WIDGETS } from '#shared/widgets'

definePageMeta({ middleware: 'auth' })

const { t } = useI18n()
const toast = useToast()

useHead({ title: () => t('nav.dashboard') })

interface WidgetRow { id: string, type: string, name: string, token: string, settings: Settings }

const { data: me, refresh: refreshMe } = await useMe()
const { data: widgets, refresh } = await useFetch<WidgetRow[]>('/api/widgets', { default: () => [] })

const channels = reactive({ twitch: '', kick: '' })
watch(me, (value) => {
  channels.twitch = value?.channels.twitch?.login ?? ''
  channels.kick = value?.channels.kick?.slug ?? ''
}, { immediate: true })

const savingChannels = ref(false)
async function saveChannels() {
  savingChannels.value = true
  try {
    await $fetch('/api/me/channels', { method: 'PUT', body: channels })
    await refreshMe()
    toast.add({ title: t('common.saved'), color: 'success', icon: 'i-lucide-check' })
  }
  catch {
    toast.add({ title: t('landing.invalidNick'), color: 'error' })
  }
  finally {
    savingChannels.value = false
  }
}

const linked = computed(() => new Set(me.value?.accounts.map(a => a.provider)))

const addItems = computed(() => WIDGET_TYPES.map(type => ({
  label: t(`widgets.${type}.name`),
  icon: WIDGETS[type]!.icon,
  onSelect: () => addWidget(type)
})))

async function addWidget(type: string) {
  const widget = await $fetch<WidgetRow>('/api/widgets', { method: 'POST', body: { type } })
  await navigateTo(`/dashboard/${widget.id}`)
}

async function removeWidget(widget: WidgetRow) {
  if (!confirm(t('dashboard.confirmDelete'))) return
  await $fetch(`/api/widgets/${widget.id}`, { method: 'DELETE' })
  await refresh()
}

const { copyObsUrl } = useObsUrl()
</script>

<template>
  <UContainer class="py-10 space-y-10">
    <section>
      <div class="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h1 class="text-2xl font-bold">
            {{ t('dashboard.title') }}
          </h1>
          <p class="text-muted">
            {{ t('dashboard.subtitle') }}
          </p>
        </div>
        <UDropdownMenu :items="addItems">
          <UButton icon="i-lucide-plus" :label="t('dashboard.addWidget')" />
        </UDropdownMenu>
      </div>

      <div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <UCard v-for="widget in widgets" :key="widget.id" :ui="{ body: 'flex flex-col gap-4 h-full' }">
          <div class="flex items-start gap-3">
            <div class="rounded-lg bg-primary/10 p-2.5">
              <UIcon :name="WIDGETS[widget.type]!.icon" class="size-6 text-primary" />
            </div>
            <div class="min-w-0 flex-1">
              <h2 class="font-semibold truncate">
                {{ widgetTitle(widget, t) }}
              </h2>
              <p class="text-sm text-muted line-clamp-2">
                {{ t(`widgets.${widget.type}.description`) }}
              </p>
            </div>
          </div>
          <div class="flex gap-2 mt-auto">
            <UButton :to="`/dashboard/${widget.id}`" icon="i-lucide-pencil" :label="t('dashboard.edit')" class="flex-1 justify-center" />
            <UButton icon="i-lucide-link" color="neutral" variant="outline" :aria-label="t('dashboard.copyUrl')" @click="copyObsUrl(widget.token)" />
            <UButton icon="i-lucide-trash" color="error" variant="ghost" :aria-label="t('common.delete')" @click="removeWidget(widget)" />
          </div>
        </UCard>
      </div>
    </section>

    <section class="grid lg:grid-cols-2 gap-6">
      <UCard>
        <template #header>
          <h2 class="font-semibold">
            {{ t('dashboard.channels') }}
          </h2>
          <p class="text-sm text-muted">
            {{ t('dashboard.channelsHint') }}
          </p>
        </template>
        <UForm :state="channels" class="space-y-3" @submit="saveChannels">
          <UFormField :label="t('platforms.twitch')" name="twitch">
            <UInput v-model="channels.twitch" icon="i-simple-icons-twitch" class="w-full" />
          </UFormField>
          <UFormField :label="t('platforms.kick')" name="kick">
            <UInput v-model="channels.kick" icon="i-simple-icons-kick" class="w-full" />
          </UFormField>
          <UButton type="submit" :loading="savingChannels" icon="i-lucide-save" :label="t('common.save')" />
        </UForm>
      </UCard>

      <UCard>
        <template #header>
          <h2 class="font-semibold">
            {{ t('dashboard.accounts') }}
          </h2>
          <p class="text-sm text-muted">
            {{ t('dashboard.accountsHint') }}
          </p>
        </template>
        <div class="space-y-3">
          <div v-for="account in me?.accounts" :key="account.provider" class="flex items-center gap-3">
            <UAvatar :src="account.avatar ?? undefined" :alt="account.displayName" />
            <div class="flex-1">
              <div class="font-medium">
                {{ account.displayName }}
              </div>
              <div class="text-xs text-muted flex items-center gap-1">
                <UIcon :name="`i-simple-icons-${account.provider}`" /> {{ t(`platforms.${account.provider}`) }}
              </div>
            </div>
            <UBadge color="success" variant="subtle" :label="t('dashboard.connected')" />
          </div>
          <div class="flex flex-wrap gap-2">
            <UButton v-if="!linked.has('twitch')" to="/auth/twitch" external icon="i-simple-icons-twitch" color="neutral" variant="outline" :label="t('dashboard.connect', { platform: 'Twitch' })" />
            <UButton v-if="!linked.has('kick')" to="/auth/kick" external icon="i-simple-icons-kick" color="neutral" variant="outline" :label="t('dashboard.connect', { platform: 'Kick' })" />
          </div>
        </div>
      </UCard>
    </section>
  </UContainer>
</template>
