<script setup lang="ts">
import type { ChatMessage, Settings } from '#shared/types'

const props = defineProps<{ settings: Settings, bus: EventBus }>()

const { current, push, next } = useDisplayQueue<ChatMessage>(
  () => props.settings.holdTime * 1000 + props.settings.animDuration,
  () => playSound(props.settings.sound, props.settings.volume)
)

function stripCommand(message: ChatMessage, command: string): ChatMessage {
  const [first, ...rest] = message.parts
  if (first?.type !== 'text') return message
  const text = first.text.trimStart().slice(command.length).trimStart()
  return { ...message, text: message.text.trim().slice(command.length).trim(), parts: text ? [{ type: 'text', text }, ...rest] : rest }
}

useBusEvents(props.bus, (event) => {
  if (event.kind !== 'chat') return
  const s = props.settings
  const command = String(s.spotlightCommand).trim()

  if (s.onHighlighted && event.highlighted) return push(event)
  if (s.onBits && (event.bits ?? 0) >= s.minBits) return push(event)
  if (command && event.text.trim().toLowerCase().startsWith(`${command.toLowerCase()} `) && hasPermission(event.roles, s.commandPermission)) {
    push(stripCommand(event, command))
  }
})
</script>

<template>
  <div class="spotlight">
    <Transition :enter-active-class="`anim-in-${settings.animIn}`" :leave-active-class="`anim-out-${settings.animOut}`" @after-leave="next">
      <div v-if="current" :key="current.id" class="spotlight-card">
        <div class="spotlight-head">
          <template v-if="settings.showBadges">
            <template v-for="(badge, i) in current.badges" :key="i">
              <img v-if="badge.url" :src="badge.url" class="spotlight-badge" alt="">
              <UIcon v-else-if="badge.icon" :name="badge.icon" class="spotlight-badge" :style="{ color: badge.color }" />
            </template>
          </template>
          <span class="spotlight-name">{{ current.name }}</span>
          <span v-if="current.bits" class="spotlight-bits">
            <UIcon name="i-lucide-gem" /> {{ current.bits }}
          </span>
        </div>
        <WidgetParts :parts="current.parts" class="spotlight-text" />
      </div>
    </Transition>
  </div>
</template>

<style>
@layer widget {
  .spotlight {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100%;
    padding: 16px;
  }

  .spotlight-card {
    max-width: 100%;
    padding: 1em 1.4em;
    border: 3px solid var(--accent);
    border-radius: var(--radius);
    background: var(--bg);
    box-shadow: 0 0 2em color-mix(in srgb, var(--accent) 40%, transparent);
    font-size: var(--font-size);
    color: var(--text);
    text-align: center;
  }

  .spotlight-head {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.4em;
    margin-bottom: 0.3em;
    font-size: 0.7em;
  }

  .spotlight-badge {
    width: 1.2em;
    height: 1.2em;
  }

  .spotlight-name {
    font-weight: 900;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--accent);
  }

  .spotlight-bits {
    display: inline-flex;
    align-items: center;
    gap: 0.2em;
    padding: 0.1em 0.5em;
    border-radius: 999px;
    background: color-mix(in srgb, var(--accent) 25%, transparent);
    font-weight: 700;
  }

  .spotlight-text {
    display: block;
    font-weight: 700;
    line-height: 1.35;
  }
}
</style>
