<script setup lang="ts">
import type { Settings } from '#shared/types'
import { widgetTexts } from '#shared/widgets'

const props = defineProps<{ settings: Settings, bus: EventBus }>()

const value = useWidgetState('counter', () => 0)
const valueEl = useTemplateRef<HTMLSpanElement>('value')
let lastChange = 0

function change(next: number) {
  value.value = Math.max(0, next)
  if (props.settings.popOnChange) nextTick(() => popElement(valueEl.value, 1.35, 8, 260))
}

function handleCommand(text: string) {
  const command = String(props.settings.command).trim().toLowerCase()
  const input = text.trim().toLowerCase()
  if (!command || !input.startsWith(command)) return false
  const rest = input.slice(command.length).trim()
  if (rest === '' || rest === '+') change(value.value + props.settings.step)
  else if (rest === '-') change(value.value - props.settings.step)
  else if (rest === 'reset') change(0)
  else if (/^set\s+\d+$/.test(rest)) change(Number(rest.split(/\s+/)[1]))
  else return false
  return true
}

useBusEvents(props.bus, (event) => {
  if (event.kind === 'command') {
    if (event.name === 'increment') change(value.value + props.settings.step)
    else if (event.name === 'decrement') change(value.value - props.settings.step)
    else if (event.name === 'reset') change(0)
    return
  }
  if (event.kind !== 'chat' || !hasPermission(event.roles, props.settings.permission)) return
  if (Date.now() - lastChange < props.settings.cooldown * 1000) return
  if (handleCommand(event.text)) lastChange = Date.now()
})
</script>

<template>
  <div class="counter" :class="`counter-${settings.layout}`">
    <span class="counter-label">{{ settings.counterLabel || widgetTexts(settings.language).counter.label }}</span>
    <span ref="value" class="counter-value">{{ value }}</span>
  </div>
</template>

<style>
@layer widget {
  .counter {
    display: inline-flex;
    align-items: center;
    gap: 0.4em;
    margin: 12px;
    padding: 0.2em 0.6em;
    border-radius: var(--radius);
    background: var(--bg);
    font-size: var(--font-size);
    line-height: 1.1;
  }

  .counter-column {
    flex-direction: column;
    gap: 0;
  }

  .counter-label {
    font-size: 0.6em;
    font-weight: 700;
    letter-spacing: 0.05em;
    text-transform: uppercase;
    color: var(--label);
  }

  .counter-value {
    display: inline-block;
    font-weight: 900;
    font-variant-numeric: tabular-nums;
    color: var(--value);
  }
}
</style>
