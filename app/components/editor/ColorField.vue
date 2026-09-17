<script setup lang="ts">
const model = defineModel<string>({ default: '' })

const isHex = computed(() => /^#[\da-f]{6}$/i.test(model.value))
</script>

<template>
  <div class="flex gap-2">
    <UPopover>
      <UButton color="neutral" variant="outline" class="p-1.5">
        <span class="block size-5 rounded border border-default" :style="{ background: model }" />
      </UButton>
      <template #content>
        <UColorPicker :model-value="isHex ? model : '#ffffff'" class="p-2" @update:model-value="model = $event ?? model" />
      </template>
    </UPopover>
    <UInput v-model="model" class="flex-1 font-mono" />
  </div>
</template>
