<script setup lang="ts">
const model = defineModel<string>({ default: '' })
const { t } = useI18n()
const toast = useToast()

const { data: me } = useMe()
const { data: mine, refresh } = useFetch<{ id: string, name: string, url: string }[]>('/api/sounds', { key: 'sounds', default: () => [] })
const { data: builtin } = useFetch<{ name: string, url: string }[]>('/api/sounds/builtin', { key: 'builtin-sounds', default: () => [] })

const canUpload = computed(() => (me.value?.accounts.length ?? 0) > 0)
const mode = ref<'library' | 'url'>(model.value.startsWith('http') ? 'url' : 'library')
const urlDraft = ref(mode.value === 'url' ? model.value : '')
const uploading = ref(false)
const fileInput = useTemplateRef<HTMLInputElement>('file')

const items = computed(() => [
  { value: 'none', label: t('sound.none') },
  { type: 'label' as const, label: t('sound.builtin') },
  ...builtin.value.map(s => ({ value: s.url, label: s.name })),
  ...(mine.value.length ? [{ type: 'label' as const, label: t('sound.mine') }] : []),
  ...mine.value.map(s => ({ value: s.url, label: s.name }))
])

const selected = computed({
  get: () => (model.value && !model.value.startsWith('http') ? model.value : 'none'),
  set: (value: string) => {
    model.value = value === 'none' ? '' : value
  }
})

watch(mode, (value) => {
  if (value === 'library' && model.value.startsWith('http')) model.value = ''
})

function applyUrl() {
  if (/^https?:\/\/\S+$/.test(urlDraft.value)) model.value = urlDraft.value
  else toast.add({ title: t('sound.invalidUrl'), color: 'error' })
}

let audio: HTMLAudioElement | undefined
function play() {
  audio?.pause()
  if (!model.value) return
  audio = new Audio(model.value)
  audio.play().catch(() => toast.add({ title: t('sound.playError'), color: 'error' }))
}

async function upload(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (!file) return
  const body = new FormData()
  body.append('file', file)
  uploading.value = true
  try {
    const sound = await $fetch<{ url: string }>('/api/sounds', { method: 'POST', body })
    await refresh()
    model.value = sound.url
  }
  catch (err: any) {
    toast.add({ title: t(`sound.errors.${err?.data?.message ?? 'generic'}`), color: 'error' })
  }
  finally {
    uploading.value = false
    if (fileInput.value) fileInput.value.value = ''
  }
}
</script>

<template>
  <div class="space-y-2">
    <UTabs
      v-model="mode"
      :items="[{ value: 'library', label: t('sound.library') }, { value: 'url', label: t('sound.link') }]"
      :content="false"
      size="xs"
    />
    <div class="flex gap-2">
      <USelect v-if="mode === 'library'" v-model="selected" :items="items" class="flex-1" />
      <UInput v-else v-model="urlDraft" placeholder="https://…/sound.mp3" class="flex-1" @blur="applyUrl" @keydown.enter="applyUrl" />
      <UButton icon="i-lucide-play" color="neutral" variant="outline" :disabled="!model" :aria-label="t('sound.play')" @click="play" />
      <UTooltip v-if="mode === 'library'" :text="canUpload ? t('sound.upload') : t('sound.loginToUpload')">
        <UButton icon="i-lucide-upload" color="neutral" variant="outline" :loading="uploading" :disabled="!canUpload" @click="fileInput?.click()" />
      </UTooltip>
      <input ref="file" type="file" accept="audio/*" class="hidden" @change="upload">
    </div>
  </div>
</template>
