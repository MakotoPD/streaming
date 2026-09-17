<script setup lang="ts">
import type { Settings } from '#shared/types'
import { widgetTexts } from '#shared/widgets'

const props = defineProps<{ settings: Settings, bus?: EventBus }>()

const track = useTemplateRef<HTMLDivElement>('track')
const width = ref(0)

const lines = computed(() => {
  const list = props.settings.lines as string[]
  return list.length ? list : [widgetTexts(props.settings.language).marquee.welcome]
})

let observer: ResizeObserver | undefined
onMounted(() => {
  observer = new ResizeObserver(([entry]) => {
    width.value = entry!.contentRect.width / 2
  })
  observer.observe(track.value!)
})
onBeforeUnmount(() => observer?.disconnect())

const duration = computed(() => `${Math.max(1, width.value / props.settings.speed)}s`)
</script>

<template>
  <div class="marquee">
    <div
      ref="track"
      class="marquee-track"
      :class="`marquee-${settings.marqueeDirection}`"
      :style="{ '--marquee-duration': duration }"
    >
      <template v-for="copy in 2" :key="copy">
        <template v-for="(line, i) in lines" :key="`${copy}-${i}`">
          <span class="marquee-item">{{ line }}</span>
          <span class="marquee-separator">{{ settings.separator }}</span>
        </template>
      </template>
    </div>
  </div>
</template>

<style>
@layer widget {
  .marquee {
    display: flex;
    align-items: center;
    height: 100%;
    overflow: hidden;
    background: var(--bg);
    font-size: var(--font-size);
    color: var(--text);
  }

  .marquee-track {
    display: flex;
    flex-shrink: 0;
    align-items: center;
    gap: var(--gap);
    padding-right: var(--gap);
    white-space: nowrap;
    animation: marquee-left var(--marquee-duration) linear infinite;
    will-change: transform;
  }

  .marquee-right {
    animation-name: marquee-right;
  }

  .marquee-item {
    font-weight: 600;
  }

  .marquee-separator {
    color: var(--separator);
  }

  @keyframes marquee-left {
    from { transform: translate3d(0, 0, 0); }
    to { transform: translate3d(-50%, 0, 0); }
  }

  @keyframes marquee-right {
    from { transform: translate3d(-50%, 0, 0); }
    to { transform: translate3d(0, 0, 0); }
  }
}
</style>
