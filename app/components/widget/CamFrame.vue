<script setup lang="ts">
import type { Settings } from '#shared/types'

const props = defineProps<{ settings: Settings, bus?: EventBus }>()

const context = useWidgetContext()
const label = computed(() => props.settings.frameLabel || context?.channels.value?.twitch?.login || context?.channels.value?.kick?.slug || '')
</script>

<template>
  <div class="cam-frame" :class="{ 'cam-frame-animated': settings.animatedBorder }">
    <div class="cam-frame-border" />
    <template v-if="settings.cornerStyle === 'brackets'">
      <span v-for="corner in ['tl', 'tr', 'bl', 'br']" :key="corner" class="cam-frame-corner" :class="`cam-frame-corner-${corner}`" />
    </template>
    <div v-if="settings.showLabel && label" class="cam-frame-label" :class="`cam-frame-label-${settings.labelPosition}`">
      {{ label }}
    </div>
  </div>
</template>

<style>
@property --cam-angle {
  syntax: "<angle>";
  initial-value: 0deg;
  inherits: false;
}

@layer widget {
  .cam-frame {
    position: absolute;
    inset: 0;
    padding: var(--glow);
  }

  .cam-frame-border {
    position: relative;
    width: 100%;
    height: 100%;
    padding: var(--border-width);
    border-radius: var(--radius);
    background: linear-gradient(135deg, var(--color-1), var(--color-2));
    box-shadow: 0 0 var(--glow) color-mix(in srgb, var(--color-1) 60%, transparent);
    -webkit-mask: linear-gradient(#000 0 0) content-box exclude, linear-gradient(#000 0 0);
    mask: linear-gradient(#000 0 0) content-box exclude, linear-gradient(#000 0 0);
  }

  .cam-frame-animated .cam-frame-border {
    background: conic-gradient(from var(--cam-angle), var(--color-1), var(--color-2), var(--color-1));
    animation: cam-spin 6s linear infinite;
  }

  .cam-frame::after {
    position: absolute;
    inset: var(--glow);
    z-index: -1;
    border-radius: var(--radius);
    box-shadow: 0 0 var(--glow) color-mix(in srgb, var(--color-1) 55%, transparent), 0 0 var(--glow) color-mix(in srgb, var(--color-2) 35%, transparent) inset;
    content: "";
  }

  .cam-frame-corner {
    position: absolute;
    width: 12%;
    height: 12%;
    border: 0 solid var(--color-2);
  }

  .cam-frame-corner-tl { top: calc(var(--glow) - 10px); left: calc(var(--glow) - 10px); border-top-width: 4px; border-left-width: 4px; }
  .cam-frame-corner-tr { top: calc(var(--glow) - 10px); right: calc(var(--glow) - 10px); border-top-width: 4px; border-right-width: 4px; }
  .cam-frame-corner-bl { bottom: calc(var(--glow) - 10px); left: calc(var(--glow) - 10px); border-bottom-width: 4px; border-left-width: 4px; }
  .cam-frame-corner-br { bottom: calc(var(--glow) - 10px); right: calc(var(--glow) - 10px); border-bottom-width: 4px; border-right-width: 4px; }

  .cam-frame-label {
    position: absolute;
    padding: 0.3em 0.9em;
    border-radius: 999px;
    background: var(--label-bg);
    font-size: var(--font-size);
    font-weight: 800;
    color: var(--text);
  }

  .cam-frame-label-top-left { top: calc(var(--glow) + var(--border-width) + 10px); left: calc(var(--glow) + var(--border-width) + 10px); }
  .cam-frame-label-top-right { top: calc(var(--glow) + var(--border-width) + 10px); right: calc(var(--glow) + var(--border-width) + 10px); }
  .cam-frame-label-bottom-left { bottom: calc(var(--glow) + var(--border-width) + 10px); left: calc(var(--glow) + var(--border-width) + 10px); }
  .cam-frame-label-bottom-right { bottom: calc(var(--glow) + var(--border-width) + 10px); right: calc(var(--glow) + var(--border-width) + 10px); }

  @keyframes cam-spin {
    to { --cam-angle: 360deg; }
  }
}
</style>
