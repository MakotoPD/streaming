<script setup lang="ts">
import type { Channels, OverlayMessage, Settings } from '#shared/types'
import {
  LazyWidgetAlerts,
  LazyWidgetCamFrame,
  LazyWidgetCanvas,
  LazyWidgetChat,
  LazyWidgetClock,
  LazyWidgetCounter,
  LazyWidgetEmoteCombo,
  LazyWidgetEmoteRain,
  LazyWidgetFirstMessage,
  LazyWidgetGiveaway,
  LazyWidgetGoal,
  LazyWidgetHypeTrain,
  LazyWidgetLeaderboard,
  LazyWidgetLowerThird,
  LazyWidgetMarquee,
  LazyWidgetPinned,
  LazyWidgetPoll,
  LazyWidgetRecentEvents,
  LazyWidgetRedemptions,
  LazyWidgetScene,
  LazyWidgetSocials,
  LazyWidgetSpotlight,
  LazyWidgetSubathon,
  LazyWidgetTwitchPoll,
  LazyWidgetViewers
} from '#components'

definePageMeta({ layout: 'overlay' })

const COMPONENTS: Record<string, Component> = {
  'chat': LazyWidgetChat,
  'alerts': LazyWidgetAlerts,
  'emote-combo': LazyWidgetEmoteCombo,
  'scene': LazyWidgetScene,
  'emote-rain': LazyWidgetEmoteRain,
  'poll': LazyWidgetPoll,
  'counter': LazyWidgetCounter,
  'pinned': LazyWidgetPinned,
  'recent-events': LazyWidgetRecentEvents,
  'leaderboard': LazyWidgetLeaderboard,
  'giveaway': LazyWidgetGiveaway,
  'first-message': LazyWidgetFirstMessage,
  'spotlight': LazyWidgetSpotlight,
  'subathon': LazyWidgetSubathon,
  'goal': LazyWidgetGoal,
  'clock': LazyWidgetClock,
  'socials': LazyWidgetSocials,
  'marquee': LazyWidgetMarquee,
  'cam-frame': LazyWidgetCamFrame,
  'canvas': LazyWidgetCanvas,
  'lower-third': LazyWidgetLowerThird,
  'redemptions': LazyWidgetRedemptions,
  'hype-train': LazyWidgetHypeTrain,
  'twitch-poll': LazyWidgetTwitchPoll,
  'viewers': LazyWidgetViewers
}

const route = useRoute()
const token = String(route.params.token)
const preview = 'preview' in route.query

const { data } = await useFetch<{ id: string, type: string, settings: Settings, channels: Channels }>(`/api/o/${token}`)

const settings = ref<Settings>({})
watch(data, (value) => {
  if (value) settings.value = value.settings
}, { immediate: true })

const live = ref(!preview || route.query.live !== '0')
const bus = createEventBus()
const { emotes } = useStreamEvents(() => data.value?.channels, bus, () => live.value && !!data.value)
provideWidgetContext({ id: data.value?.id ?? token, token, preview, channels: computed(() => data.value?.channels), emotes })

const highlight = ref<string>()

function handle(msg: OverlayMessage | { kind: 'live', on: boolean } | { kind: 'highlight', selector?: string } | { kind: 'ping' }) {
  if (msg.kind === 'ping') parent.postMessage({ kind: 'ready' }, location.origin)
  else if (msg.kind === 'config') settings.value = msg.settings
  else if (msg.kind === 'event') bus.emit(msg.event)
  else if (msg.kind === 'live') live.value = msg.on
  else if (msg.kind === 'highlight') highlight.value = msg.selector
  else if (msg.kind === 'reload') location.reload()
}

function reportHighlight(count: number) {
  parent.postMessage({ kind: 'highlight-count', count }, location.origin)
}

let disconnect = () => {}

onMounted(() => {
  if (preview) {
    const onMessage = (e: MessageEvent) => {
      if (e.origin === location.origin && e.data?.kind) handle(e.data)
    }
    addEventListener('message', onMessage)
    disconnect = () => removeEventListener('message', onMessage)
    parent.postMessage({ kind: 'ready' }, location.origin)
    return
  }
  const source = new EventSource(`/api/o/${token}/events`)
  source.onmessage = e => handle(JSON.parse(e.data))
  disconnect = () => source.close()
})

onBeforeUnmount(() => disconnect())
</script>

<template>
  <WidgetFrame v-if="data" :type="data.type" :settings="settings">
    <component :is="COMPONENTS[data.type]" :settings="settings" :bus="bus" />
    <WidgetHighlight v-if="preview" :selector="highlight" @count="reportHighlight" />
  </WidgetFrame>
</template>
