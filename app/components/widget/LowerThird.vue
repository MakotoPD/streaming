<script setup lang="ts">
import type { Settings } from '#shared/types'

const props = defineProps<{ settings: Settings, bus?: EventBus }>()

const context = useWidgetContext()
const title = computed(() => props.settings.thirdTitle || context?.channels.value?.twitch?.login || context?.channels.value?.kick?.slug || context?.channels.value?.youtube?.handle?.replace(/^@/, '') || '')

const shown = ref(true)
let timer: ReturnType<typeof setTimeout> | undefined

function cycle() {
  clearTimeout(timer)
  if (props.settings.showMode !== 'interval') {
    shown.value = true
    return
  }
  timer = setTimeout(() => {
    shown.value = !shown.value
    cycle()
  }, (shown.value ? props.settings.showFor : props.settings.hideFor) * 1000)
}

watch(() => [props.settings.showMode, props.settings.showFor, props.settings.hideFor], () => {
  shown.value = true
  cycle()
}, { immediate: true })
onBeforeUnmount(() => clearTimeout(timer))
</script>

<template>
  <div class="lower-third-area" :class="`lower-third-${settings.align}`">
    <Transition :enter-active-class="`anim-in-${settings.animIn}`" :leave-active-class="`anim-out-${settings.animOut}`" appear>
      <div v-if="shown && title" class="lower-third">
        <div class="lower-third-accent" />
        <div class="lower-third-text">
          <div class="lower-third-title">
            {{ title }}
          </div>
          <div v-if="settings.subtitle" class="lower-third-subtitle">
            {{ settings.subtitle }}
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style>
@layer widget {
  .lower-third-area {
    display: flex;
    align-items: flex-end;
    height: 100%;
    padding: 16px;
  }

  .lower-third-right {
    justify-content: flex-end;
  }

  .lower-third {
    display: flex;
    align-items: stretch;
    overflow: hidden;
    border-radius: var(--radius);
    background: var(--bg);
  }

  .lower-third-right .lower-third {
    flex-direction: row-reverse;
    text-align: right;
  }

  .lower-third-accent {
    width: 10px;
    flex-shrink: 0;
    background: var(--accent);
  }

  .lower-third-text {
    padding: 0.5em 1.2em;
  }

  .lower-third-title {
    font-size: var(--title-size);
    font-weight: 900;
    line-height: 1.05;
    color: var(--text);
  }

  .lower-third-subtitle {
    margin-top: 0.15em;
    font-size: var(--subtitle-size);
    font-weight: 600;
    color: var(--subtitle);
  }
}
</style>
