<script setup lang="ts">
import type { ChatMessage, Settings } from '#shared/types'
import { widgetTexts } from '#shared/widgets'

const props = defineProps<{ settings: Settings, bus: EventBus }>()

const seen = useWidgetState<Record<string, true>>('first-seen', () => ({}))
const { current, push, next } = useDisplayQueue<ChatMessage>(
  () => props.settings.holdTime * 1000 + props.settings.animDuration,
  () => playSound(props.settings.sound, props.settings.volume)
)

useBusEvents(props.bus, (event) => {
  if (event.kind === 'command' && event.name === 'reset') seen.value = {}
  if (event.kind !== 'chat') return
  if ((props.settings.ignoredUsers as string[]).some(name => name.toLowerCase() === event.name.toLowerCase())) return

  const key = `${event.platform}:${event.userId || event.name}`
  const firstInSession = !seen.value[key]
  seen.value[key] = true

  const isFirst = props.settings.firstMode === 'firstEver' && event.platform === 'twitch' ? event.firstMessage : firstInSession
  if (isFirst) push(event)
})
</script>

<template>
  <div class="first">
    <Transition :enter-active-class="`anim-in-${settings.animIn}`" :leave-active-class="`anim-out-${settings.animOut}`" @after-leave="next">
      <div v-if="current" :key="current.id" class="first-card">
        <div class="first-head">
          <UIcon name="i-lucide-hand" class="first-icon" />
          <span class="first-name" :style="{ color: current.color }">{{ current.name }}</span>
          <span class="first-welcome">{{ settings.welcomeText || widgetTexts(settings.language).first.welcome }}</span>
        </div>
        <WidgetParts v-if="settings.showMessage" :parts="current.parts" class="first-text" />
      </div>
    </Transition>
  </div>
</template>

<style>
@layer widget {
  .first {
    display: flex;
    align-items: center;
    height: 100%;
    padding: 12px;
  }

  .first-card {
    width: 100%;
    padding: 0.9em 1.2em;
    border-left: 6px solid var(--accent);
    border-radius: var(--radius);
    background: var(--bg);
    font-size: var(--font-size);
    color: var(--text);
  }

  .first-head {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.4em;
  }

  .first-icon {
    color: var(--accent);
    animation: first-wave 1s ease-in-out 2;
    transform-origin: 70% 70%;
  }

  .first-name {
    font-weight: 900;
  }

  .first-welcome {
    font-weight: 600;
    color: var(--accent);
  }

  .first-text {
    display: block;
    margin-top: 0.35em;
    font-size: 0.85em;
    line-height: 1.45;
    opacity: 0.9;
  }

  @keyframes first-wave {
    0%, 100% { rotate: 0deg; }
    25% { rotate: 18deg; }
    75% { rotate: -12deg; }
  }
}
</style>
