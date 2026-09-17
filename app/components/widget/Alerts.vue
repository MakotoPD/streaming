<script setup lang="ts">
import type { AlertType, Settings, StreamEvent } from '#shared/types'
import { widgetTexts } from '#shared/widgets'

const props = defineProps<{ settings: Settings, bus: EventBus }>()

type Alert = StreamEvent & { kind: 'alert' } & { key: number }

const ICONS: Record<AlertType, string> = {
  follow: 'i-lucide-heart',
  sub: 'i-lucide-star',
  gifts: 'i-lucide-gift',
  raid: 'i-lucide-users',
  bits: 'i-lucide-gem'
}

const queue: Alert[] = []
const current = ref<Alert>()
let key = 0
let holdTimer: ReturnType<typeof setTimeout> | undefined

const texts = computed(() => widgetTexts(props.settings.language).alerts)

const name = computed(() => {
  const alert = current.value
  if (!alert) return ''
  if (alert.anonymous) return texts.value.anonymous
  return alert.name || texts.value.someone
})

const message = computed(() => {
  const alert = current.value
  if (!alert) return ''
  const s = props.settings
  const resub = alert.type === 'sub' && (alert.months ?? 1) > 1
  const template = resub
    ? s['sub.textResub'] || texts.value.resub
    : s[`${alert.type}.text`] || texts.value[alert.type]
  return fillTemplate(template, {
    name: name.value,
    months: alert.months,
    count: alert.count,
    tier: alert.tier && alert.tier > 1 ? ` (Tier ${alert.tier})` : ''
  }, s.language)
})

function playSound(type: AlertType) {
  const url = props.settings[`${type}.sound`]
  if (!url) return
  const audio = new Audio(url)
  audio.volume = props.settings.volume / 100
  audio.play().catch(err => console.warn('[alerts] audio', err))
}

function next() {
  if (current.value) return
  const alert = queue.shift()
  if (!alert) return
  current.value = alert
  playSound(alert.type)
  holdTimer = setTimeout(() => {
    current.value = undefined
  }, props.settings.holdTime * 1000 + props.settings.animDuration)
}

useBusEvents(props.bus, (event) => {
  if (event.kind !== 'alert') return
  const s = props.settings
  if (!s[`${event.type}.enabled`]) return
  if ((event.type === 'bits' || event.type === 'raid') && (event.count ?? 0) < s[`${event.type}.min`]) return
  queue.push({ ...event, key: ++key })
  next()
})

onBeforeUnmount(() => clearTimeout(holdTimer))
</script>

<template>
  <div class="alerts" :class="`alerts-${settings.position}`">
    <Transition
      :enter-active-class="`anim-in-${settings.animIn}`"
      :leave-active-class="`anim-out-${settings.animOut}`"
      @after-leave="next"
    >
      <div
        v-if="current"
        :key="current.key"
        class="alert"
        :class="[`alert-${current.type}`, { 'alert-glow': settings.glow }]"
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
