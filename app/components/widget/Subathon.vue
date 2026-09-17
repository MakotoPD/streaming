<script setup lang="ts">
import type { AlertEvent, Settings } from '#shared/types'
import { widgetTexts } from '#shared/widgets'

const props = defineProps<{ settings: Settings, bus: EventBus }>()

const initial = () => ({ running: false, endsAt: 0, remaining: props.settings.startMinutes * 60_000 })
const state = useWidgetState('subathon', initial)
const now = useNow(250)
const texts = computed(() => widgetTexts(props.settings.language).subathon)

const remaining = computed(() => Math.max(0, state.value.running ? state.value.endsAt - now.value : state.value.remaining))
const ended = computed(() => state.value.running && remaining.value === 0)

const added = ref<{ id: number, seconds: number }[]>([])
let addedId = 0

const pad = (value: number) => String(value).padStart(2, '0')
const time = computed(() => {
  const total = Math.floor(remaining.value / 1000)
  return `${pad(Math.floor(total / 3600))}:${pad(Math.floor((total % 3600) / 60))}:${pad(total % 60)}`
})

function addSeconds(seconds: number) {
  if (!seconds || ended.value) return
  const cap = props.settings.maxHours > 0 ? props.settings.maxHours * 3_600_000 : Infinity
  const current = remaining.value
  const next = Math.max(0, Math.min(cap, current + seconds * 1000))
  const applied = Math.round((next - current) / 1000)
  if (state.value.running) state.value.endsAt = Date.now() + next
  else state.value.remaining = next
  if (props.settings.showAdded && applied) {
    const id = addedId++
    added.value.push({ id, seconds: applied })
    setTimeout(() => {
      added.value = added.value.filter(item => item.id !== id)
    }, 1600)
  }
}

function secondsFor(event: AlertEvent) {
  const s = props.settings
  const tier = s.tierMultiplier ? Math.max(1, event.tier ?? 1) : 1
  switch (event.type) {
    case 'sub': return s.secondsPerSub * tier
    case 'gifts': return s.secondsPerGift * tier * (event.count ?? 1)
    case 'bits': return s.secondsPer100Bits * Math.floor((event.count ?? 0) / 100)
    case 'follow': return s.secondsPerFollow
    case 'raid': return s.secondsPerRaid
  }
}

useBusEvents(props.bus, (event) => {
  if (event.kind === 'alert') return addSeconds(secondsFor(event))
  if (event.kind !== 'command') return
  if (event.name === 'start' && !state.value.running) state.value = { running: true, endsAt: Date.now() + state.value.remaining, remaining: 0 }
  else if (event.name === 'pause' && state.value.running) state.value = { running: false, endsAt: 0, remaining: remaining.value }
  else if (event.name === 'addMinute') addSeconds(60)
  else if (event.name === 'removeMinute') addSeconds(-60)
  else if (event.name === 'reset') state.value = initial()
})
</script>

<template>
  <div class="subathon">
    <div class="subathon-title">
      {{ settings.subathonTitle || texts.title }}
      <span v-if="!state.running || ended" class="subathon-status">· {{ ended ? texts.ended : texts.paused }}</span>
    </div>
    <div class="subathon-time">
      {{ time }}
      <TransitionGroup tag="div" class="subathon-added-list" enter-active-class="subathon-added-in">
        <span v-for="item in added" :key="item.id" class="subathon-added">{{ item.seconds > 0 ? '+' : '' }}{{ item.seconds }}s</span>
      </TransitionGroup>
    </div>
  </div>
</template>

<style>
@layer widget {
  .subathon {
    display: inline-flex;
    flex-direction: column;
    align-items: center;
    margin: 12px;
    padding: 0.6em 1.2em;
    border-radius: var(--radius);
    background: var(--bg);
    color: var(--text);
  }

  .subathon-title {
    font-size: 18px;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--label);
  }

  .subathon-time {
    position: relative;
    font-size: var(--font-size);
    font-weight: 800;
    font-variant-numeric: tabular-nums;
    line-height: 1.1;
  }

  .subathon-added-list {
    position: absolute;
    top: 0;
    left: 100%;
    display: flex;
    flex-direction: column;
  }

  .subathon-added {
    margin-left: 0.3em;
    font-size: 0.35em;
    font-weight: 800;
    color: var(--accent);
    animation: subathon-float 1.6s ease-out both;
  }

  @keyframes subathon-float {
    0% { opacity: 0; translate: 0 0.6em; }
    20% { opacity: 1; translate: 0 0; }
    100% { opacity: 0; translate: 0 -1.2em; }
  }
}
</style>
