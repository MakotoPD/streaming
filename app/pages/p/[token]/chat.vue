<script setup lang="ts">
import type { ChatMessage, Channels, Platform, StreamEvent } from '#shared/types'

definePageMeta({ layout: false })
useHead({
  htmlAttrs: { class: 'panel-page' },
  meta: [
    { name: 'robots', content: 'noindex, nofollow' },
    { name: 'referrer', content: 'no-referrer' }
  ],
  title: 'Panel czatu'
})

type PanelPlatform = { platform: Platform, readable: boolean, writable: boolean, reconnect: boolean }
type PanelData = { channels: Channels, platforms: PanelPlatform[] }
type PanelMessage = ChatMessage & { deleted?: boolean, revealed?: boolean, hidden?: boolean, receivedAt: number }

const route = useRoute()
const token = String(route.params.token)
const { data } = await useFetch<PanelData>(`/api/p/${token}`)

const bus = createEventBus()
useStreamEvents(() => data.value?.channels, bus, () => Boolean(data.value))

const messages = ref<PanelMessage[]>([])
const message = ref('')
const sending = ref(false)
const error = ref('')

const writable = computed(() => (data.value?.platforms ?? []).filter(platform => platform.writable))
const readable = computed(() => (data.value?.platforms ?? []).filter(platform => platform.readable))
const platforms = computed(() => readable.value.length ? readable.value : data.value?.platforms ?? [])
const selected = ref<Platform>('twitch')

watch(writable, (items) => {
  selected.value = items[0]?.platform ?? platforms.value[0]?.platform ?? 'twitch'
}, { immediate: true })

const canSend = computed(() => writable.value.some(platform => platform.platform === selected.value))
const selectedMeta = computed(() => data.value?.platforms.find(platform => platform.platform === selected.value))
const recentEmotes = computed(() => {
  const seen = new Map<string, string>()
  for (const item of messages.value) {
    for (const part of item.parts) {
      if (part.type === 'emote' && !seen.has(part.name)) seen.set(part.name, part.url)
    }
  }
  return [...seen.entries()].slice(-18).reverse().map(([name, url]) => ({ name, url }))
})

function addMessage(event: ChatMessage) {
  messages.value.push({ ...event, receivedAt: Date.now() })
  if (messages.value.length > 220) messages.value.splice(0, messages.value.length - 220)
}

function hideMessage(message: PanelMessage) {
  message.hidden = true
}

function markDeleted(event: Extract<StreamEvent, { kind: 'delete' }>) {
  const item = messages.value.find(message => message.platform === event.platform && message.id === event.id)
  if (item) item.deleted = true
}

function clearMessages(event: Extract<StreamEvent, { kind: 'clear' }>) {
  for (const item of messages.value) {
    if (item.platform === event.platform && (!event.userId || item.userId === event.userId)) item.deleted = true
  }
}

function platformIcon(platform: Platform) {
  return `i-simple-icons-${platform}`
}

function appendEmote(name: string) {
  message.value = `${message.value}${message.value.endsWith(' ') || !message.value ? '' : ' '}${name} `
}

async function send() {
  const text = message.value.trim()
  if (!text || !canSend.value) return
  sending.value = true
  error.value = ''
  try {
    await $fetch(`/api/p/${token}/chat`, { method: 'POST', body: { platform: selected.value, message: text } })
    message.value = ''
  }
  catch (err: any) {
    error.value = err?.data?.message === 'twitch_reconnect'
      ? 'Połącz Twitch ponownie w panelu aplikacji, żeby nadać uprawnienie do pisania.'
      : 'Nie udało się wysłać wiadomości.'
  }
  finally {
    sending.value = false
  }
}

useBusEvents(bus, (event) => {
  if (event.kind === 'chat') addMessage(event)
  else if (event.kind === 'delete') markDeleted(event)
  else if (event.kind === 'clear') clearMessages(event)
})
</script>

<template>
  <main class="panel-shell chat-panel">
    <header class="panel-header">
      <div>
        <p class="panel-kicker">
          Panel OBS
        </p>
        <h1>Czat transmisji</h1>
      </div>
      <div class="panel-platforms">
        <UIcon v-for="item in platforms" :key="item.platform" :name="platformIcon(item.platform)" :class="{ muted: !item.readable }" />
      </div>
    </header>

    <section class="chat-feed" aria-live="polite">
      <p v-if="!messages.some(item => !item.hidden)" class="empty-state">
        Czekam na wiadomości z czatu...
      </p>
      <article
        v-for="item in messages.filter(message => !message.hidden)"
        :key="`${item.platform}-${item.id}`"
        class="chat-row"
        :class="{ deleted: item.deleted && !item.revealed }"
      >
        <UButton class="icon-button" color="error" variant="ghost" size="xs" icon="i-lucide-trash-2" aria-label="Ukryj wiadomość w panelu" @click="hideMessage(item)" />
        <UIcon :name="platformIcon(item.platform)" class="platform-icon" />
        <div class="chat-message">
          <template v-if="item.deleted && !item.revealed">
            <p>Jedna wiadomość została usunięta przez moderatora.</p>
            <button class="reveal-button" type="button" @click="item.revealed = true">
              &lt;kliknij, aby wyświetlić&gt;
            </button>
          </template>
          <template v-else>
            <span class="chat-name" :style="{ color: item.color || undefined }">{{ item.name }}:</span>
            <WidgetParts :parts="item.parts" class="chat-text" />
          </template>
        </div>
      </article>
    </section>

    <footer class="composer">
      <div v-if="recentEmotes.length" class="emote-strip">
        <button v-for="emote in recentEmotes" :key="emote.name" type="button" :title="emote.name" @click="appendEmote(emote.name)">
          <img :src="emote.url" :alt="emote.name">
        </button>
      </div>
      <form class="composer-row" @submit.prevent="send">
        <select v-model="selected" aria-label="Platforma wysyłki">
          <option v-for="item in platforms" :key="item.platform" :value="item.platform">
            {{ item.platform }}
          </option>
        </select>
        <UInput v-model="message" :disabled="!canSend" maxlength="500" placeholder="Wyślij wiadomość" autocomplete="off" class="min-w-0" />
        <UButton type="submit" :loading="sending" :disabled="!message.trim() || !canSend" icon="i-lucide-send" aria-label="Wyślij" />
      </form>
      <p v-if="!canSend" class="panel-note">
        {{ selectedMeta?.reconnect ? 'Połącz Twitch ponownie, aby pisać z panelu.' : 'Pisanie na tej platformie nie jest jeszcze dostępne.' }}
      </p>
      <p v-if="error" class="panel-error">
        {{ error }}
      </p>
    </footer>
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
  grid-template-rows: auto minmax(0, 1fr) auto;
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

.panel-platforms {
  display: flex;
  gap: 8px;
  color: #e8ecf5;
}

.panel-platforms .muted {
  opacity: 0.35;
}

.chat-feed {
  min-height: 0;
  padding: 14px 16px 20px;
  overflow-y: auto;
}

.empty-state,
.panel-note,
.panel-error {
  margin: 0;
  color: #a7adbb;
  font-size: 13px;
}

.panel-error {
  color: #ff7a8a;
}

.chat-row {
  display: grid;
  grid-template-columns: 22px 20px minmax(0, 1fr);
  align-items: start;
  gap: 6px;
  margin-bottom: 9px;
  font-size: 15px;
  line-height: 1.35;
}

.emote-strip button {
  display: grid;
  place-items: center;
  border: 0;
  color: inherit;
  background: transparent;
  cursor: pointer;
}

.icon-button {
  width: 22px;
  height: 22px;
  padding: 0;
  color: #c8cedb;
}

.platform-icon {
  width: 17px;
  height: 17px;
  margin-top: 2px;
  color: #ff4658;
}

.chat-message {
  min-width: 0;
  overflow-wrap: anywhere;
}

.chat-name {
  margin-right: 4px;
  color: #34a5ff;
  font-weight: 800;
}

.deleted .chat-message {
  color: #d7dbea;
}

.reveal-button {
  display: block;
  margin-top: 4px;
  padding: 0;
  border: 0;
  color: #b87cff;
  background: transparent;
  font: inherit;
  cursor: pointer;
}

.composer {
  display: grid;
  gap: 8px;
  padding: 10px 12px 12px;
  border-top: 1px solid rgb(255 255 255 / 0.08);
  background: #191b24;
}

.emote-strip {
  display: flex;
  gap: 5px;
  min-height: 32px;
  overflow-x: auto;
}

.emote-strip button {
  width: 30px;
  height: 30px;
  flex: 0 0 auto;
  border-radius: 7px;
  background: rgb(255 255 255 / 0.06);
}

.emote-strip img {
  max-width: 24px;
  max-height: 24px;
}

.composer-row {
  display: grid;
  grid-template-columns: 104px minmax(0, 1fr) 42px;
  gap: 8px;
}

select,
select {
  min-width: 0;
  height: 42px;
  border: 1px solid rgb(255 255 255 / 0.12);
  border-radius: 8px;
  color: #f5f7fb;
  background: #11131a;
  font: inherit;
}

select {
  padding: 0 10px;
  text-transform: capitalize;
}
</style>
