<script setup lang="ts">
import type { Channels, StreamEvent } from '#shared/types'

definePageMeta({ layout: false })
useHead({
  htmlAttrs: { class: 'panel-page' },
  meta: [
    { name: 'robots', content: 'noindex, nofollow' },
    { name: 'referrer', content: 'no-referrer' }
  ],
  title: 'Panel akcji'
})

type PanelData = { channels: Channels }
type ActionEvent = Extract<StreamEvent, { kind: 'alert' | 'redemption' | 'hypetrain' | 'twitch-poll' | 'prediction' }> & {
  panelId: string
  receivedAt: number
  skipped?: boolean
}

const route = useRoute()
const token = String(route.params.token)
const { data } = await useFetch<PanelData>(`/api/p/${token}`)

const bus = createEventBus()
useStreamEvents(() => data.value?.channels, bus, () => Boolean(data.value))

const actions = ref<ActionEvent[]>([])
const archived = ref<ActionEvent[]>([])
const busy = ref<string>()
const error = ref('')

function isAction(event: StreamEvent): event is ActionEvent {
  return ['alert', 'redemption', 'hypetrain', 'twitch-poll', 'prediction'].includes(event.kind)
}

function addAction(event: StreamEvent) {
  if (!isAction(event)) return
  actions.value.unshift({ ...event, panelId: crypto.randomUUID(), receivedAt: Date.now() })
  if (actions.value.length > 160) actions.value.length = 160
}

function title(event: ActionEvent) {
  if (event.kind === 'alert') {
    const labels: Record<string, string> = { follow: 'Obserwacja', sub: 'Sub', gifts: 'Gifty', raid: 'Raid', bits: 'Bity', donation: 'Donejt' }
    return labels[event.type] ?? event.type
  }
  if (event.kind === 'redemption') return event.reward.title
  if (event.kind === 'hypetrain') return `Hype Train: ${event.phase}`
  if (event.kind === 'twitch-poll') return `Ankieta: ${event.phase}`
  return `Przewidywanie: ${event.phase}`
}

function description(event: ActionEvent) {
  if (event.kind === 'alert') {
    const detail = [event.name, event.count ? `x${event.count}` : '', event.amount ? formatMoney(event.amount, event.currency, 'pl') : ''].filter(Boolean).join(' · ')
    return detail || event.platform
  }
  if (event.kind === 'redemption') return `${event.name}${event.input ? ` · ${event.input}` : ''}`
  if (event.kind === 'hypetrain') return `Poziom ${event.level} · ${event.progress}/${event.goal}`
  if (event.kind === 'twitch-poll') return event.title
  return event.title
}

function timeLabel(time: number) {
  return new Intl.DateTimeFormat('pl-PL', { hour: '2-digit', minute: '2-digit', second: '2-digit' }).format(new Date(time))
}

function icon(event: ActionEvent) {
  if (event.kind === 'alert') {
    return {
      follow: 'i-lucide-heart',
      sub: 'i-lucide-star',
      gifts: 'i-lucide-gift',
      raid: 'i-lucide-users',
      bits: 'i-lucide-gem',
      donation: 'i-lucide-banknote'
    }[event.type]
  }
  if (event.kind === 'redemption') return 'i-lucide-ticket'
  if (event.kind === 'hypetrain') return 'i-lucide-train'
  return 'i-lucide-chart-no-axes-column'
}

async function replay(event: ActionEvent) {
  busy.value = `replay-${event.panelId}`
  error.value = ''
  try {
    const { panelId, receivedAt, skipped, ...payload } = event
    await $fetch(`/api/p/${token}/actions`, { method: 'POST', body: { action: 'replay', event: payload } })
  }
  catch {
    error.value = 'Nie udało się odtworzyć akcji.'
  }
  finally {
    busy.value = undefined
  }
}

async function skip(event?: ActionEvent) {
  busy.value = event ? `skip-${event.panelId}` : 'skip-current'
  error.value = ''
  try {
    await $fetch(`/api/p/${token}/actions`, { method: 'POST', body: { action: 'skip' } })
    if (event) event.skipped = true
  }
  catch {
    error.value = 'Nie udało się pominąć bieżącej akcji.'
  }
  finally {
    busy.value = undefined
  }
}

function undo(event: ActionEvent) {
  actions.value = actions.value.filter(item => item.panelId !== event.panelId)
  archived.value.unshift(event)
}

function restoreLast() {
  const event = archived.value.shift()
  if (event) actions.value.unshift({ ...event, skipped: false })
}

useBusEvents(bus, addAction)

onMounted(() => {
  const source = new EventSource(`/api/p/${token}/events`)
  source.onmessage = (event) => {
    const msg = JSON.parse(event.data)
    if (msg.kind === 'event') addAction(msg.event)
  }
  onBeforeUnmount(() => source.close())
})
</script>

<template>
  <main class="panel-shell actions-panel">
    <header class="panel-header">
      <div>
        <p class="panel-kicker">
          Panel OBS
        </p>
        <h1>Akcje na streamie</h1>
      </div>
      <div class="toolbar">
        <UButton color="neutral" variant="soft" icon="i-lucide-undo-2" title="Cofnij ukrycie" :disabled="!archived.length" @click="restoreLast" />
        <UButton color="neutral" variant="soft" icon="i-lucide-skip-forward" title="Pomiń bieżący alert" :loading="busy === 'skip-current'" @click="skip()" />
      </div>
    </header>

    <section class="action-list" aria-live="polite">
      <p v-if="!actions.length" class="empty-state">
        Czekam na alerty, nagrody i inne akcje...
      </p>
      <article v-for="event in actions" :key="event.panelId" class="action-row" :class="{ skipped: event.skipped }">
        <div class="action-icon">
          <UIcon :name="icon(event)" />
        </div>
        <div class="action-copy">
          <div class="action-title">
            {{ title(event) }}
          </div>
          <div class="action-description">
            {{ description(event) }}
          </div>
          <time>{{ timeLabel(event.receivedAt) }}</time>
        </div>
        <div class="action-buttons">
          <UButton color="primary" variant="soft" icon="i-lucide-play" title="Odtwórz akcję" :loading="busy === `replay-${event.panelId}`" @click="replay(event)" />
          <UButton color="neutral" variant="soft" icon="i-lucide-skip-forward" title="Pomiń bieżący alert" :loading="busy === `skip-${event.panelId}`" @click="skip(event)" />
          <UButton color="neutral" variant="ghost" icon="i-lucide-undo-2" title="Cofnij z listy" @click="undo(event)" />
        </div>
      </article>
      <p v-if="error" class="panel-error">
        {{ error }}
      </p>
    </section>
  </main>
</template>

<style>
html.panel-page,
html.panel-page body {
  min-height: 100%;
  margin: 0;
  overflow: hidden;
  background: #121319;
  color: #f5f7fb;
  color-scheme: dark;
}
</style>

<style scoped>
.panel-shell {
  display: grid;
  grid-template-rows: auto minmax(0, 1fr);
  width: 100vw;
  height: 100vh;
  background:
    linear-gradient(180deg, rgb(255 255 255 / 0.045), transparent 120px),
    #121319;
  font-family: var(--font-sans);
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 14px 16px 12px;
  border-bottom: 1px solid rgb(255 255 255 / 0.08);
  background: #191b24;
}

.panel-kicker {
  margin: 0 0 2px;
  color: #a7adbb;
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
}

h1 {
  margin: 0;
  font-size: 18px;
  line-height: 1.2;
}

.toolbar,
.action-buttons {
  display: flex;
  gap: 7px;
}

.toolbar :deep(button),
.action-buttons :deep(button) {
  width: 34px;
  height: 34px;
  padding: 0;
}

.action-list {
  min-height: 0;
  padding: 14px;
  overflow-y: auto;
}

.empty-state,
.panel-error {
  margin: 0;
  color: #a7adbb;
  font-size: 13px;
}

.panel-error {
  color: #ff7a8a;
}

.action-row {
  display: grid;
  grid-template-columns: 38px minmax(0, 1fr) auto;
  gap: 10px;
  align-items: center;
  padding: 10px;
  margin-bottom: 10px;
  border: 1px solid rgb(255 255 255 / 0.08);
  border-radius: 8px;
  background: #181a22;
}

.action-row.skipped {
  opacity: 0.58;
}

.action-icon {
  display: grid;
  place-items: center;
  width: 38px;
  height: 38px;
  border-radius: 8px;
  color: #fff;
  background: linear-gradient(135deg, #8b5cf6, #e94b67);
}

.action-copy {
  min-width: 0;
}

.action-title {
  overflow: hidden;
  font-weight: 800;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.action-description {
  overflow: hidden;
  margin-top: 2px;
  color: #c8cedb;
  font-size: 13px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

time {
  display: block;
  margin-top: 4px;
  color: #8991a3;
  font-size: 11px;
}

@media (max-width: 460px) {
  .action-row {
    grid-template-columns: 34px minmax(0, 1fr);
  }

  .action-buttons {
    grid-column: 2;
  }
}
</style>
