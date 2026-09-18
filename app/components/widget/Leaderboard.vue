<script setup lang="ts">
import type { Settings } from '#shared/types'
import { widgetTexts } from '#shared/widgets'

const props = defineProps<{ settings: Settings, bus: EventBus }>()

type Mode = 'chatters' | 'gifters' | 'bits' | 'donors'

const scores = useWidgetState<Record<Mode, Record<string, { name: string, count: number }>>>('leaderboard', () => ({ chatters: {}, gifters: {}, bits: {}, donors: {} }))
const texts = computed(() => widgetTexts(props.settings.language).leaderboard)
const mode = computed(() => props.settings.leaderboardMode as Mode)

const currency = useWidgetState<string>('leaderboard-currency', () => 'PLN')

const rows = computed(() => Object.values(scores.value[mode.value] ?? {})
  .sort((a, b) => b.count - a.count)
  .slice(0, props.settings.limit))

const unit = computed(() => ({ chatters: texts.value.messages, gifters: texts.value.subs, bits: texts.value.bitsUnit, donors: '' })[mode.value])

function countLabel(count: number) {
  if (mode.value === 'donors') return formatMoney(count, currency.value, props.settings.language)
  return `${count} ${fillTemplate(unit.value, { count }, props.settings.language)}`
}

function add(target: Mode, name: string, amount: number) {
  if (!name || (props.settings.ignoredUsers as string[]).some(user => user.toLowerCase() === name.toLowerCase())) return
  const key = name.toLowerCase()
  const board = scores.value[target]
  board[key] = { name, count: Math.round(((board[key]?.count ?? 0) + amount) * 100) / 100 }
}

useBusEvents(props.bus, (event) => {
  if (event.kind === 'command' && event.name === 'reset') scores.value = { chatters: {}, gifters: {}, bits: {}, donors: {} }
  else if (event.kind === 'chat') add('chatters', event.name, 1)
  else if (event.kind === 'alert' && event.type === 'gifts' && !event.anonymous) add('gifters', event.name, event.count ?? 1)
  else if (event.kind === 'alert' && event.type === 'bits') add('bits', event.name, event.count ?? 0)
  else if (event.kind === 'alert' && event.type === 'donation') {
    if (event.currency) currency.value = event.currency
    add('donors', event.name, event.amount ?? 0)
  }
})
</script>

<template>
  <div class="leaderboard">
    <div class="leaderboard-title">
      {{ settings.leaderboardTitle || texts[mode] }}
    </div>
    <TransitionGroup tag="ol" class="leaderboard-list" move-class="leaderboard-move">
      <li v-for="(row, i) in rows" :key="row.name" class="leaderboard-row" :class="{ 'leaderboard-first': i === 0 }">
        <span class="leaderboard-rank">{{ i + 1 }}</span>
        <span class="leaderboard-name">{{ row.name }}</span>
        <span v-if="settings.showCount" class="leaderboard-count">{{ countLabel(row.count) }}</span>
      </li>
    </TransitionGroup>
    <div v-if="!rows.length" class="leaderboard-empty">
      {{ texts.empty }}
    </div>
  </div>
</template>

<style>
@layer widget {
  .leaderboard {
    display: flex;
    flex-direction: column;
    gap: var(--gap);
    margin: 12px;
    padding: 1em 1.1em;
    border-radius: var(--radius);
    background: var(--bg);
    font-size: var(--font-size);
    color: var(--text);
  }

  .leaderboard-title {
    margin-bottom: 0.2em;
    font-size: 1.1em;
    font-weight: 800;
  }

  .leaderboard-list {
    display: flex;
    flex-direction: column;
    gap: var(--gap);
    margin: 0;
    padding: 0;
    list-style: none;
  }

  .leaderboard-row {
    display: flex;
    align-items: baseline;
    gap: 0.6em;
  }

  .leaderboard-move {
    transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1);
  }

  .leaderboard-rank {
    width: 1.4em;
    font-weight: 800;
    opacity: 0.6;
  }

  .leaderboard-name {
    flex: 1;
    overflow: hidden;
    font-weight: 700;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .leaderboard-count {
    font-size: 0.8em;
    opacity: 0.75;
    white-space: nowrap;
  }

  .leaderboard-first {
    color: var(--first);
  }

  .leaderboard-first .leaderboard-rank {
    opacity: 1;
  }

  .leaderboard-empty {
    font-size: 0.85em;
    opacity: 0.6;
  }
}
</style>
