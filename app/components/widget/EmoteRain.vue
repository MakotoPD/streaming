<script setup lang="ts">
import type { Settings } from '#shared/types'

const props = defineProps<{ settings: Settings, bus: EventBus }>()

interface Drop {
  id: number
  url: string
  left: number
  duration: number
  delay: number
  scale: number
  drift: number
}

const drops = ref<Drop[]>([])
let nextId = 0

useBusEvents(props.bus, (event) => {
  if (event.kind !== 'chat') return
  const ignored = (props.settings.ignoredUsers as string[]).map(name => name.toLowerCase())
  if (ignored.includes(event.name.toLowerCase())) return

  const emotes = event.parts.filter(part => part.type === 'emote').slice(0, props.settings.perMessage)
  const room = props.settings.maxEmotes - drops.value.length
  for (const emote of emotes.slice(0, Math.max(0, room))) {
    drops.value.push({
      id: nextId++,
      url: emote.url,
      left: Math.random() * 92 + 4,
      duration: props.settings.rainDuration * (0.8 + Math.random() * 0.4),
      delay: Math.random() * 0.4,
      scale: 0.75 + Math.random() * 0.5,
      drift: (Math.random() - 0.5) * 20
    })
  }
})

function remove(id: number) {
  drops.value = drops.value.filter(drop => drop.id !== id)
}
</script>

<template>
  <div class="emote-rain" :class="[`emote-rain-${settings.rainMode}`, { 'emote-rain-spin': settings.spin, 'emote-rain-sway': settings.sway }]">
    <div
      v-for="drop in drops"
      :key="drop.id"
      class="emote-drop"
      :style="{
        '--left': `${drop.left}%`,
        '--duration': `${drop.duration}s`,
        '--delay': `${drop.delay}s`,
        '--scale': drop.scale,
        '--drift': `${drop.drift}vw`
      }"
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
    left: var(--left);
    top: 0;
    animation: emote-fall var(--duration) var(--delay) linear both;
    will-change: transform;
  }

  .emote-rain-rise .emote-drop {
    animation-name: emote-rise;
  }

  .emote-rain-fly .emote-drop {
    top: var(--left);
    left: 0;
    animation-name: emote-fly;
  }

  .emote-drop img {
    display: block;
    height: var(--emote-size);
    width: auto;
    opacity: var(--opacity);
    scale: var(--scale);
  }

  .emote-rain-sway .emote-drop img {
    animation: emote-sway 1.6s ease-in-out infinite alternate;
  }

  .emote-rain-spin .emote-drop img {
    animation: emote-spin 2.4s linear infinite;
  }

  @keyframes emote-fall {
    from { transform: translate3d(0, -20vh, 0); }
    to { transform: translate3d(var(--drift), 110vh, 0); }
  }

  @keyframes emote-rise {
    from { transform: translate3d(0, 110vh, 0); }
    to { transform: translate3d(var(--drift), -20vh, 0); }
  }

  @keyframes emote-fly {
    from { transform: translate3d(-15vw, 0, 0); }
    to { transform: translate3d(110vw, var(--drift), 0); }
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
