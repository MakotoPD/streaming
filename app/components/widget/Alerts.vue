<script setup lang="ts">
import type { AlertEvent, AlertType, Settings } from '#shared/types'
import { pickVariant, widgetTexts } from '#shared/widgets'

const props = defineProps<{ settings: Settings, bus: EventBus }>()

type Alert = AlertEvent & { key: number }

const ICONS: Record<AlertType, string> = {
  follow: 'i-lucide-heart',
  sub: 'i-lucide-star',
  gifts: 'i-lucide-gift',
  raid: 'i-lucide-users',
  bits: 'i-lucide-gem',
  donation: 'i-lucide-banknote'
}

const context = useWidgetContext()
const queue: Alert[] = []
const current = ref<Alert>()
let key = 0
let run = 0
let playing: HTMLAudioElement | undefined
let wake: (() => void) | undefined

const texts = computed(() => widgetTexts(props.settings.language).alerts)

function moderate(text: string) {
  const s = props.settings
  return filterText(text, { slurs: s['moderation.slurs'], links: s['moderation.links'], banned: s['moderation.words'] })
}

function variantFor(alert: Alert) {
  return pickVariant(props.settings[`${alert.type}.variants`], alert)
}

function displayName(alert: Alert) {
  if (alert.anonymous) return texts.value.anonymous
  return alert.name ? moderate(alert.name).text : texts.value.someone
}

function headline(alert: Alert) {
  const s = props.settings
  const resub = alert.type === 'sub' && (alert.months ?? 1) > 1
  const template = variantFor(alert)?.text || (resub ? s['sub.textResub'] || texts.value.resub : s[`${alert.type}.text`] || texts.value[alert.type])
  return fillTemplate(template, {
    name: displayName(alert),
    months: alert.months,
    count: alert.count,
    amount: alert.amount === undefined ? undefined : formatMoney(alert.amount, alert.currency, s.language),
    tier: alert.tier && alert.tier > 1 ? ` (Tier ${alert.tier})` : ''
  }, s.language)
}

const variant = computed(() => (current.value ? variantFor(current.value) : undefined))
const image = computed(() => (current.value ? variant.value?.image || props.settings[`${current.value.type}.image`] : ''))
const name = computed(() => (current.value ? displayName(current.value) : ''))
const message = computed(() => (current.value ? headline(current.value) : ''))

const userMessage = computed(() => {
  const alert = current.value
  if (!alert?.message) return undefined
  if (alert.type === 'donation' && !props.settings['donation.showMessage']) return undefined
  const result = moderate(alert.message)
  if (result.flagged && props.settings['moderation.action'] === 'skip') return undefined
  return result.text
})

function play(url: string, volume: number, token: number) {
  return new Promise<void>((resolve) => {
    if (!url || token !== run) return resolve()
    const audio = new Audio(url)
    audio.volume = Math.min(1, Math.max(0, volume / 100))
    playing = audio
    const done = () => {
      if (playing === audio) playing = undefined
      resolve()
    }
    audio.onended = done
    audio.onerror = done
    audio.play().catch(done)
  })
}

function wait(ms: number) {
  return new Promise<void>((resolve) => {
    const timer = setTimeout(resolve, ms)
    wake = () => {
      clearTimeout(timer)
      resolve()
    }
  })
}

function wantsSpeech(alert: Alert) {
  const s = props.settings
  if (!s['tts.enabled'] || !(s['tts.types'] as string[]).includes(alert.type)) return false
  if (alert.type === 'donation') return (alert.amount ?? 0) >= s['tts.minAmount']
  if (alert.type === 'bits') return (alert.count ?? 0) >= s['tts.minBits']
  return false
}

async function speech(alert: Alert): Promise<string[]> {
  const s = props.settings
  if (!wantsSpeech(alert)) return []
  const flagged = alert.message ? moderate(alert.message).flagged : false
  if (flagged && s['moderation.action'] === 'skip') return []
  if (s['tts.source'] === 'service' && alert.audio?.length && !flagged) return alert.audio

  const spoken = alert.message ? speakable(moderate(alert.message).text) : ''
  const text = [s['tts.readName'] ? headline(alert) : '', spoken].filter(Boolean).join(' ')
  if (!text || !context) return []
  try {
    const blob = await $fetch<Blob>(`/api/o/${context.token}/tts`, {
      method: 'POST',
      body: { text: text.slice(0, 400), voice: s['tts.voice'], speed: s['tts.speed'] },
      responseType: 'blob'
    })
    return [URL.createObjectURL(blob)]
  }
  catch (err) {
    console.warn('[alerts] tts', err)
    return []
  }
}

async function present(alert: Alert) {
  const token = ++run
  const s = props.settings
  const started = Date.now()
  const clips = speech(alert)
  await play(variantFor(alert)?.sound || s[`${alert.type}.sound`], s.volume, token)
  for (const url of await clips) {
    await play(url, s['tts.volume'], token)
    if (url.startsWith('blob:')) URL.revokeObjectURL(url)
  }
  if (token !== run) return
  await wait(Math.max(s.holdTime * 1000 + s.animDuration - (Date.now() - started), 600))
  if (token === run) current.value = undefined
}

function next() {
  if (current.value) return
  const alert = queue.shift()
  if (!alert) return
  current.value = alert
  present(alert)
}

function skip() {
  run++
  playing?.pause()
  playing = undefined
  wake?.()
  current.value = undefined
}

useBusEvents(props.bus, (event) => {
  if (event.kind === 'command' && event.name === 'skip') return skip()
  if (event.kind !== 'alert') return
  const s = props.settings
  if (!s[`${event.type}.enabled`]) return
  if ((event.type === 'bits' || event.type === 'raid') && (event.count ?? 0) < s[`${event.type}.min`]) return
  if (event.type === 'donation' && (event.amount ?? 0) < s['donation.min']) return
  queue.push({ ...event, key: ++key })
  next()
})

onBeforeUnmount(skip)
</script>

<template>
  <div class="alerts" :class="`alerts-${settings.position}`">
    <Transition
      :enter-active-class="`anim-in-${settings.animIn}`"
      :leave-active-class="`anim-out-${settings.animOut}`"
      @after-leave="next"
    >
      <div
        v-if="current && settings.alertLayout === 'image'"
        :key="`image-${current.key}`"
        class="alert alert-image-layout"
        :class="[`alert-${current.type}`, { 'alert-glow': settings.glow, 'alert-variant': variant }]"
        :data-variant="variant?.name || undefined"
        :style="variant?.color ? { '--c': variant.color } : undefined"
      >
        <div v-if="image" class="alert-image">
          <img :src="image" alt="">
        </div>
        <div class="alert-text">
          <div class="alert-name">
            {{ name }}
          </div>
          <div class="alert-message">
            {{ message }}
          </div>
          <div v-if="userMessage" class="alert-donation-message">
            {{ userMessage }}
          </div>
        </div>
      </div>
      <div
        v-else-if="current"
        :key="current.key"
        class="alert"
        :class="[`alert-${current.type}`, { 'alert-glow': settings.glow, 'alert-variant': variant }]"
        :data-variant="variant?.name || undefined"
        :style="variant?.color ? { '--c': variant.color } : undefined"
      >
        <div v-if="settings.glow" class="alert-burst" />
        <div v-if="settings.showIcon" class="alert-icon">
          <UIcon :name="ICONS[current.type]" />
        </div>
        <div class="alert-text">
          <div class="alert-name">
            {{ name }}
          </div>
          <div class="alert-message">
            {{ message }}
          </div>
          <div v-if="userMessage" class="alert-donation-message">
            {{ userMessage }}
          </div>
        </div>
        <div v-if="settings.shine" class="alert-shine" />
      </div>
    </Transition>
  </div>
</template>

<style>
@layer widget {
  .alerts {
    display: flex;
    justify-content: center;
    height: 100%;
    padding: 2%;
    font-size: var(--font-size);
  }

  .alerts-top { align-items: flex-start; }
  .alerts-center { align-items: center; }
  .alerts-bottom { align-items: flex-end; }

  .alert-follow { --c: var(--c-follow); }
  .alert-sub { --c: var(--c-sub); }
  .alert-gifts { --c: var(--c-gifts); }
  .alert-raid { --c: var(--c-raid); }
  .alert-bits { --c: var(--c-bits); }
  .alert-donation { --c: var(--c-donation); }

  .alert-donation-message {
    margin-top: 0.35em;
    font-size: 0.8em;
    opacity: 0.85;
    overflow-wrap: anywhere;
  }

  .alert {
    position: relative;
    display: flex;
    align-items: center;
    gap: 0.9em;
    max-width: 100%;
    padding: 1em 1.6em;
    overflow: hidden;
    border: 1px solid color-mix(in srgb, var(--c) 55%, transparent);
    border-radius: var(--radius);
    background:
      linear-gradient(135deg, color-mix(in srgb, var(--c) 22%, transparent), transparent 55%),
      var(--bg);
    color: var(--text);
    backdrop-filter: blur(14px) saturate(1.3);
  }

  .alert-image-layout {
    flex-direction: column;
    gap: 0.4em;
    padding: 0.8em 1.2em;
    border: 0;
    text-align: center;
    background: var(--bg);
    backdrop-filter: none;
    overflow: visible;
  }

  .alert-image-layout.alert-glow {
    box-shadow: none;
  }

  .alert-image-layout .alert-name,
  .alert-image-layout .alert-message {
    white-space: normal;
    text-shadow: 0 2px 6px rgb(0 0 0 / 0.8), 0 0 0.8em color-mix(in srgb, var(--c) 60%, transparent);
  }

  .alert-image-layout .alert-message {
    font-size: 0.9em;
    font-weight: 700;
    color: var(--text);
  }

  .alert-image img {
    display: block;
    width: auto;
    max-width: 100%;
    max-height: var(--image-size);
    margin: 0 auto;
    object-fit: contain;
  }

  .alert-glow {
    box-shadow:
      0 0 0 1px rgb(255 255 255 / 0.05) inset,
      0 0.6em 2em rgb(0 0 0 / 0.45),
      0 0 2.2em color-mix(in srgb, var(--c) 45%, transparent);
  }

  .alert-burst {
    position: absolute;
    inset: 0;
    width: 8em;
    height: 8em;
    margin: auto;
    border-radius: 50%;
    background: radial-gradient(circle, color-mix(in srgb, var(--c) 60%, transparent), transparent 65%);
    animation: alert-burst 0.9s ease-out both;
  }

  .alert-shine {
    position: absolute;
    top: 0;
    left: -60%;
    width: 40%;
    height: 100%;
    background: linear-gradient(100deg, transparent, color-mix(in srgb, var(--c) 35%, #fff 25%), transparent);
    opacity: 0.55;
    animation: alert-sweep 1.4s 0.35s ease-in-out both;
  }

  .alert-icon {
    display: grid;
    flex: 0 0 auto;
    place-items: center;
    width: 2.4em;
    height: 2.4em;
    border-radius: 50%;
    font-size: 1.15em;
    color: #fff;
    background: radial-gradient(circle at 35% 30%, color-mix(in srgb, var(--c) 85%, #fff 20%), color-mix(in srgb, var(--c) 60%, #000 25%));
    box-shadow: 0 0 1.4em color-mix(in srgb, var(--c) 70%, transparent);
    animation: alert-icon-pop 0.7s 0.1s cubic-bezier(0.16, 1.4, 0.3, 1) both;
  }

  .alert-icon > span {
    width: 1.25em;
    height: 1.25em;
  }

  .alert-text {
    min-width: 0;
  }

  .alert-name {
    overflow: hidden;
    font-size: 1.25em;
    font-weight: 800;
    line-height: 1.15;
    letter-spacing: -0.01em;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .alert-glow .alert-name {
    text-shadow: 0 0 0.7em color-mix(in srgb, var(--c) 80%, transparent);
  }

  .alert-message {
    overflow: hidden;
    font-size: 0.85em;
    font-weight: 500;
    line-height: 1.25;
    text-overflow: ellipsis;
    white-space: nowrap;
    color: color-mix(in srgb, var(--c) 45%, var(--text));
  }

  @keyframes alert-sweep { to { transform: translateX(420%); } }
  @keyframes alert-burst {
    0% { opacity: 0.85; transform: scale(0.3); }
    100% { opacity: 0; transform: scale(2.6); }
  }
  @keyframes alert-icon-pop {
    0% { transform: scale(0) rotate(-45deg); }
    60% { transform: scale(1.22) rotate(10deg); }
    100% { transform: scale(1) rotate(0); }
  }
}
</style>
