<script setup lang="ts">
import type { HypeTrainEvent, Settings } from '#shared/types'
import { widgetTexts } from '#shared/widgets'

const props = defineProps<{ settings: Settings, bus: EventBus }>()

const train = shallowRef<HypeTrainEvent>()
const now = useNow()
const texts = computed(() => widgetTexts(props.settings.language).hype)
let hideTimer: ReturnType<typeof setTimeout> | undefined

const percent = computed(() => (train.value?.goal ? Math.min(100, (train.value.progress / train.value.goal) * 100) : 0))
const ended = computed(() => train.value?.phase === 'end')

const timer = computed(() => {
  const expires = train.value?.expiresAt ? new Date(train.value.expiresAt).getTime() : 0
  const left = Math.max(0, Math.floor((expires - now.value) / 1000))
  return `${Math.floor(left / 60)}:${String(left % 60).padStart(2, '0')}`
})

function describe(contributor: HypeTrainEvent['contributors'][number]) {
  const t = texts.value
  const lang = props.settings.language
  if (contributor.type === 'bits') return fillTemplate(t.bits, { count: contributor.total }, lang)
  if (contributor.type === 'subscription') return fillTemplate(t.sub, { tier: contributor.total >= 2500 ? 3 : contributor.total >= 1000 ? 2 : 1 }, lang)
  return fillTemplate(t.other, { count: contributor.total }, lang)
}

useBusEvents(props.bus, (event) => {
  if (event.kind !== 'hypetrain') return
  clearTimeout(hideTimer)
  train.value = event
  if (event.phase === 'end') {
    hideTimer = setTimeout(() => {
      train.value = undefined
    }, props.settings.endHold * 1000)
  }
})

onBeforeUnmount(() => clearTimeout(hideTimer))
</script>

<template>
  <div class="hype-area">
    <Transition :enter-active-class="`anim-in-${settings.animIn}`" :leave-active-class="`anim-out-${settings.animOut}`">
      <div v-if="train" class="hype" :class="{ 'hype-golden': train.golden, 'hype-ended': ended }">
        <div class="hype-head">
          <UIcon name="i-lucide-train-front" class="hype-icon" />
          <span class="hype-title">{{ train.golden ? texts.golden : texts.title }}</span>
          <span class="hype-level">{{ fillTemplate(texts.level, { level: train.level }, settings.language) }}</span>
          <span v-if="!ended" class="hype-timer">{{ timer }}</span>
        </div>
        <div v-if="ended" class="hype-ended-text">
          {{ fillTemplate(texts.ended, { level: train.level }, settings.language) }}
        </div>
        <div v-else class="hype-bar">
          <div class="hype-fill" :style="{ width: `${percent}%` }" />
        </div>
        <div v-if="settings.showContributors && train.contributors.length" class="hype-contributors">
          <span v-for="contributor in train.contributors.slice(0, settings.contributorsCount)" :key="contributor.name + contributor.type" class="hype-contributor">
            <b>{{ contributor.name }}</b> {{ describe(contributor) }}
          </span>
        </div>
      </div>
      <div v-else-if="settings.showWhenIdle" class="hype hype-idle">
        {{ texts.idle }}
      </div>
    </Transition>
  </div>
</template>

<style>
@layer widget {
  .hype-area {
    height: 100%;
    padding: 12px;
  }

  .hype {
    display: flex;
    flex-direction: column;
    gap: 0.5em;
    padding: 0.8em 1.1em;
    border-radius: var(--radius);
    background: var(--bg);
    font-size: var(--font-size);
    color: var(--text);
  }

  .hype-head {
    display: flex;
    align-items: center;
    gap: 0.5em;
    font-weight: 800;
  }

  .hype-icon {
    color: var(--bar);
  }

  .hype-level {
    padding: 0.05em 0.6em;
    border-radius: 999px;
    background: color-mix(in srgb, var(--bar) 35%, transparent);
    font-size: 0.8em;
  }

  .hype-timer {
    margin-left: auto;
    font-variant-numeric: tabular-nums;
    opacity: 0.8;
  }

  .hype-bar {
    height: var(--bar-height);
    overflow: hidden;
    border-radius: 999px;
    background: rgb(255 255 255 / 0.1);
  }

  .hype-fill {
    height: 100%;
    border-radius: inherit;
    background: linear-gradient(90deg, var(--bar), var(--bar-2));
    transition: width 0.8s cubic-bezier(0.16, 1, 0.3, 1);
  }

  .hype-golden .hype-fill,
  .hype-golden .hype-icon {
    background: var(--golden);
    color: var(--golden);
  }

  .hype-golden .hype-fill {
    background: linear-gradient(90deg, var(--golden), #fff7cc, var(--golden));
  }

  .hype-ended-text {
    font-weight: 700;
  }

  .hype-contributors {
    display: flex;
    flex-wrap: wrap;
    gap: 0.3em 1em;
    font-size: 0.75em;
    opacity: 0.9;
  }

  .hype-idle {
    font-size: 0.8em;
    opacity: 0.7;
  }
}
</style>
