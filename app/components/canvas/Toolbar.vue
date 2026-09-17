<script setup lang="ts">
import { CANVAS_SHAPES } from '#shared/canvas'
import { FONTS } from '#shared/widgets'
import { CANVAS_TOOL_ICONS, type CanvasToolName, type CanvasToolState } from '~/utils/canvas'

defineProps<{
  tool: CanvasToolState
  canUndo: boolean
  canRedo: boolean
  uploading: boolean
  hasSelection: boolean
}>()

const emit = defineEmits<{ undo: [], redo: [], clear: [], upload: [], remove: [] }>()

const { t } = useI18n()

const tools: CanvasToolName[] = ['move', ...CANVAS_SHAPES, 'text', 'fill', 'eraser']
const showText = defineModel<boolean>('text', { default: false })
const fonts: string[] = [...FONTS]
const sizes = [24, 32, 48, 64, 96, 128, 200]
</script>

<template>
  <div class="pointer-events-auto flex flex-wrap items-center justify-center gap-1 rounded-2xl border border-default bg-default/95 p-2 shadow-lg backdrop-blur">
    <UTooltip v-for="name in tools" :key="name" :text="t(`canvas.tools.${name}`)">
      <UButton
        :icon="CANVAS_TOOL_ICONS[name]"
        :color="tool.name === name ? 'primary' : 'neutral'"
        :variant="tool.name === name ? 'solid' : 'ghost'"
        :aria-label="t(`canvas.tools.${name}`)"
        @click="tool.name = name"
      />
    </UTooltip>

    <USeparator orientation="vertical" class="h-8" />

    <UTooltip :text="t('canvas.stroke')">
      <input v-model="tool.stroke" type="color" class="swatch" :aria-label="t('canvas.stroke')">
    </UTooltip>
    <UTooltip :text="t('canvas.fill')">
      <input v-model="tool.fillColor" type="color" class="swatch" :aria-label="t('canvas.fill')">
    </UTooltip>
    <UTooltip :text="t('canvas.noFill')">
      <UButton
        icon="i-lucide-droplet-off"
        :color="tool.fillOn ? 'neutral' : 'primary'"
        :variant="tool.fillOn ? 'ghost' : 'solid'"
        :aria-label="t('canvas.noFill')"
        @click="tool.fillOn = !tool.fillOn"
      />
    </UTooltip>
    <UTooltip :text="t('canvas.width')">
      <input v-model.number="tool.width" type="range" min="1" max="120" class="w-24" :aria-label="t('canvas.width')">
    </UTooltip>

    <USeparator orientation="vertical" class="h-8" />

    <UTooltip :text="t('canvas.textStyle')">
      <UButton
        icon="i-lucide-case-sensitive"
        :color="showText ? 'primary' : 'neutral'"
        :variant="showText ? 'solid' : 'ghost'"
        :aria-label="t('canvas.textStyle')"
        @click="showText = !showText"
      />
    </UTooltip>

    <UTooltip :text="t('canvas.upload')">
      <UButton icon="i-lucide-image-plus" color="neutral" variant="ghost" :loading="uploading" :aria-label="t('canvas.upload')" @click="emit('upload')" />
    </UTooltip>

    <USeparator orientation="vertical" class="h-8" />

    <UTooltip :text="t('canvas.undo')">
      <UButton icon="i-lucide-undo-2" color="neutral" variant="ghost" :disabled="!canUndo" :aria-label="t('canvas.undo')" @click="emit('undo')" />
    </UTooltip>
    <UTooltip :text="t('canvas.redo')">
      <UButton icon="i-lucide-redo-2" color="neutral" variant="ghost" :disabled="!canRedo" :aria-label="t('canvas.redo')" @click="emit('redo')" />
    </UTooltip>
    <UTooltip :text="t('canvas.remove')">
      <UButton icon="i-lucide-scissors" color="neutral" variant="ghost" :disabled="!hasSelection" :aria-label="t('canvas.remove')" @click="emit('remove')" />
    </UTooltip>
    <UTooltip :text="t('canvas.clear')">
      <UButton icon="i-lucide-trash-2" color="error" variant="ghost" :aria-label="t('canvas.clear')" @click="emit('clear')" />
    </UTooltip>

    <div v-if="showText" class="flex w-full flex-wrap items-center justify-center gap-1 border-t border-default pt-2">
      <USelect v-model="tool.font" :items="fonts" class="w-40" size="sm" />
      <USelect v-model.number="tool.size" :items="sizes.map(size => ({ label: `${size}px`, value: size }))" class="w-24" size="sm" />
      <UTooltip :text="t('canvas.bold')">
        <UButton icon="i-lucide-bold" size="sm" :color="tool.bold ? 'primary' : 'neutral'" :variant="tool.bold ? 'solid' : 'ghost'" :aria-label="t('canvas.bold')" @click="tool.bold = !tool.bold" />
      </UTooltip>
      <UTooltip :text="t('canvas.italic')">
        <UButton icon="i-lucide-italic" size="sm" :color="tool.italic ? 'primary' : 'neutral'" :variant="tool.italic ? 'solid' : 'ghost'" :aria-label="t('canvas.italic')" @click="tool.italic = !tool.italic" />
      </UTooltip>
      <UTooltip :text="t('canvas.underline')">
        <UButton icon="i-lucide-underline" size="sm" :color="tool.underline ? 'primary' : 'neutral'" :variant="tool.underline ? 'solid' : 'ghost'" :aria-label="t('canvas.underline')" @click="tool.underline = !tool.underline" />
      </UTooltip>
      <UTooltip :text="t('canvas.strike')">
        <UButton icon="i-lucide-strikethrough" size="sm" :color="tool.strike ? 'primary' : 'neutral'" :variant="tool.strike ? 'solid' : 'ghost'" :aria-label="t('canvas.strike')" @click="tool.strike = !tool.strike" />
      </UTooltip>
    </div>
  </div>
</template>

<style scoped>
.swatch {
  width: 32px;
  height: 32px;
  padding: 0;
  border: 1px solid var(--ui-border);
  border-radius: 8px;
  background: none;
  cursor: pointer;
}

.swatch::-webkit-color-swatch-wrapper {
  padding: 2px;
}

.swatch::-webkit-color-swatch {
  border: none;
  border-radius: 6px;
}
</style>
