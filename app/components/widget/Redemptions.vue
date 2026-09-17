<script setup lang="ts">
import type { RedemptionEvent, Settings } from '#shared/types'
import { widgetTexts } from '#shared/widgets'

const props = defineProps<{ settings: Settings, bus: EventBus }>()

const texts = computed(() => widgetTexts(props.settings.language).redemptions)
const { current, push, next } = useDisplayQueue<RedemptionEvent>(
  () => props.settings.holdTime * 1000 + props.settings.animDuration,
  () => playSound(props.settings.sound, props.settings.volume)
)

function allowed(title: string) {
  const list = (props.settings.rewards as string[]).map(reward => reward.toLowerCase())
  const listed = list.includes(title.toLowerCase())
  if (props.settings.rewardFilter === 'only') return listed
  if (props.settings.rewardFilter === 'except') return !listed
  return true
}

useBusEvents(props.bus, (event) => {
  if (event.kind === 'redemption' && allowed(event.reward.title)) push(event)
})
</script>

<template>
  <div class="redemptions">
    <Transition :enter-active-class="`anim-in-${settings.animIn}`" :leave-active-class="`anim-out-${settings.animOut}`" @after-leave="next">
      <div v-if="current" :key="current.id" class="redemption-card">
        <div v-if="settings.showIcon" class="redemption-icon">
          <UIcon name="i-lucide-sparkles" />
        </div>
        <div class="redemption-body">
          <div class="redemption-head">
            <span class="redemption-name">{{ current.name }}</span>
            <span>{{ fillTemplate(texts.redeemed, { reward: '' }, settings.language) }}</span>
            <span class="redemption-reward">{{ current.reward.title }}</span>
            <span v-if="settings.showCost" class="redemption-cost">{{ fillTemplate(texts.points, { count: current.reward.cost }, settings.language) }}</span>
          </div>
          <div v-if="settings.showInput && current.input" class="redemption-input">
            {{ current.input }}
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style>
@layer widget {
  .redemptions {
    display: flex;
    align-items: center;
    height: 100%;
    padding: 12px;
  }

  .redemption-card {
    display: flex;
    align-items: center;
    gap: 0.8em;
    width: 100%;
    padding: 0.8em 1.1em;
    border: 2px solid var(--accent);
    border-radius: var(--radius);
    background: var(--bg);
    font-size: var(--font-size);
    color: var(--text);
  }

  .redemption-icon {
    display: grid;
    flex-shrink: 0;
    place-items: center;
    width: 2.2em;
    height: 2.2em;
    border-radius: 50%;
    background: var(--accent);
    color: #fff;
  }

  .redemption-head {
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    gap: 0.3em;
  }

  .redemption-name {
    font-weight: 900;
  }

  .redemption-reward {
    font-weight: 800;
    color: var(--accent);
  }

  .redemption-cost {
    padding: 0.05em 0.5em;
    border-radius: 999px;
    background: color-mix(in srgb, var(--accent) 25%, transparent);
    font-size: 0.7em;
    font-weight: 700;
  }

  .redemption-input {
    margin-top: 0.25em;
    font-size: 0.85em;
    opacity: 0.9;
  }
}
</style>
