<script setup lang="ts">
const model = defineModel<string>({ default: '' })
const { t } = useI18n()
const toast = useToast()

interface ImageRow { id: string, name: string, url: string, animated: boolean }

const { data: me } = useMe()
const { data: images, refresh } = useFetch<ImageRow[]>('/api/images', { key: 'images', default: () => [] })

const canUpload = computed(() => (me.value?.accounts.length ?? 0) > 0)
const uploading = ref(false)
const fileInput = useTemplateRef<HTMLInputElement>('file')

async function upload(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (!file) return
  const body = new FormData()
  body.append('file', file)
  uploading.value = true
  try {
    const image = await $fetch<ImageRow>('/api/images', { method: 'POST', body })
    await refresh()
    model.value = image.url
  }
  catch (err: any) {
    toast.add({ title: t(`image.errors.${err?.data?.message ?? 'generic'}`), color: 'error' })
  }
  finally {
    uploading.value = false
    if (fileInput.value) fileInput.value.value = ''
  }
}
</script>

<template>
  <div class="space-y-2">
    <div class="grid grid-cols-4 gap-2">
      <button
        type="button"
        class="flex aspect-square items-center justify-center rounded-md border text-muted transition-colors hover:border-primary"
        :class="model ? 'border-default' : 'border-primary bg-primary/10 text-primary'"
        :title="t('image.none')"
        @click="model = ''"
      >
        <UIcon name="i-lucide-ban" class="size-5" />
      </button>
      <button
        v-for="image in images"
        :key="image.id"
        type="button"
        class="checker relative aspect-square overflow-hidden rounded-md border-2 transition-colors hover:border-primary"
        :class="model === image.url ? 'border-primary' : 'border-transparent'"
        :title="image.name"
        @click="model = image.url"
      >
        <img :src="image.url" :alt="image.name" class="size-full object-contain" loading="lazy">
        <UBadge v-if="image.animated" label="GIF" size="sm" color="neutral" class="absolute bottom-1 right-1" />
      </button>
      <UTooltip :text="canUpload ? t('image.upload') : t('image.loginToUpload')">
        <button
          type="button"
          class="flex aspect-square w-full items-center justify-center rounded-md border border-dashed border-default text-muted transition-colors hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-50"
          :disabled="!canUpload || uploading"
          @click="fileInput?.click()"
        >
          <UIcon :name="uploading ? 'i-lucide-loader-circle' : 'i-lucide-image-plus'" class="size-5" :class="{ 'animate-spin': uploading }" />
        </button>
      </UTooltip>
    </div>
    <input ref="file" type="file" accept="image/png,image/webp,image/gif" class="hidden" @change="upload">
    <p class="text-xs text-muted">
      {{ t('image.hint') }}
      <NuxtLink to="/dashboard/library" class="text-primary hover:underline">{{ t('library.manage') }}</NuxtLink>
    </p>
  </div>
</template>

<style scoped>
.checker {
  background: repeating-conic-gradient(#27272a 0 25%, #3f3f46 0 50%) 0 0 / 12px 12px;
}
</style>
