<script setup lang="ts">
import type { Settings, StreamEvent } from '#shared/types'

const props = defineProps<{ token: string, settings: Settings, size: [number, number], live: boolean }>()

const wrapper = useTemplateRef<HTMLDivElement>('wrapper')
const frame = useTemplateRef<HTMLIFrameElement>('frame')
const scale = ref(0.3)
const ready = ref(false)

function post(message: unknown) {
  if (ready.value) frame.value?.contentWindow?.postMessage(message, location.origin)
}

function sendConfig() {
  post({ kind: 'config', settings: JSON.parse(JSON.stringify(props.settings)) })
}

watch(() => props.settings, sendConfig, { deep: true })
watch(() => props.live, on => post({ kind: 'live', on }))

let observer: ResizeObserver | undefined
let onMessage: (e: MessageEvent) => void = () => {}

onMounted(() => {
  observer = new ResizeObserver(([entry]) => {
    scale.value = Math.min(1, entry!.contentRect.width / props.size[0])
  })
  observer.observe(wrapper.value!)

  onMessage = (e: MessageEvent) => {
    if (e.origin !== location.origin || e.source !== frame.value?.contentWindow || e.data?.kind !== 'ready') return
    ready.value = true
    sendConfig()
    post({ kind: 'live', on: props.live })
  }
  addEventListener('message', onMessage)
})

onBeforeUnmount(() => {
  observer?.disconnect()
  removeEventListener('message', onMessage)
})

defineExpose({
  emit: (event: StreamEvent) => post({ kind: 'event', event })
})
</script>

<template>
  <div ref="wrapper" class="preview-checker rounded-lg overflow-hidden border border-default" :style="{ height: `${size[1] * scale}px` }">
    <iframe
      ref="frame"
      :src="`/o/${token}?preview&live=0`"
      :width="size[0]"
      :height="size[1]"
      allow="autoplay"
      class="origin-top-left border-0 bg-transparent"
      :style="{ transform: `scale(${scale})`, colorScheme: 'light' }"
    />
  </div>
</template>

<style scoped>
.preview-checker {
  background-color: #1a1a1f;
  background-image:
    linear-gradient(45deg, #26262d 25%, transparent 25%),
    linear-gradient(-45deg, #26262d 25%, transparent 25%),
    linear-gradient(45deg, transparent 75%, #26262d 75%),
    linear-gradient(-45deg, transparent 75%, #26262d 75%);
  background-size: 24px 24px;
  background-position: 0 0, 0 12px, 12px -12px, -12px 0;
}
</style>
