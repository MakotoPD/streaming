<script setup lang="ts">
import type { Settings } from '#shared/types'
import { widgetTexts } from '#shared/widgets'

const props = defineProps<{ settings: Settings, bus?: EventBus }>()

const BRAND: Record<string, string> = { twitch: '#9146ff', kick: '#53fc18' }

const stats = useChannelStats(30_000)
const context = useWidgetContext()
const texts = computed(() => widgetTexts(props.settings.language).viewers)

const platforms = computed(() => {
  const channels = context?.channels.value
  const list: { platform: 'twitch' | 'kick', live: boolean, viewers: number }[] = []
  if (props.settings.showTwitch && channels?.twitch) list.push({ platform: 'twitch', live: !!stats.value.twitch?.live, viewers: stats.value.twitch?.viewers ?? 0 })
  if (props.settings.showKick && channels?.kick) list.push({ platform: 'kick', live: !!stats.value.kick?.live, viewers: stats.value.kick?.viewers ?? 0 })
  return list
})

const items = computed(() => {
  const list = platforms.value.filter(item => item.live || !props.settings.hideWhenOffline)
  if (!props.settings.combine || list.length < 2) return list
  return [{ platform: 'all' as const, live: list.some(item => item.live), viewers: list.reduce((sum, item) => sum + item.viewers, 0) }]
})
</script>

<template>
  <div class="viewers">
    <div v-for="item in items" :key="item.platform" class="viewers-item" :data-platform="item.platform">
      <span class="viewers-dot" :class="{ 'viewers-live': item.live }" />
      <UIcon
        v-if="item.platform !== 'all'"
        :name="`i-simple-icons-${item.platform}`"
        class="viewers-icon"
        :style="{ color: settings.iconColor === 'brand' ? BRAND[item.platform] : undefined }"
      />
      <UIcon v-else name="i-lucide-eye" class="viewers-icon" />
      <span class="viewers-count">{{ item.live ? item.viewers.toLocaleString(settings.language) : texts.offline }}</span>
      <span v-if="settings.showLabel && item.live" class="viewers-label">{{ fillTemplate(texts.label, { count: item.viewers }, settings.language) }}</span>
    </div>
  </div>
</template>

<style>
@layer widget {
  .viewers {
    display: flex;
    align-items: center;
    gap: var(--gap);
    height: 100%;
    padding: 8px;
    font-size: var(--font-size);
  }

  .viewers-item {
    display: inline-flex;
    align-items: center;
    gap: 0.4em;
    padding: 0.3em 0.8em;
    border-radius: var(--radius);
    background: var(--bg);
    color: var(--text);
    white-space: nowrap;
  }

  .viewers-dot {
    width: 0.45em;
    height: 0.45em;
    border-radius: 50%;
    background: #71717a;
  }

  .viewers-live {
    background: #ef4444;
    box-shadow: 0 0 0.5em #ef4444;
    animation: viewers-pulse 1.6s ease-in-out infinite;
  }

  .viewers-count {
    font-weight: 800;
    font-variant-numeric: tabular-nums;
  }

  .viewers-label {
    font-size: 0.7em;
    opacity: 0.75;
  }

  @keyframes viewers-pulse {
    50% { opacity: 0.4; }
  }
}
</style>
