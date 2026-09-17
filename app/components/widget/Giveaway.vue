<script setup lang="ts">
import type { Settings } from '#shared/types'
import { widgetTexts } from '#shared/widgets'

const props = defineProps<{ settings: Settings, bus: EventBus }>()

interface Entry { name: string, color?: string }

const state = useWidgetState('giveaway', () => ({ status: 'open' as 'open' | 'closed', entries: {} as Record<string, Entry>, winner: null as Entry | null }))
const texts = computed(() => widgetTexts(props.settings.language).giveaway)
const entries = computed(() => Object.values(state.value.entries))
const rolling = ref<Entry | null>(null)
let rollTimer: ReturnType<typeof setInterval> | undefined

function draw() {
  const pool = entries.value
  if (!pool.length) return
  const winner = pool[Math.floor(Math.random() * pool.length)]!
  state.value.status = 'closed'
  state.value.winner = null
  clearInterval(rollTimer)
  const endsAt = Date.now() + props.settings.rollDuration * 1000
  rollTimer = setInterval(() => {
    if (Date.now() >= endsAt) {
      clearInterval(rollTimer)
      rolling.value = null
      state.value.winner = winner
      playSound(props.settings.sound, props.settings.volume)
      return
    }
    rolling.value = pool[Math.floor(Math.random() * pool.length)]!
  }, 80)
}

onBeforeUnmount(() => clearInterval(rollTimer))

useBusEvents(props.bus, (event) => {
  if (event.kind === 'command') {
    if (event.name === 'open') state.value.status = 'open'
    else if (event.name === 'close') state.value.status = 'closed'
    else if (event.name === 'draw') draw()
    else if (event.name === 'reset') state.value = { status: 'open', entries: {}, winner: null }
    return
  }
  if (event.kind !== 'chat' || state.value.status !== 'open') return
  if (event.text.trim().toLowerCase() !== String(props.settings.keyword).trim().toLowerCase()) return
  if (props.settings.eligibility === 'subscribers' && !hasPermission(event.roles, 'subscribers')) return
  state.value.entries[`${event.platform}:${event.userId || event.name}`] = { name: event.name, color: event.color }
})
</script>

<template>
  <div class="giveaway">
    <div class="giveaway-title">
      <UIcon name="i-lucide-ticket" />
      {{ settings.giveawayTitle || texts.title }}
    </div>

    <Transition mode="out-in" :enter-active-class="`anim-in-${settings.animIn}`" :leave-active-class="`anim-out-${settings.animOut}`">
      <div v-if="rolling" key="roll" class="giveaway-roll">
        {{ rolling.name }}
      </div>
      <div v-else-if="state.winner" key="winner" class="giveaway-result">
        <div class="giveaway-winner-label">
          {{ texts.winner }}
        </div>
        <div class="giveaway-winner">
          {{ state.winner.name }}
        </div>
      </div>
      <div v-else key="hint" class="giveaway-hint">
        {{ state.status === 'open' ? fillTemplate(texts.join, { keyword: settings.keyword }, settings.language) : texts.closed }}
      </div>
    </Transition>

    <div v-if="settings.showEntries" class="giveaway-count">
      {{ fillTemplate(texts.entries, { count: entries.length }, settings.language) }}
    </div>
  </div>
</template>

<style>
@layer widget {
  .giveaway {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 0.6em;
    min-height: calc(100% - 24px);
    margin: 12px;
    padding: 1.2em;
    border-radius: var(--radius);
    background: var(--bg);
    font-size: var(--font-size);
    color: var(--text);
    text-align: center;
  }

  .giveaway-title {
    display: flex;
    align-items: center;
    gap: 0.4em;
    font-size: 1.1em;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--accent);
  }

  .giveaway-hint {
    font-size: 1.1em;
    font-weight: 600;
  }

  .giveaway-roll {
    font-size: 1.6em;
    font-weight: 800;
    opacity: 0.85;
  }

  .giveaway-winner-label {
    font-size: 0.8em;
    font-weight: 700;
    text-transform: uppercase;
    opacity: 0.7;
  }

  .giveaway-winner {
    font-size: 2em;
    font-weight: 900;
    color: var(--accent);
    text-shadow: 0 0 0.6em color-mix(in srgb, var(--accent) 60%, transparent);
  }

  .giveaway-count {
    font-size: 0.75em;
    opacity: 0.7;
  }
}
</style>
