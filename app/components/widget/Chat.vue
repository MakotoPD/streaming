<script setup lang="ts">
import type { Settings, StreamEvent } from '#shared/types'

const props = defineProps<{ settings: Settings, bus: EventBus }>()

type Message = StreamEvent & { kind: 'chat' }

const messages = ref<Message[]>([])
const timers = new Map<string, ReturnType<typeof setTimeout>>()

const ordered = computed(() => (props.settings.direction === 'top' ? [...messages.value].reverse() : messages.value))
const ignored = computed(() => new Set((props.settings.ignoredUsers as string[]).map(name => name.toLowerCase())))

function remove(predicate: (message: Message) => boolean) {
  messages.value = messages.value.filter((message) => {
    if (!predicate(message)) return true
    clearTimeout(timers.get(message.id))
    timers.delete(message.id)
    return false
  })
}

useBusEvents(props.bus, (event) => {
  if (event.kind === 'chat') {
    if (props.settings.hideCommands && event.text.startsWith('!')) return
    if (ignored.value.has(event.name.toLowerCase())) return
    messages.value.push(event)
    const oldest = new Set(messages.value.slice(0, -props.settings.maxMessages).map(message => message.id))
    if (oldest.size) remove(message => oldest.has(message.id))
    if (props.settings.hideAfter > 0) {
      timers.set(event.id, setTimeout(() => remove(message => message.id === event.id), props.settings.hideAfter * 1000))
    }
  }
  else if (event.kind === 'delete') {
    remove(message => message.platform === event.platform && message.id === event.id)
  }
  else if (event.kind === 'clear') {
    remove(message => message.platform === event.platform && (!event.userId || message.userId === event.userId))
  }
})

onBeforeUnmount(() => timers.forEach(clearTimeout))

function nameColor(message: Message) {
  return props.settings.nameColor === 'user' && message.color ? message.color : 'var(--name-color)'
}
</script>

<template>
  <TransitionGroup
    tag="div"
    class="chat"
    :class="`chat-${settings.direction}`"
    :enter-active-class="`anim-in-${settings.animIn}`"
    :leave-active-class="`anim-out-${settings.animOut}`"
  >
    <div v-for="message in ordered" :key="`${message.platform}-${message.id}`" class="chat-message" :data-platform="message.platform">
      <UIcon v-if="settings.showPlatform" :name="`i-simple-icons-${message.platform}`" class="chat-badge chat-platform" />
      <template v-if="settings.showBadges">
        <template v-for="(badge, i) in message.badges" :key="i">
          <img v-if="badge.url" :src="badge.url" class="chat-badge" alt="">
          <UIcon v-else-if="badge.icon" :name="badge.icon" class="chat-badge" :style="{ color: badge.color }" />
        </template>
      </template>
      <span class="chat-name" :style="{ color: nameColor(message) }">{{ message.name }}:</span>
      <WidgetParts :parts="message.parts" class="chat-text" />
    </div>
  </TransitionGroup>
</template>

<style>
.chat {
  display: flex;
  flex-direction: column;
  gap: var(--gap);
  height: 100%;
  padding: 12px;
  font-size: var(--font-size);
  overflow: hidden;
}

.chat-bottom {
  justify-content: flex-end;
}

.chat-top {
  justify-content: flex-start;
}

.chat-message {
  display: block;
  flex-shrink: 0;
  padding: 0.6em 0.9em;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  background: var(--bg);
  backdrop-filter: blur(var(--blur));
  color: var(--text);
  line-height: 1.5;
  word-break: break-word;
}

.chat-badge {
  display: inline-block;
  width: 1.15em;
  height: 1.15em;
  margin-right: 0.25em;
  vertical-align: -0.2em;
  border-radius: 3px;
}

.chat-platform {
  color: var(--text);
  opacity: 0.7;
}

.chat-name {
  margin-right: 0.35em;
  font-weight: 700;
}
</style>
