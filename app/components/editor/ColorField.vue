<script setup lang="ts">
const model = defineModel<string>({ default: '' })
</script>

<template>
  <div class="flex gap-2">
    <EditorColorPopover v-model="model" mode="click">
      <UButton color="neutral" variant="outline" class="p-1.5">
        <span class="block size-5 rounded border border-default checker" :style="{ '--swatch': model }" />
      </UButton>
    </EditorColorPopover>
    <UInput v-model="model" class="flex-1 font-mono" />
  </div>
</template>

<style scoped>
.checker {
  background:
    linear-gradient(var(--swatch), var(--swatch)),
    repeating-conic-gradient(#9ca3af 0 25%, #f3f4f6 0 50%) 0 0 / 8px 8px;
}
</style>
