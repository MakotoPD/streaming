<script setup lang="ts">
import type { AlertEvent, Settings } from '#shared/types'

const props = defineProps<{ settings: Settings, bus: EventBus }>()

type Effect = 'fall' | 'rise' | 'fly' | 'burst' | 'fountain' | 'pop'

interface Drop {
  id: number
  url: string
  effect: Effect
  style: Record<string, string | number>
}

const EFFECTS: Effect[] = ['fall', 'rise', 'fly', 'burst', 'fountain', 'pop']
const FALLBACK = 'https://static-cdn.jtvnw.net/emoticons/v2/425618/default/dark/2.0'

const context = useWidgetContext()
const drops = ref<Drop[]>([])
const recent: string[] = []
let nextId = 0

const random = (min: number, max: number) => min + Math.random() * (max - min)

function resolveEffect(mode: string): Effect {
  return mode === 'random' ? EFFECTS[Math.floor(Math.random() * EFFECTS.length)]! : mode as Effect
}

function spawn(mode: string, urls: string[], count: number) {
  if (!urls.length) return
  const effect = resolveEffect(mode)
  const room = Math.max(0, props.settings.maxEmotes - drops.value.length)
  const spread = props.settings.spread / 100
  const duration = props.settings.rainDuration
  const originX = random(10, 90)
  const originY = random(15, 85)

  for (let i = 0; i < Math.min(count, room); i++) {
    const angle = Math.random() * Math.PI * 2
    const distance = random(0.3, 1) * spread * 100
    const style: Record<string, string | number> = {
      '--scale': random(0.75, 1.25),
      '--delay': `${random(0, effect === 'burst' || effect === 'pop' ? 0.08 : 0.5)}s`
    }

    if (effect === 'burst') {
      Object.assign(style, { '--x': `${originX}%`, '--y': `${originY}%`, '--dx': `${Math.cos(angle) * distance}vmin`, '--dy': `${Math.sin(angle) * distance}vmin`, '--duration': `${Math.min(3, Math.max(0.8, duration * 0.35))}s` })
    }
    else if (effect === 'fountain') {
      Object.assign(style, { '--x': `${originX}%`, '--dx': `${random(-1, 1) * spread * 60}vw`, '--dy': `${random(45, 90)}vh`, '--duration': `${Math.max(1.2, duration * 0.6)}s` })
    }
    else if (effect === 'pop') {
      Object.assign(style, { '--x': `${random(5, 95)}%`, '--y': `${random(10, 90)}%`, '--duration': `${Math.min(2.5, Math.max(0.8, duration * 0.3))}s` })
    }
    else if (effect === 'fly') {
      Object.assign(style, { '--y': `${random(5, 90)}%`, '--dx': `${random(-1, 1) * 15}vh`, '--duration': `${duration * random(0.8, 1.2)}s` })
    }
    else {
      Object.assign(style, { '--x': `${random(3, 95)}%`, '--dx': `${random(-1, 1) * 10}vw`, '--duration': `${duration * random(0.8, 1.2)}s` })
    }

    drops.value.push({ id: nextId++, url: urls[i % urls.length]!, effect, style })
  }
}

function remember(urls: string[]) {
  for (const url of urls) {
    if (!recent.includes(url)) recent.unshift(url)
  }
  recent.length = Math.min(recent.length, 30)
}

function alertEmotes(count: number) {
  const store = context?.emotes.value
  const named = (props.settings.alertEmotes as string[])
    .map(name => store?.lookup(name)?.url)
    .filter((url): url is string => !!url)
  if (named.length) return named
  const channel = store?.sample(Math.min(count, 12)).map(emote => emote.url) ?? []
  if (channel.length) return channel
  return recent.length ? recent : [FALLBACK]
}

function amountFor(event: AlertEvent) {
  const base = props.settings.alertAmount
  if (!props.settings.scaleWithAmount) return base
  const factor = event.type === 'bits' ? (event.count ?? 0) / 100 : event.type === 'raid' ? (event.count ?? 0) / 10 : event.type === 'gifts' ? event.count ?? 1 : 1
  return Math.round(base * Math.min(10, Math.max(1, factor)))
}

useBusEvents(props.bus, (event) => {
  const triggers = props.settings.triggers as string[]

  if (event.kind === 'chat') {
    const urls = event.parts.flatMap(part => (part.type === 'emote' ? [part.url] : []))
    if (!urls.length) return
    remember(urls)
    if (!triggers.includes('chat')) return
    if ((props.settings.ignoredUsers as string[]).some(name => name.toLowerCase() === event.name.toLowerCase())) return
    const effect = props.settings.rainMode
    const count = effect === 'burst' || effect === 'fountain' ? props.settings.burstSize : Math.min(props.settings.perMessage, urls.length)
    spawn(effect, urls, count)
  }
  else if (event.kind === 'alert' && triggers.includes(event.type)) {
    const count = amountFor(event)
    spawn(props.settings.alertMode, alertEmotes(count), count)
  }
})

function remove(id: number) {
  drops.value = drops.value.filter(drop => drop.id !== id)
}
</script>

<template>
  <div class="emote-rain" :class="{ 'emote-rain-spin': settings.spin, 'emote-rain-sway': settings.sway }">
    <div
      v-for="drop in drops"
      :key="drop.id"
      class="emote-drop"
      :class="`emote-drop-${drop.effect}`"
      :style="drop.style"
      @animationend.self="remove(drop.id)"
    >
      <img :src="drop.url" alt="">
    </div>
  </div>
</template>

<style>
@layer widget {
  .emote-rain {
    position: absolute;
    inset: 0;
    overflow: hidden;
  }

  .emote-drop {
    position: absolute;
    top: 0;
    left: 0;
    animation-duration: var(--duration);
    animation-delay: var(--delay);
    animation-fill-mode: both;
    animation-timing-function: linear;
    will-change: transform, opacity;
  }

  .emote-drop img {
    display: block;
    height: var(--emote-size);
    width: auto;
    opacity: var(--opacity);
    scale: var(--scale);
  }

  .emote-rain-sway .emote-drop-fall img,
  .emote-rain-sway .emote-drop-rise img,
  .emote-rain-sway .emote-drop-fly img {
    animation: emote-sway 1.6s ease-in-out infinite alternate;
  }

  .emote-rain-spin .emote-drop img {
    animation: emote-spin 2.4s linear infinite;
  }

  .emote-drop-fall { left: var(--x); animation-name: emote-fall; }
  .emote-drop-rise { left: var(--x); animation-name: emote-rise; }
  .emote-drop-fly { top: var(--y); animation-name: emote-fly; }
  .emote-drop-burst { left: var(--x); top: var(--y); animation-name: emote-burst; animation-timing-function: cubic-bezier(0.1, 0.8, 0.3, 1); }
  .emote-drop-fountain { left: var(--x); top: 100%; animation-name: emote-fountain; }
  .emote-drop-pop { left: var(--x); top: var(--y); animation-name: emote-pop; animation-timing-function: ease-out; }

  @keyframes emote-fall {
    from { transform: translate3d(0, -20vh, 0); }
    to { transform: translate3d(var(--dx), 110vh, 0); }
  }

  @keyframes emote-rise {
    from { transform: translate3d(0, 110vh, 0); }
    to { transform: translate3d(var(--dx), -20vh, 0); }
  }

  @keyframes emote-fly {
    from { transform: translate3d(-15vw, 0, 0); }
    to { transform: translate3d(110vw, var(--dx), 0); }
  }

  @keyframes emote-burst {
    0% { opacity: 1; transform: translate3d(-50%, -50%, 0) scale(0.2); }
    70% { opacity: 1; }
    100% { opacity: 0; transform: translate3d(calc(-50% + var(--dx)), calc(-50% + var(--dy)), 0) scale(1); }
  }

  @keyframes emote-fountain {
    0% { transform: translate3d(-50%, 0, 0); animation-timing-function: cubic-bezier(0.2, 0.7, 0.4, 1); }
    45% { transform: translate3d(calc(-50% + var(--dx) * 0.5), calc(var(--dy) * -1), 0); animation-timing-function: cubic-bezier(0.6, 0, 0.8, 0.3); }
    100% { transform: translate3d(calc(-50% + var(--dx)), 20vh, 0); }
  }

  @keyframes emote-pop {
    0% { opacity: 0; transform: translate3d(-50%, -50%, 0) scale(0); }
    30% { opacity: 1; transform: translate3d(-50%, -50%, 0) scale(1.35); }
    55% { transform: translate3d(-50%, -50%, 0) scale(1); }
    100% { opacity: 0; transform: translate3d(-50%, calc(-50% - 40px), 0) scale(0.9); }
  }

  @keyframes emote-sway {
    from { translate: -12px 0; }
    to { translate: 12px 0; }
  }

  @keyframes emote-spin {
    to { rotate: 360deg; }
  }
}
</style>
