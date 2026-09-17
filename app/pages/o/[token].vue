<script setup lang="ts">
import type { Channels, OverlayMessage, Settings } from '#shared/types'
import { LazyWidgetAlerts, LazyWidgetChat, LazyWidgetEmoteCombo, LazyWidgetScene } from '#components'

definePageMeta({ layout: 'overlay' })

const COMPONENTS: Record<string, Component> = {
  'chat': LazyWidgetChat,
  'alerts': LazyWidgetAlerts,
  'emote-combo': LazyWidgetEmoteCombo,
  'scene': LazyWidgetScene
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
useStreamEvents(() => data.value?.channels, bus, () => live.value && !!data.value)

function handle(msg: OverlayMessage | { kind: 'live', on: boolean }) {
  if (msg.kind === 'config') settings.value = msg.settings
  else if (msg.kind === 'event') bus.emit(msg.event)
  else if (msg.kind === 'live') live.value = msg.on
  else if (msg.kind === 'reload') location.reload()
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
  </WidgetFrame>
</template>
