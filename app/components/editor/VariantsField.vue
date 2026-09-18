<script setup lang="ts">
import type { AlertVariant, Field } from '#shared/widgets'

const props = defineProps<{ field: Field & { type: 'variants' } }>()
const model = defineModel<AlertVariant[]>({ default: () => [] })
const { t } = useI18n()

const kind = computed(() => props.field.key.split('.')[0]!)
const tierItems = computed(() => [0, 1, 2, 3].map(value => ({ value, label: t(`variants.tier.${value}`) })))
const sorted = computed(() => [...model.value].sort((a, b) => a.min - b.min || a.tier - b.tier))

function add() {
  const last = sorted.value.at(-1)
  model.value = [...model.value, {
    id: Math.random().toString(36).slice(2, 10),
    name: '',
    min: last ? last.min * 2 || 10 : 10,
    tier: 0,
    text: '',
    image: '',
    sound: '',
    color: ''
  }]
}

function update(id: string, patch: Partial<AlertVariant>) {
  model.value = model.value.map(variant => (variant.id === id ? { ...variant, ...patch } : variant))
}

function remove(id: string) {
  model.value = model.value.filter(variant => variant.id !== id)
}
</script>

<template>
  <div class="space-y-3">
    <p v-if="!model.length" class="text-sm text-muted">
      {{ t('variants.empty') }}
    </p>

    <div v-for="variant in sorted" :key="variant.id" class="space-y-3 rounded-lg border border-default p-3">
      <div class="flex flex-wrap items-end gap-2">
        <UFormField :label="t(`variants.min.${kind}`)" class="w-32">
          <UInputNumber :model-value="variant.min" :min="0" :step="field.step ?? 1" @update:model-value="update(variant.id, { min: Number($event) || 0 })" />
        </UFormField>
        <UFormField v-if="field.tiers" :label="t('variants.tierLabel')" class="w-32">
          <USelect :model-value="variant.tier" :items="tierItems" @update:model-value="update(variant.id, { tier: Number($event) })" />
        </UFormField>
        <UFormField :label="t('variants.name')" class="min-w-32 flex-1">
          <UInput :model-value="variant.name" maxlength="40" :placeholder="t('variants.namePlaceholder')" @update:model-value="update(variant.id, { name: String($event) })" />
        </UFormField>
        <UButton icon="i-lucide-trash" color="error" variant="ghost" :aria-label="t('common.delete')" @click="remove(variant.id)" />
      </div>
      <UFormField :label="t('fields.text')">
        <UInput :model-value="variant.text" maxlength="200" class="w-full" :placeholder="t('variants.textPlaceholder')" @update:model-value="update(variant.id, { text: String($event) })" />
      </UFormField>
      <UFormField :label="t('fields.alertImage')">
        <EditorImageField :model-value="variant.image" @update:model-value="update(variant.id, { image: $event })" />
      </UFormField>
      <UFormField :label="t('fields.sound')">
        <EditorSoundField :model-value="variant.sound" @update:model-value="update(variant.id, { sound: $event })" />
      </UFormField>
      <UFormField :label="t('fields.color')">
        <div class="flex items-center gap-2">
          <EditorColorField :model-value="variant.color || '#8b5cf6'" class="flex-1" @update:model-value="update(variant.id, { color: $event })" />
          <UButton v-if="variant.color" size="xs" color="neutral" variant="ghost" icon="i-lucide-x" :label="t('variants.inherit')" @click="update(variant.id, { color: '' })" />
        </div>
      </UFormField>
    </div>

    <UButton icon="i-lucide-plus" color="neutral" variant="outline" size="sm" :label="t('variants.add')" :disabled="model.length >= 12" @click="add" />
  </div>
</template>
