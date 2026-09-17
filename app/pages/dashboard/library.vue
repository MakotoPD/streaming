<script setup lang="ts">
import { WIDGETS } from '#shared/widgets'

definePageMeta({ middleware: 'auth' })

const { t } = useI18n()
const toast = useToast()

useHead({ title: () => t('library.title') })

interface Usage { widgetId: string, type: string, name: string, mode?: string, fields: { key: string, label: string, section: string }[] }
interface LibraryFile { id: string, name: string, size: number, mime: string, url: string, usages: Usage[] }
interface ImageFile extends LibraryFile { width: number, height: number, animated: boolean }
interface Library { sounds: LibraryFile[], images: ImageFile[] }

const { data: me } = await useMe()
const { data: library, refresh } = await useFetch<Library>('/api/library', { default: () => ({ sounds: [], images: [] }) })

const canUpload = computed(() => (me.value?.accounts.length ?? 0) > 0)
const tab = ref<'images' | 'sounds'>('images')
const busy = ref<string>()
const picker = useTemplateRef<HTMLInputElement>('picker')
let pending: { kind: 'images' | 'sounds', id?: string } | undefined

const ACCEPT = { images: 'image/png,image/webp,image/gif,video/mp4,video/webm', sounds: 'audio/*' }

function pick(kind: 'images' | 'sounds', id?: string) {
  pending = { kind, id }
  if (!picker.value) return
  picker.value.accept = ACCEPT[kind]
  picker.value.value = ''
  picker.value.click()
}

async function onPicked(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (!file || !pending) return
  const { kind, id } = pending
  const body = new FormData()
  body.append('file', file)
  busy.value = id ?? `new-${kind}`
  try {
    await $fetch(id ? `/api/${kind}/${id}` : `/api/${kind}`, { method: id ? 'PUT' : 'POST', body })
    await refresh()
    clearNuxtData(kind)
    toast.add({ title: t(id ? 'library.replaced' : 'library.uploaded'), color: 'success', icon: 'i-lucide-check' })
  }
  catch (err: any) {
    const prefix = kind === 'images' ? 'image' : 'sound'
    toast.add({ title: t(`${prefix}.errors.${err?.data?.message ?? 'generic'}`), color: 'error' })
  }
  finally {
    busy.value = undefined
  }
}

async function remove(kind: 'images' | 'sounds', file: LibraryFile) {
  const message = file.usages.length ? t('library.confirmDeleteUsed', { count: file.usages.length }) : t('library.confirmDelete')
  if (!confirm(message)) return
  busy.value = file.id
  await $fetch(`/api/${kind}/${file.id}`, { method: 'DELETE' })
  await refresh()
  clearNuxtData(kind)
  busy.value = undefined
}

function usageTitle(usage: Usage) {
  return widgetTitle({ type: usage.type, name: usage.name, settings: { mode: usage.mode } }, t)
}

function fieldLabel(field: Usage['fields'][number]) {
  const label = t(`fields.${field.label}`)
  return ['general', 'style', 'animation', 'advanced', 'triggers'].includes(field.section) ? label : `${t(`sections.${field.section}`)}: ${label}`
}

function formatSize(bytes: number) {
  return bytes >= 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`
}

let audio: HTMLAudioElement | undefined
function play(url: string) {
  audio?.pause()
  audio = new Audio(url)
  audio.play().catch(() => toast.add({ title: t('sound.playError'), color: 'error' }))
}

const tabs = computed(() => [
  { value: 'images' as const, label: t('library.images'), icon: 'i-lucide-image', count: library.value.images.length },
  { value: 'sounds' as const, label: t('library.sounds'), icon: 'i-lucide-music', count: library.value.sounds.length }
])
</script>

<template>
  <UContainer class="py-10 space-y-6">
    <div class="flex flex-wrap items-center justify-between gap-4">
      <div>
        <h1 class="text-2xl font-bold">
          {{ t('library.title') }}
        </h1>
        <p class="text-muted">
          {{ t('library.subtitle') }}
        </p>
      </div>
      <UTooltip :text="canUpload ? '' : t('library.loginToUpload')" :disabled="canUpload">
        <UButton
          icon="i-lucide-upload"
          :label="t(tab === 'images' ? 'library.uploadImage' : 'library.uploadSound')"
          :loading="busy === `new-${tab}`"
          :disabled="!canUpload"
          @click="pick(tab)"
        />
      </UTooltip>
    </div>

    <UAlert v-if="!canUpload" icon="i-lucide-info" color="info" variant="subtle" :title="t('library.loginToUpload')" />

    <div role="tablist" class="flex flex-wrap gap-1">
      <UButton
        v-for="item in tabs"
        :key="item.value"
        role="tab"
        :icon="item.icon"
        :aria-selected="tab === item.value"
        :color="tab === item.value ? 'primary' : 'neutral'"
        :variant="tab === item.value ? 'solid' : 'ghost'"
        @click="tab = item.value"
      >
        {{ item.label }}
        <UBadge :label="String(item.count)" size="sm" :color="tab === item.value ? 'neutral' : 'primary'" variant="subtle" />
      </UButton>
    </div>

    <p v-if="tab === 'images' && !library.images.length" class="rounded-xl border border-dashed border-default py-12 text-center text-sm text-muted">
      {{ t('library.emptyImages') }}
    </p>
    <p v-if="tab === 'sounds' && !library.sounds.length" class="rounded-xl border border-dashed border-default py-12 text-center text-sm text-muted">
      {{ t('library.emptySounds') }}
    </p>

    <div v-if="tab === 'images'" class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <UCard v-for="image in library.images" :key="image.id" :ui="{ root: 'overflow-hidden', header: 'p-0 sm:p-0', body: 'space-y-3' }">
        <template #header>
          <div class="checker flex h-44 items-center justify-center">
            <video v-if="image.mime.startsWith('video/')" :src="image.url" class="max-h-full max-w-full" controls muted playsinline />
            <img v-else :src="`${image.url}?v=${image.size}`" :alt="image.name" class="max-h-full max-w-full object-contain">
          </div>
        </template>
        <div class="flex items-start justify-between gap-2">
          <div class="min-w-0">
            <div class="truncate font-medium">
              {{ image.name }}
            </div>
            <div class="text-xs text-muted">
              <template v-if="image.width">{{ image.width }}×{{ image.height }} · </template>{{ formatSize(image.size) }}
            </div>
          </div>
          <UBadge v-if="image.animated" :label="t('library.animated')" size="sm" variant="subtle" />
        </div>
        <LibraryUsages :usages="image.usages" :title="usageTitle" :field="fieldLabel" />
        <div class="flex gap-2">
          <UButton class="flex-1 justify-center" icon="i-lucide-replace" color="neutral" variant="outline" :label="t('library.replace')" :loading="busy === image.id" @click="pick('images', image.id)" />
          <UButton icon="i-lucide-trash" color="error" variant="ghost" :aria-label="t('common.delete')" @click="remove('images', image)" />
        </div>
      </UCard>
    </div>

    <div v-else class="space-y-3">
      <UCard v-for="sound in library.sounds" :key="sound.id" :ui="{ body: 'flex flex-col gap-3 sm:flex-row sm:items-start' }">
        <UButton icon="i-lucide-play" color="primary" variant="soft" :aria-label="t('sound.play')" @click="play(sound.url)" />
        <div class="min-w-0 flex-1 space-y-2">
          <div>
            <div class="truncate font-medium">
              {{ sound.name }}
            </div>
            <div class="text-xs text-muted">
              {{ formatSize(sound.size) }}
            </div>
          </div>
          <LibraryUsages :usages="sound.usages" :title="usageTitle" :field="fieldLabel" />
        </div>
        <div class="flex gap-2">
          <UButton icon="i-lucide-replace" color="neutral" variant="outline" :label="t('library.replace')" :loading="busy === sound.id" @click="pick('sounds', sound.id)" />
          <UButton icon="i-lucide-trash" color="error" variant="ghost" :aria-label="t('common.delete')" @click="remove('sounds', sound)" />
        </div>
      </UCard>
    </div>

    <input ref="picker" type="file" class="hidden" @change="onPicked">
  </UContainer>
</template>

<style scoped>
.checker {
  background: repeating-conic-gradient(#27272a 0 25%, #3f3f46 0 50%) 0 0 / 16px 16px;
}
</style>
