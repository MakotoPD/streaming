<script setup lang="ts">
import { applyOps, emptyScene, sanitizeOps, type CanvasScene } from '#shared/canvas'
import type { Settings } from '#shared/types'

const props = defineProps<{ settings: Settings, bus: EventBus }>()

const context = useWidgetContext()
const scene = ref<CanvasScene>(emptyScene())

async function load() {
  if (!context) return
  scene.value = await $fetch<CanvasScene>(`/api/o/${context.token}/canvas`).catch(() => emptyScene())
}

onMounted(load)

useBusEvents(props.bus, (event) => {
  if (event.kind !== 'command' || event.name !== 'canvas') return
  scene.value = applyOps(scene.value, sanitizeOps(event.payload?.ops))
})
</script>

<template>
  <CanvasStage :scene="scene" />
</template>
