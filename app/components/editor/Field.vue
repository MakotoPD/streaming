<script setup lang="ts">
import { ANIMATIONS_IN, ANIMATIONS_OUT, FONTS, LANGUAGES, type Field } from '#shared/widgets'

const props = defineProps<{ field: Field, placeholder?: string }>()
const model = defineModel<any>()
const { t, te } = useI18n()

const labelKey = computed(() => props.field.label ?? props.field.key)
const label = computed(() => t(`fields.${labelKey.value}`))
const hint = computed(() => (te(`hints.${labelKey.value}`) ? t(`hints.${labelKey.value}`) : undefined))

const LANGUAGE_NAMES: Record<string, string> = { en: 'English', pl: 'Polski', es: 'Español', de: 'Deutsch', ru: 'Русский' }

const items = computed(() => {
  const field = props.field
  if (field.type === 'select') {
    return field.options.map(value => ({
      value,
      label: field.options === LANGUAGES ? LANGUAGE_NAMES[value]! : t(`options.${labelKey.value}.${value}`)
    }))
  }
  if (field.type === 'animation') {
    return (field.kind === 'in' ? ANIMATIONS_IN : ANIMATIONS_OUT).map(value => ({ value, label: t(`animations.${value}`) }))
  }
  if (field.type === 'font') return FONTS.map(value => ({ value, label: value }))
  return []
})
</script>

<template>
  <UFormField :label="label" :description="hint" :name="field.key">
    <template v-if="field.type === 'text'">
      <UTextarea v-if="field.multiline" v-model="model" :maxlength="field.max" :placeholder="placeholder" autoresize class="w-full" />
      <UInput v-else v-model="model" :maxlength="field.max" :placeholder="placeholder" class="w-full" />
    </template>

    <div v-else-if="field.type === 'number'" class="flex items-center gap-3">
      <USlider v-model="model" :min="field.min" :max="field.max" :step="field.step ?? 1" class="flex-1" />
      <UInputNumber v-model="model" :min="field.min" :max="field.max" :step="field.step ?? 1" class="w-28" />
      <span v-if="field.unit" class="text-sm text-muted w-6">{{ field.unit }}</span>
    </div>

    <USwitch v-else-if="field.type === 'toggle'" v-model="model" />

    <USelect v-else-if="field.type === 'select' || field.type === 'animation' || field.type === 'font'" v-model="model" :items="items" class="w-full" />

    <EditorColorField v-else-if="field.type === 'color'" v-model="model" />

    <EditorSoundField v-else-if="field.type === 'sound'" v-model="model" />

    <UInputTags v-else-if="field.type === 'list'" v-model="model" class="w-full" />

    <div v-else-if="field.type === 'time'" class="flex gap-2">
      <UInput v-model="model" type="time" class="flex-1" />
      <UButton v-if="model" icon="i-lucide-x" color="neutral" variant="ghost" @click="model = ''" />
    </div>

    <UTextarea v-else-if="field.type === 'code'" v-model="model" :rows="10" autoresize class="w-full font-mono text-xs" :placeholder="'.chat-message { }'" />
  </UFormField>
</template>
