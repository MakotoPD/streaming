<script setup lang="ts">
import type { Settings } from '#shared/types'
import { widgetTexts } from '#shared/widgets'

const props = defineProps<{ settings: Settings, bus: EventBus }>()

const state = useWidgetState('poll', () => ({ status: 'open' as 'open' | 'closed', votes: {} as Record<string, number>, endsAt: 0 }))
const now = useNow()

const texts = computed(() => widgetTexts(props.settings.language).poll)
const options = computed(() => props.settings.pollOptions as string[])

const counts = computed(() => {
  const totals = options.value.map(() => 0)
  for (const index of Object.values(state.value.votes)) {
    if (index < totals.length) totals[index]!++
  }
  return totals
})
const total = computed(() => counts.value.reduce((sum, value) => sum + value, 0))
const best = computed(() => Math.max(...counts.value))
const secondsLeft = computed(() => (state.value.endsAt ? Math.max(0, Math.ceil((state.value.endsAt - now.value) / 1000)) : 0))
const commands = computed(() => options.value.map((_, i) => `${props.settings.commandPrefix}${i + 1}`).join(', '))
const visible = computed(() => state.value.status === 'open' || !props.settings.hideWhenClosed)

function start() {
  state.value = { status: 'open', votes: {}, endsAt: props.settings.autoClose ? Date.now() + props.settings.autoClose * 1000 : 0 }
}

watch(secondsLeft, (left) => {
  if (state.value.status === 'open' && state.value.endsAt && left === 0) state.value.status = 'closed'
})

useBusEvents(props.bus, (event) => {
  if (event.kind === 'command') {
    if (event.name === 'start') start()
    else if (event.name === 'stop') state.value.status = 'closed'
    else if (event.name === 'reset') state.value.votes = {}
    return
  }
  if (event.kind !== 'chat' || state.value.status !== 'open') return
  const match = event.text.trim().match(/^(\S*?)(\d+)$/)
  if (!match || match[1] !== props.settings.commandPrefix) return
  const index = Number(match[2]) - 1
  if (index < 0 || index >= options.value.length) return
  const voter = `${event.platform}:${event.userId || event.name}`
  if (!props.settings.allowChange && voter in state.value.votes) return
  state.value.votes[voter] = index
})

function percent(count: number) {
  return total.value ? Math.round((count / total.value) * 100) : 0
}
</script>

<template>
  <Transition :enter-active-class="`anim-in-${settings.animIn}`" :leave-active-class="`anim-out-${settings.animOut}`">
    <div v-if="visible" class="poll">
      <div class="poll-question">
        {{ settings.question || texts.question }}
      </div>
      <div
        v-for="(option, i) in options"
        :key="i"
        class="poll-option"
        :class="{ 'poll-winner': state.status === 'closed' && total && counts[i] === best }"
      >
        <div class="poll-row">
          <span class="poll-label">{{ settings.commandPrefix }}{{ i + 1 }} · {{ option }}</span>
          <span class="poll-count">{{ settings.showPercent ? `${percent(counts[i]!)}%` : counts[i] }}</span>
        </div>
        <div class="poll-bar">
          <div class="poll-fill" :style="{ width: `${percent(counts[i]!)}%` }" />
        </div>
      </div>
      <div class="poll-footer">
        <span>{{ state.status === 'open' ? fillTemplate(texts.hint, { commands }, settings.language) : texts.closed }}</span>
        <span>{{ fillTemplate(texts.votes, { count: total }, settings.language) }}<template v-if="secondsLeft && state.status === 'open'"> · {{ secondsLeft }}s</template></span>
      </div>
    </div>
  </Transition>
</template>

<style>
@layer widget {
  .poll {
    display: flex;
    flex-direction: column;
    gap: 0.7em;
    margin: 12px;
    padding: 1em 1.2em;
    border-radius: var(--radius);
    background: var(--bg);
    font-size: var(--font-size);
    color: var(--text);
  }

  .poll-question {
    font-size: 1.2em;
    font-weight: 800;
  }

  .poll-row {
    display: flex;
    justify-content: space-between;
    gap: 1em;
    margin-bottom: 0.3em;
    font-weight: 600;
  }

  .poll-bar {
    height: 0.6em;
    overflow: hidden;
    border-radius: 999px;
    background: var(--bar-bg);
  }

  .poll-fill {
    height: 100%;
    border-radius: inherit;
    background: var(--bar);
    transition: width 0.5s cubic-bezier(0.16, 1, 0.3, 1);
  }

  .poll-winner .poll-fill {
    background: var(--winner);
  }

  .poll-winner .poll-label {
    color: var(--winner);
  }

  .poll-footer {
    display: flex;
    justify-content: space-between;
    gap: 1em;
    font-size: 0.7em;
    opacity: 0.7;
  }
}
</style>
