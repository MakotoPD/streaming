<script setup lang="ts">
const props = defineProps<{ selector?: string }>()
const emit = defineEmits<{ count: [value: number] }>()

interface Box { x: number, y: number, width: number, height: number }

const boxes = ref<Box[]>([])
const stroke = computed(() => Math.max(2, Math.round(innerWidth / 400)))
let frame = 0
let lastCount = -1

function measure() {
  frame = requestAnimationFrame(measure)
  let elements: Element[] = []
  try {
    elements = props.selector ? [...document.querySelectorAll(props.selector)].filter(el => el.closest('.widget-root')) : []
  }
  catch {
    elements = []
  }
  const pad = stroke.value * 2
  boxes.value = elements
    .map(el => el.getBoundingClientRect())
    .filter(r => r.width && r.height)
    .map(r => ({ x: r.left - pad, y: r.top - pad, width: r.width + pad * 2, height: r.height + pad * 2 }))
  if (boxes.value.length !== lastCount) {
    lastCount = boxes.value.length
    emit('count', lastCount)
  }
}

watch(() => props.selector, (selector) => {
  cancelAnimationFrame(frame)
  lastCount = -1
  boxes.value = []
  if (selector) measure()
}, { immediate: true })

onBeforeUnmount(() => cancelAnimationFrame(frame))
</script>

<template>
  <svg v-if="selector" class="highlight-layer" aria-hidden="true">
    <defs>
      <mask id="highlight-mask">
        <rect width="100%" height="100%" fill="white" />
        <rect v-for="(box, i) in boxes" :key="i" v-bind="box" rx="6" fill="black" />
      </mask>
    </defs>
    <rect width="100%" height="100%" fill="rgb(0 0 0 / 0.65)" mask="url(#highlight-mask)" />
    <rect v-for="(box, i) in boxes" :key="`o${i}`" v-bind="box" rx="6" fill="none" stroke="#a78bfa" :stroke-width="stroke" />
  </svg>
</template>

<style scoped>
.highlight-layer {
  position: fixed;
  inset: 0;
  z-index: 2147483647;
  width: 100vw;
  height: 100vh;
  pointer-events: none;
}
</style>
