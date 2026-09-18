<script setup lang="ts">
import type { AlertType, Settings } from '#shared/types'
import { widgetTexts } from '#shared/widgets'

const props = defineProps<{ settings: Settings, bus: EventBus }>()

const ICONS: Record<AlertType, string> = {
  follow: 'i-lucide-heart',
  sub: 'i-lucide-star',
  gifts: 'i-lucide-gift',
  raid: 'i-lucide-users',
  bits: 'i-lucide-gem',
  donation: 'i-lucide-banknote'
}

const TOGGLES: Record<AlertType, string> = { follow: 'showFollow', sub: 'showSub', gifts: 'showGifts', raid: 'showRaid', bits: 'showBits', donation: 'showDonation' }

const latest = useWidgetState<Partial<Record<AlertType, { name: string, count?: number, amount?: string }>>>('recent', () => ({}))
const texts = computed(() => widgetTexts(props.settings.language).recent)

const items = computed(() => (Object.keys(ICONS) as AlertType[])
  .filter(type => props.settings[TOGGLES[type]])
  .map(type => ({ type, icon: ICONS[type], label: texts.value[type], value: latest.value[type] })))

const tickerIndex = ref(0)
const now = useNow(500)
let lastTick = Date.now()
watch(now, (time) => {
  if (time - lastTick < props.settings.tickerInterval * 1000) return
  lastTick = time
  tickerIndex.value = (tickerIndex.value + 1) % Math.max(1, items.value.length)
})

const visibleItems = computed(() => (props.settings.recentLayout === 'ticker' ? items.value.slice(tickerIndex.value, tickerIndex.value + 1) : items.value))

function describe(type: AlertType, value?: { name: string, count?: number, amount?: string }) {
  if (!value) return '—'
  if (value.amount) return `${value.name} (${value.amount})`
  if ((type === 'gifts' || type === 'bits' || type === 'raid') && value.count) return `${value.name} (${value.count})`
  return value.name
}

useBusEvents(props.bus, (event) => {
  if (event.kind === 'command' && event.name === 'reset') latest.value = {}
  if (event.kind !== 'alert') return
  latest.value = { ...latest.value, [event.type]: { name: event.anonymous ? widgetTexts(props.settings.language).alerts.anonymous : event.name, count: event.count, amount: event.amount === undefined ? undefined : formatMoney(event.amount, event.currency, props.settings.language) } }
})
</script>

<template>
  <TransitionGroup tag="div" class="recent" :class="`recent-${settings.recentLayout}`" enter-active-class="anim-in-slide-up" leave-active-class="anim-out-fade">
    <div v-for="item in visibleItems" :key="item.type" class="recent-item" :data-type="item.type">
      <UIcon v-if="settings.showIcons" :name="item.icon" class="recent-icon" />
      <span class="recent-label">{{ item.label }}</span>
      <span class="recent-name">{{ describe(item.type, item.value) }}</span>
    </div>
  </TransitionGroup>
</template>

<style>
@layer widget {
  .recent {
    display: flex;
    align-items: center;
    gap: var(--gap);
    height: 100%;
    padding: 8px;
    font-size: var(--font-size);
    --anim-duration: 400ms;
  }

  .recent-column {
    flex-direction: column;
    align-items: stretch;
    justify-content: center;
  }

  .recent-ticker {
    position: relative;
  }

  .recent-ticker .recent-item.anim-out-fade {
    position: absolute;
  }

  .recent-item {
    display: flex;
    align-items: center;
    gap: 0.5em;
    padding: 0.45em 0.9em;
    border-radius: var(--radius);
    background: var(--bg);
    color: var(--text);
    white-space: nowrap;
  }

  .recent-icon {
    flex-shrink: 0;
    color: var(--accent);
  }

  .recent-label {
    font-size: 0.75em;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    color: var(--label);
  }

  .recent-name {
    font-weight: 800;
  }
}
</style>
