<script setup lang="ts">
import type { ChatMessage, Settings } from '#shared/types'
import { widgetTexts } from '#shared/widgets'

const props = defineProps<{ settings: Settings, bus: EventBus }>()

const message = useWidgetState<ChatMessage | null>('pinned', () => null)
let hideTimer: ReturnType<typeof setTimeout> | undefined

function scheduleHide() {
  clearTimeout(hideTimer)
  if (message.value && props.settings.autoHide > 0) {
    hideTimer = setTimeout(() => {
      message.value = null
    }, props.settings.autoHide * 1000)
  }
}

onMounted(scheduleHide)
onBeforeUnmount(() => clearTimeout(hideTimer))

useBusEvents(props.bus, (event) => {
  if (event.kind === 'command' && event.name === 'pin' && event.payload?.kind === 'chat') {
    message.value = event.payload
    scheduleHide()
  }
  else if (event.kind === 'command' && event.name === 'unpin') {
    message.value = null
  }
  else if (event.kind === 'delete' && message.value?.id === event.id) {
    message.value = null
  }
})
</script>

<template>
  <div class="pinned">
    <Transition :enter-active-class="`anim-in-${settings.animIn}`" :leave-active-class="`anim-out-${settings.animOut}`">
      <div v-if="message" :key="message.id" class="pinned-card">
        <div v-if="settings.showLabel" class="pinned-label">
          <UIcon name="i-lucide-pin" />
          {{ widgetTexts(settings.language).pinned.label }}
        </div>
        <div class="pinned-body">
          <template v-if="settings.showBadges">
            <template v-for="(badge, i) in message.badges" :key="i">
              <img v-if="badge.url" :src="badge.url" class="pinned-badge" alt="">
              <UIcon v-else-if="badge.icon" :name="badge.icon" class="pinned-badge" :style="{ color: badge.color }" />
            </template>
          </template>
          <span class="pinned-name" :style="{ color: message.color }">{{ message.name }}:</span>
          <WidgetParts :parts="message.parts" class="pinned-text" />
        </div>
      </div>
    </Transition>
  </div>
</template>

<style>
@layer widget {
  .pinned {
    display: flex;
    align-items: flex-end;
    height: 100%;
    padding: 12px;
  }

  .pinned-card {
    position: relative;
    width: 100%;
    padding: 1em 1.2em;
    border: 2px solid var(--accent);
    border-radius: var(--radius);
    background: var(--bg);
    font-size: var(--font-size);
    color: var(--text);
    line-height: 1.45;
  }

  .pinned-label {
    position: absolute;
    top: 0;
    left: 1em;
    display: inline-flex;
    align-items: center;
    gap: 0.3em;
    padding: 0.15em 0.6em;
    border-radius: 999px;
    background: var(--accent);
    font-size: 0.6em;
    font-weight: 800;
    text-transform: uppercase;
    translate: 0 -50%;
    color: #fff;
  }

  .pinned-badge {
    display: inline-block;
    width: 1.1em;
    height: 1.1em;
    margin-right: 0.25em;
    vertical-align: -0.15em;
  }

  .pinned-name {
    margin-right: 0.35em;
    font-weight: 800;
  }
}
</style>
