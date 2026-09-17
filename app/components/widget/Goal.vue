<script setup lang="ts">
import type { Settings } from '#shared/types'
import { widgetTexts } from '#shared/widgets'

const props = defineProps<{ settings: Settings, bus: EventBus }>()

const progress = useWidgetState('goal', () => 0)
const texts = computed(() => widgetTexts(props.settings.language).goal)
const value = computed(() => props.settings.startValue + progress.value)
const percent = computed(() => Math.min(100, (value.value / props.settings.target) * 100))
const reached = computed(() => value.value >= props.settings.target)

useBusEvents(props.bus, (event) => {
  if (event.kind === 'command') {
    if (event.name === 'increment') progress.value++
    else if (event.name === 'decrement') progress.value = Math.max(-props.settings.startValue, progress.value - 1)
    else if (event.name === 'reset') progress.value = 0
    return
  }
  if (event.kind !== 'alert') return
  const metric = props.settings.goalMetric
  if (metric === 'follows' && event.type === 'follow') progress.value++
  else if (metric === 'subs' && event.type === 'sub') progress.value++
  else if (metric === 'subs' && event.type === 'gifts') progress.value += event.count ?? 1
  else if (metric === 'gifts' && event.type === 'gifts') progress.value += event.count ?? 1
  else if (metric === 'bits' && event.type === 'bits') progress.value += event.count ?? 0
})
</script>

<template>
  <div class="goal" :class="{ 'goal-reached': reached, 'goal-celebrate': reached && settings.celebrate }">
    <div class="goal-head">
      <span class="goal-title">{{ settings.goalTitle || (reached ? texts.reached : texts[settings.goalMetric as 'subs']) }}</span>
      <span v-if="settings.showNumbers" class="goal-numbers">{{ value }} / {{ settings.target }}</span>
    </div>
    <div class="goal-bar">
      <div class="goal-fill" :style="{ width: `${percent}%` }" />
    </div>
  </div>
</template>

<style>
@layer widget {
  .goal {
    display: flex;
    flex-direction: column;
    justify-content: center;
    gap: 0.4em;
    min-height: calc(100% - 24px);
    margin: 12px;
    padding: 0.6em 1em;
    border-radius: 16px;
    background: var(--bg);
    font-size: var(--font-size);
    color: var(--text);
  }

  .goal-head {
    display: flex;
    justify-content: space-between;
    gap: 1em;
    font-weight: 700;
  }

  .goal-numbers {
    font-variant-numeric: tabular-nums;
  }

  .goal-bar {
    height: var(--bar-height);
    overflow: hidden;
    border-radius: var(--radius);
    background: var(--bar-bg);
  }

  .goal-fill {
    height: 100%;
    border-radius: inherit;
    background: linear-gradient(90deg, var(--bar), var(--bar-2));
    transition: width 0.8s cubic-bezier(0.16, 1, 0.3, 1);
  }

  .goal-celebrate .goal-fill {
    background-size: 200% 100%;
    animation: goal-shimmer 1.6s linear infinite;
  }

  .goal-celebrate {
    animation: goal-pulse 1.6s ease-in-out infinite;
  }

  @keyframes goal-shimmer {
    to { background-position: -200% 0; }
  }

  @keyframes goal-pulse {
    50% { box-shadow: 0 0 1.5em color-mix(in srgb, var(--bar) 60%, transparent); }
  }
}
</style>
