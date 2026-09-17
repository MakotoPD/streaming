<script setup lang="ts">
import type { WidgetDefinition } from '#shared/widgets'

const props = defineProps<{ definition: WidgetDefinition }>()
const emit = defineEmits<{ insert: [snippet: string] }>()
const { t } = useI18n()
const toast = useToast()

const variables = computed(() => props.definition.fields
  .filter(field => field.css)
  .map(field => ({ name: field.css!, label: t(`fields.${field.label ?? field.key}`) })))

async function copy(text: string) {
  await navigator.clipboard.writeText(text)
  toast.add({ title: t('editor.css.copied', { text }), color: 'success', icon: 'i-lucide-check' })
}
</script>

<template>
  <div class="space-y-4">
    <p class="text-xs text-muted">
      {{ t('editor.css.intro') }}
    </p>

    <div class="space-y-1">
      <div class="text-sm font-medium">
        {{ t('editor.css.classes') }}
      </div>
      <button
        v-for="item in definition.cssClasses"
        :key="item.id"
        type="button"
        class="w-full text-left rounded-md px-2 py-1.5 hover:bg-elevated transition-colors"
        :title="t('editor.css.insert')"
        @click="emit('insert', `${item.selector} {\n  \n}`)"
      >
        <code class="block text-xs font-mono text-primary">{{ item.selector }}</code>
        <span class="block text-xs text-muted">{{ t(`cssClasses.${item.id}`) }}</span>
      </button>
    </div>

    <div class="space-y-1">
      <div class="text-sm font-medium">
        {{ t('editor.css.variables') }}
      </div>
      <button
        v-for="variable in variables"
        :key="variable.name"
        type="button"
        class="w-full flex items-baseline justify-between gap-3 rounded-md px-2 py-1 hover:bg-elevated transition-colors"
        :title="t('editor.css.copy')"
        @click="copy(`var(${variable.name})`)"
      >
        <code class="text-xs font-mono text-primary">{{ variable.name }}</code>
        <span class="text-xs text-muted text-right">{{ variable.label }}</span>
      </button>
    </div>
  </div>
</template>
