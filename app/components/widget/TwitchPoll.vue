<script setup lang="ts">
import type { PredictionEvent, Settings, TwitchPollEvent } from '#shared/types'
import { widgetTexts } from '#shared/widgets'

const props = defineProps<{ settings: Settings, bus: EventBus }>()

const active = shallowRef<TwitchPollEvent | PredictionEvent>()
const now = useNow()
const texts = computed(() => widgetTexts(props.settings.language).twitchPoll)
let hideTimer: ReturnType<typeof setTimeout> | undefined

interface Row { id: string, title: string, value: number, detail: string, color?: string, winner: boolean }

const rows = computed<Row[]>(() => {
  const item = active.value
  const lang = props.settings.language
  if (!item) return []
  if (item.kind === 'twitch-poll') {
    const best = Math.max(...item.choices.map(c => c.votes))
    return item.choices.map(choice => ({
      id: choice.id,
      title: choice.title,
      value: choice.votes,
      detail: fillTemplate(texts.value.votes, { count: choice.votes }, lang),
      winner: item.phase === 'end' && best > 0 && choice.votes === best
    }))
  }
  return item.outcomes.map(outcome => ({
    id: outcome.id,
    title: outcome.title,
    value: outcome.points,
    detail: [
      props.settings.showPoints ? fillTemplate(texts.value.points, { count: outcome.points }, lang) : '',
      fillTemplate(texts.value.users, { count: outcome.users }, lang)
    ].filter(Boolean).join(' · '),
    color: outcome.color,
    winner: item.winningId === outcome.id
  }))
})

const total = computed(() => rows.value.reduce((sum, row) => sum + row.value, 0))

const status = computed(() => {
  const item = active.value
  if (!item) return ''
  if (item.kind === 'prediction') {
    if (item.status === 'canceled') return texts.value.canceled
    if (item.phase === 'lock') return texts.value.locked
    if (item.phase === 'end') return ''
  }
  if (item.kind === 'twitch-poll' && item.phase === 'end') return texts.value.ended
  const deadline = item.kind === 'twitch-poll' ? item.endsAt : item.locksAt
  const left = deadline ? Math.max(0, Math.floor((new Date(deadline).getTime() - now.value) / 1000)) : 0
  return fillTemplate(texts.value.endsIn, { time: `${Math.floor(left / 60)}:${String(left % 60).padStart(2, '0')}` }, props.settings.language)
})

function percent(value: number) {
  return total.value ? Math.round((value / total.value) * 100) : 0
}

useBusEvents(props.bus, (event) => {
  if (event.kind !== 'twitch-poll' && event.kind !== 'prediction') return
  const kinds = props.settings.pollKinds
  if ((kinds === 'polls' && event.kind !== 'twitch-poll') || (kinds === 'predictions' && event.kind !== 'prediction')) return
  clearTimeout(hideTimer)
  active.value = event
  if (event.phase === 'end') {
    hideTimer = setTimeout(() => {
      active.value = undefined
    }, props.settings.resultsHold * 1000)
  }
})

onBeforeUnmount(() => clearTimeout(hideTimer))
</script>

<template>
  <div class="tpoll-area">
    <Transition :enter-active-class="`anim-in-${settings.animIn}`" :leave-active-class="`anim-out-${settings.animOut}`">
      <div v-if="active" :key="active.id" class="tpoll" :class="`tpoll-${active.kind}`">
        <div class="tpoll-title">
          {{ active.title }}
        </div>
        <div
          v-for="row in rows"
          :key="row.id"
          class="tpoll-option"
          :class="[{ 'tpoll-winner': row.winner }, row.color ? `tpoll-${row.color}` : '']"
        >
          <div class="tpoll-row">
            <span class="tpoll-label">
              <UIcon v-if="row.winner" name="i-lucide-trophy" />
              {{ row.title }}
            </span>
            <span class="tpoll-count">{{ percent(row.value) }}%<template v-if="settings.showVotes"> · {{ row.detail }}</template></span>
          </div>
          <div class="tpoll-bar">
            <div class="tpoll-fill" :style="{ width: `${percent(row.value)}%` }" />
          </div>
        </div>
        <div v-if="status" class="tpoll-status">
          {{ status }}
        </div>
      </div>
    </Transition>
  </div>
</template>

<style>
@layer widget {
  .tpoll-area {
    height: 100%;
    padding: 12px;
  }

  .tpoll {
    display: flex;
    flex-direction: column;
    gap: 0.7em;
    padding: 1em 1.2em;
    border-radius: var(--radius);
    background: var(--bg);
    font-size: var(--font-size);
    color: var(--text);
  }

  .tpoll-title {
    font-size: 1.15em;
    font-weight: 800;
  }

  .tpoll-row {
    display: flex;
    justify-content: space-between;
    gap: 1em;
    margin-bottom: 0.3em;
    font-weight: 600;
  }

  .tpoll-label {
    display: inline-flex;
    align-items: center;
    gap: 0.3em;
  }

  .tpoll-count {
    font-size: 0.8em;
    opacity: 0.85;
    white-space: nowrap;
  }

  .tpoll-bar {
    height: 0.6em;
    overflow: hidden;
    border-radius: 999px;
    background: var(--bar-bg);
  }

  .tpoll-fill {
    height: 100%;
    border-radius: inherit;
    background: var(--bar);
    transition: width 0.6s cubic-bezier(0.16, 1, 0.3, 1);
  }

  .tpoll-blue .tpoll-fill { background: var(--blue); }
  .tpoll-pink .tpoll-fill { background: var(--pink); }

  .tpoll-winner .tpoll-fill { background: var(--winner); }
  .tpoll-winner .tpoll-label { color: var(--winner); }

  .tpoll-status {
    font-size: 0.7em;
    opacity: 0.7;
  }
}
</style>
