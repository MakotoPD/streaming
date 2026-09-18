<script setup lang="ts">
import { DONATION_SOURCES, type DonationSource } from '#shared/types'

type State = Record<DonationSource, { configured: boolean, status: 'connecting' | 'connected' | 'error' | null }>

const { t } = useI18n()
const toast = useToast()

const { data, refresh } = useFetch<State>('/api/me/donations', { key: 'donations' })

const LINKS: Record<DonationSource, string> = {
  streamelements: 'https://streamelements.com/dashboard/account/channels',
  tipply: 'https://app.tipply.pl/panel-uzytkownika',
  streamlabs: 'https://streamlabs.com/dashboard#/settings/api-settings'
}

const ICONS: Record<DonationSource, string> = {
  streamelements: 'i-lucide-hexagon',
  tipply: 'i-lucide-hand-coins',
  streamlabs: 'i-simple-icons-streamlabs'
}

const drafts = reactive<Record<DonationSource, string>>({ streamelements: '', tipply: '', streamlabs: '' })
const busy = ref<DonationSource>()

async function save(source: DonationSource, value: string) {
  busy.value = source
  try {
    await $fetch('/api/me/donations', { method: 'PUT', body: { source, value } })
    drafts[source] = ''
    await refresh()
    toast.add({ title: t(value ? 'donations.saved' : 'donations.removed'), color: 'success', icon: 'i-lucide-check' })
  }
  catch (err: any) {
    toast.add({ title: t(`donations.errors.${err?.data?.message ?? 'generic'}`), color: 'error' })
  }
  finally {
    busy.value = undefined
  }
}

function badge(source: DonationSource) {
  const item = data.value?.[source]
  if (!item?.configured) return undefined
  if (item.status === 'connected') return { color: 'success' as const, label: t('donations.status.connected') }
  if (item.status === 'error') return { color: 'error' as const, label: t('donations.status.error') }
  if (item.status === 'connecting') return { color: 'warning' as const, label: t('donations.status.connecting') }
  return { color: 'neutral' as const, label: t('donations.status.idle') }
}
</script>

<template>
  <UCard>
    <template #header>
      <h2 class="font-semibold">
        {{ t('donations.title') }}
      </h2>
      <p class="text-sm text-muted">
        {{ t('donations.hint') }}
      </p>
    </template>

    <div class="divide-y divide-default">
      <div v-for="source in DONATION_SOURCES" :key="source" class="space-y-2 py-4 first:pt-0 last:pb-0">
        <div class="flex flex-wrap items-center gap-2">
          <UIcon :name="ICONS[source]" class="size-5 text-primary" />
          <span class="font-medium">{{ t(`donations.sources.${source}.name`) }}</span>
          <UBadge v-if="badge(source)" :color="badge(source)!.color" variant="subtle" size="sm" :label="badge(source)!.label" />
          <div class="flex-1" />
          <UButton
            v-if="data?.[source]?.configured"
            size="xs"
            color="error"
            variant="ghost"
            icon="i-lucide-unlink"
            :loading="busy === source"
            :label="t('donations.remove')"
            @click="save(source, '')"
          />
        </div>
        <p class="text-xs text-muted">
          {{ t(`donations.sources.${source}.help`) }}
          <ULink :to="LINKS[source]" target="_blank" class="text-primary">{{ t('donations.open') }}</ULink>
        </p>
        <UForm :state="drafts" class="flex gap-2" @submit="save(source, drafts[source])">
          <UInput
            v-model="drafts[source]"
            :type="source === 'tipply' ? 'text' : 'password'"
            autocomplete="off"
            :placeholder="t(data?.[source]?.configured ? 'donations.replacePlaceholder' : `donations.sources.${source}.placeholder`)"
            class="flex-1"
          />
          <UButton type="submit" :loading="busy === source" :disabled="!drafts[source].trim()" :label="t('common.save')" />
        </UForm>
      </div>
    </div>
  </UCard>
</template>
