<script setup lang="ts">
const props = withDefaults(defineProps<{ modelValue: string, mode?: 'hover' | 'click' }>(), { mode: 'hover' })
const emit = defineEmits<{ 'update:modelValue': [value: string] }>()

const parsed = computed(() => parseColor(props.modelValue))
const hex = computed(() => (parsed.value ? toHex(parsed.value) : '#ffffff'))
const alpha = computed(() => Math.round((parsed.value?.a ?? 1) * 100) / 100)
const format = computed(() => parsed.value?.format ?? 'hex')

function update(color: { r: number, g: number, b: number, a: number }) {
  emit('update:modelValue', formatColor(color, format.value, parsed.value?.hasAlpha && format.value !== 'hex'))
}

function setHex(value: string | undefined) {
  const next = value && parseColor(value)
  if (next) update({ ...next, a: parsed.value?.a ?? 1 })
}

function setAlpha(value: number | number[] | undefined) {
  const a = Array.isArray(value) ? value[0] : value
  if (a !== undefined) update({ ...(parsed.value ?? { r: 255, g: 255, b: 255 }), a })
}

function setFormat(next: 'hex' | 'rgb' | 'hsl') {
  if (parsed.value) emit('update:modelValue', formatColor(parsed.value, next))
}
</script>

<template>
  <UPopover :mode="mode" :open-delay="150" :close-delay="250" :content="{ side: 'top', sideOffset: 6 }">
    <slot />
    <template #content>
      <div class="p-3 space-y-3 w-60">
        <UColorPicker :model-value="hex" class="mx-auto" @update:model-value="setHex" />
        <div class="flex items-center gap-2">
          <span class="text-xs text-muted w-4">α</span>
          <USlider :model-value="alpha" :min="0" :max="1" :step="0.01" class="flex-1" @update:model-value="setAlpha" />
          <span class="text-xs tabular-nums w-8 text-right">{{ alpha }}</span>
        </div>
        <div class="flex gap-1">
          <UButton
            v-for="option in (['hex', 'rgb', 'hsl'] as const)"
            :key="option"
            size="xs"
            :color="format === option ? 'primary' : 'neutral'"
            :variant="format === option ? 'soft' : 'ghost'"
            :label="option.toUpperCase()"
            class="flex-1 justify-center"
            :disabled="!parsed"
            @click="setFormat(option)"
          />
        </div>
        <UInput :model-value="modelValue" size="xs" class="w-full font-mono" @update:model-value="emit('update:modelValue', String($event))" />
      </div>
    </template>
  </UPopover>
</template>
