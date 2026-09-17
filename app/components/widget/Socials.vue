<script setup lang="ts">
import type { Settings } from '#shared/types'
import { SOCIALS } from '#shared/widgets'

const props = defineProps<{ settings: Settings, bus?: EventBus }>()

const BRAND_COLORS: Record<string, string> = {
  twitch: '#9146ff',
  kick: '#53fc18',
  youtube: '#ff0000',
  instagram: '#e1306c',
  tiktok: '#25f4ee',
  x: 'currentColor',
  discord: '#5865f2'
}

const items = computed(() => SOCIALS
  .map(name => ({ name, handle: props.settings[`social.${name}`] as string }))
  .filter(item => item.handle))

const index = ref(0)
const now = useNow(250)
let lastSwitch = Date.now()
watch(now, (time) => {
  if (props.settings.socialsLayout !== 'rotate' || time - lastSwitch < props.settings.interval * 1000) return
  lastSwitch = time
  index.value = (index.value + 1) % Math.max(1, items.value.length)
})

const visible = computed(() => (props.settings.socialsLayout === 'rotate' ? items.value.slice(index.value % Math.max(1, items.value.length), index.value % Math.max(1, items.value.length) + 1) : items.value))
</script>

<template>
  <TransitionGroup
    tag="div"
    class="socials"
    :class="`socials-${settings.socialsLayout}`"
    :enter-active-class="`anim-in-${settings.animIn}`"
    :leave-active-class="`anim-out-${settings.animOut}`"
  >
    <div v-for="item in visible" :key="item.name" class="socials-item">
      <UIcon :name="`i-simple-icons-${item.name}`" class="socials-icon" :style="{ color: settings.iconColor === 'brand' ? BRAND_COLORS[item.name] : undefined }" />
      <span class="socials-handle">{{ item.handle }}</span>
    </div>
  </TransitionGroup>
</template>

<style>
@layer widget {
  .socials {
    position: relative;
    display: flex;
    align-items: center;
    gap: var(--gap);
    height: 100%;
    padding: 8px;
    font-size: var(--font-size);
  }

  .socials-column {
    flex-direction: column;
    align-items: flex-start;
    justify-content: center;
  }

  .socials-rotate .socials-item[class*="anim-out-"] {
    position: absolute;
  }

  .socials-item {
    display: inline-flex;
    align-items: center;
    gap: 0.5em;
    padding: 0.35em 0.9em;
    border-radius: var(--radius);
    background: var(--bg);
    color: var(--text);
    white-space: nowrap;
  }

  .socials-icon {
    flex-shrink: 0;
    width: 1.1em;
    height: 1.1em;
  }

  .socials-handle {
    font-weight: 700;
  }
}
</style>
