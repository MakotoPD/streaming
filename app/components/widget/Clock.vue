<script setup lang="ts">
import type { Settings } from '#shared/types'
import { widgetTexts } from '#shared/widgets'

const props = defineProps<{ settings: Settings, bus?: EventBus }>()

const context = useWidgetContext()
const now = useNow()
const startedAt = ref<number | null>(null)
const texts = computed(() => widgetTexts(props.settings.language).clock)
const pad = (value: number) => String(value).padStart(2, '0')

async function loadUptime() {
  const channels = context?.channels.value
  let start: string | null = null
  if (channels?.twitch?.login) {
    start = (await $fetch<{ startedAt: string | null }>(`/api/twitch/stream/${channels.twitch.login}`).catch(() => null))?.startedAt ?? null
  }
  if (!start && channels?.kick?.slug) {
    const kick = await $fetch<any>(`https://kick.com/api/v2/channels/${encodeURIComponent(channels.kick.slug)}`).catch(() => null)
    if (kick?.livestream?.created_at) start = `${String(kick.livestream.created_at).replace(' ', 'T')}Z`
  }
  startedAt.value = start ? new Date(start).getTime() : null
}

let uptimeTimer: ReturnType<typeof setInterval> | undefined
watch(() => props.settings.clockMode, (mode) => {
  clearInterval(uptimeTimer)
  if (mode !== 'uptime') return
  loadUptime()
  uptimeTimer = setInterval(loadUptime, 60_000)
}, { immediate: true })
onBeforeUnmount(() => clearInterval(uptimeTimer))

function duration(ms: number) {
  const total = Math.max(0, Math.floor(ms / 1000))
  const hours = Math.floor(total / 3600)
  const rest = `${pad(Math.floor((total % 3600) / 60))}${props.settings.showSeconds ? `:${pad(total % 60)}` : ''}`
  return `${hours}:${rest}`
}

const display = computed(() => {
  const s = props.settings
  const date = new Date(now.value)
  switch (s.clockMode) {
    case 'date':
      return date.toLocaleDateString(s.language, { weekday: 'long', day: 'numeric', month: 'long' })
    case 'uptime':
      return startedAt.value ? duration(now.value - startedAt.value) : texts.value.offline
    case 'countdown': {
      if (!s.countdownTo) return '--:--'
      const [hours, minutes] = String(s.countdownTo).split(':').map(Number)
      const target = new Date(date)
      target.setHours(hours!, minutes!, 0, 0)
      if (now.value - target.getTime() > 6 * 3_600_000) target.setDate(target.getDate() + 1)
      return duration(target.getTime() - now.value)
    }
    default:
      return date.toLocaleTimeString(s.language, { hour: '2-digit', minute: '2-digit', second: s.showSeconds ? '2-digit' : undefined, hour12: s.hour12 })
  }
})

const label = computed(() => {
  if (props.settings.clockLabel) return props.settings.clockLabel
  return ({ uptime: texts.value.uptime, countdown: texts.value.countdown } as Record<string, string>)[props.settings.clockMode] ?? ''
})
</script>

<template>
  <div class="clock">
    <span v-if="settings.showLabel && label" class="clock-label">{{ label }}</span>
    <span class="clock-time">{{ display }}</span>
  </div>
</template>

<style>
@layer widget {
  .clock {
    display: inline-flex;
    flex-direction: column;
    align-items: center;
    margin: 12px;
    padding: 0.4em 1em;
    border-radius: var(--radius);
    background: var(--bg);
  }

  .clock-label {
    font-size: 14px;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--label);
  }

  .clock-time {
    font-size: var(--font-size);
    font-weight: 800;
    font-variant-numeric: tabular-nums;
    line-height: 1.15;
    color: var(--text);
    text-transform: capitalize;
  }
}
</style>
