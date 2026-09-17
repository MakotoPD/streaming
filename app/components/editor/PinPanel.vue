<script setup lang="ts">
import type { ChatMessage } from '#shared/types'

const emit = defineEmits<{ pin: [message: ChatMessage] }>()
const { t } = useI18n()
const { data: me } = useMe()

const messages = ref<ChatMessage[]>([])
const bus = createEventBus()
useStreamEvents(() => me.value?.channels, bus)

let off: (() => void) | undefined
onMounted(() => {
  off = bus.on((event) => {
    if (event.kind === 'chat') messages.value = [event, ...messages.value].slice(0, 40)
    else if (event.kind === 'delete') messages.value = messages.value.filter(message => message.id !== event.id)
  })
})
onBeforeUnmount(() => off?.())
</script>

<template>
  <div class="space-y-2">
    <div class="text-sm font-medium">
      {{ t('editor.pin.title') }}
    </div>
    <p class="text-xs text-muted">
      {{ t('editor.pin.hint') }}
    </p>
    <div class="max-h-80 overflow-y-auto rounded-md border border-default divide-y divide-default">
      <p v-if="!messages.length" class="p-3 text-sm text-muted">
        {{ t('editor.pin.waiting') }}
      </p>
      <button
        v-for="message in messages"
        :key="`${message.platform}-${message.id}`"
        type="button"
        class="group flex w-full items-start gap-2 px-3 py-2 text-left text-sm hover:bg-elevated"
        @click="emit('pin', message)"
      >
        <UIcon :name="`i-simple-icons-${message.platform}`" class="mt-0.5 size-3.5 shrink-0 text-muted" />
        <span class="min-w-0 flex-1 [&_.emote>img]:h-5">
          <span class="font-semibold" :style="{ color: message.color }">{{ message.name }}:</span>
          <WidgetParts :parts="message.parts" />
        </span>
        <UIcon name="i-lucide-pin" class="mt-0.5 size-4 shrink-0 text-primary opacity-0 group-hover:opacity-100" />
      </button>
    </div>
  </div>
</template>
