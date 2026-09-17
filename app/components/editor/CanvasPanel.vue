<script setup lang="ts">
const props = defineProps<{ id: string }>()
const token = defineModel<string | null>('token', { default: null })

const { t } = useI18n()
const toast = useToast()
const origin = useRequestURL().origin

const url = computed(() => (token.value ? `${origin}/c/${token.value}` : ''))

async function copy() {
  if (!url.value) return
  await navigator.clipboard.writeText(url.value)
  toast.add({ title: t('editor.canvas.copied'), color: 'success', icon: 'i-lucide-check' })
}

async function regenerate() {
  if (token.value && !confirm(t('editor.canvas.confirmRegenerate'))) return
  const result = await $fetch<{ editToken: string | null }>(`/api/widgets/${props.id}/edit-token`, { method: 'POST' })
  token.value = result.editToken
}
</script>

<template>
  <UCard :ui="{ body: 'space-y-3' }">
    <div class="font-semibold">
      {{ t('editor.canvas.title') }}
    </div>
    <p class="text-sm text-muted">
      {{ t('editor.canvas.hint') }}
    </p>
    <UFieldGroup v-if="url" class="w-full">
      <UInput :model-value="url" readonly class="flex-1 font-mono" />
      <UButton icon="i-lucide-copy" :label="t('dashboard.copyUrl')" @click="copy" />
      <UTooltip :text="t('editor.canvas.regenerate')">
        <UButton icon="i-lucide-refresh-cw" color="neutral" variant="outline" :aria-label="t('editor.canvas.regenerate')" @click="regenerate" />
      </UTooltip>
    </UFieldGroup>
    <UButton v-else icon="i-lucide-link" :label="t('editor.canvas.create')" @click="regenerate" />
    <UButton v-if="url" :to="url" target="_blank" icon="i-lucide-pencil-ruler" color="primary" variant="soft" :label="t('editor.canvas.open')" />
  </UCard>
</template>
