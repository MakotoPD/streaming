<script setup lang="ts">
import type { Settings } from '#shared/types'
import { cssVars, WIDGETS } from '#shared/widgets'

const props = defineProps<{ type: string, settings: Settings }>()

const vars = computed(() => cssVars(WIDGETS[props.type]!, props.settings))
const fontHref = computed(() => googleFontUrl(props.settings.font))

useHead(() => ({
  link: fontHref.value ? [{ key: 'widget-font', rel: 'stylesheet', href: fontHref.value }] : [],
  style: props.settings.customCss ? [{ key: 'widget-css', textContent: props.settings.customCss }] : []
}))
</script>

<template>
  <div class="widget-root" :class="`widget-${type}`" :style="vars">
    <slot />
  </div>
</template>
