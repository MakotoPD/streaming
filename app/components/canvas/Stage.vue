<script setup lang="ts">
import { CANVAS_HEIGHT, CANVAS_WIDTH, canvasPath, type CanvasScene, type CanvasText } from '#shared/canvas'

const props = defineProps<{ scene: CanvasScene, editing?: string }>()
const emit = defineEmits<{ text: [id: string, value: string] }>()

const fonts = computed(() => [...new Set(props.scene.objects.filter(object => object.kind === 'text').map(object => object.font))])

useHead(() => ({
  link: fonts.value.map(font => ({ key: `canvas-font-${font}`, rel: 'stylesheet', href: googleFontUrl(font)! }))
}))

function textStyle(object: CanvasText) {
  return {
    fontFamily: `"${object.font}", system-ui, sans-serif`,
    fontSize: `${object.size}px`,
    color: object.color,
    fontWeight: object.bold ? '700' : '400',
    fontStyle: object.italic ? 'italic' : 'normal',
    textDecoration: [object.underline ? 'underline' : '', object.strike ? 'line-through' : ''].filter(Boolean).join(' ') || 'none'
  }
}

let editor: HTMLElement | undefined

function mountEditor(el: Element | null, text: string) {
  const node = el as HTMLElement | null
  if (!node) {
    editor = undefined
    return
  }
  if (node === editor) return
  editor = node
  node.innerText = text
  requestAnimationFrame(() => {
    if (editor !== node) return
    node.focus()
    const range = document.createRange()
    range.selectNodeContents(node)
    range.collapse(false)
    const selection = getSelection()
    selection?.removeAllRanges()
    selection?.addRange(range)
  })
}
</script>

<template>
  <svg
    class="canvas-stage"
    :viewBox="`0 0 ${CANVAS_WIDTH} ${CANVAS_HEIGHT}`"
    :style="{ background: scene.background || undefined }"
    preserveAspectRatio="none"
  >
    <template v-for="object in scene.objects" :key="object.id">
      <path
        v-if="object.kind === 'draw'"
        :data-id="object.id"
        :d="canvasPath(object)"
        :stroke="object.stroke"
        :stroke-width="object.width"
        :fill="object.fill || 'none'"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
      <foreignObject
        v-else-if="object.kind === 'text'"
        :data-id="object.id"
        :x="object.x"
        :y="object.y"
        :width="object.w"
        :height="Math.max(CANVAS_HEIGHT - object.y, object.size * 4)"
      >
        <div
          v-if="editing === object.id"
          :ref="el => mountEditor(el as Element | null, object.text)"
          class="canvas-text canvas-editing"
          contenteditable="plaintext-only"
          :style="textStyle(object)"
          @input="emit('text', object.id, ($event.target as HTMLElement).innerText)"
        />
        <div v-else class="canvas-text" :style="textStyle(object)">{{ object.text }}</div>
      </foreignObject>
      <foreignObject
        v-else
        :data-id="object.id"
        :x="object.x"
        :y="object.y"
        :width="object.w"
        :height="object.h"
      >
        <video v-if="object.video" class="canvas-media" :src="object.url" autoplay loop muted playsinline />
        <img v-else class="canvas-media" :src="object.url" alt="">
      </foreignObject>
    </template>
  </svg>
</template>

<style>
@layer widget {
  .canvas-stage {
    display: block;
    width: 100%;
    height: 100%;
  }

  .canvas-text {
    width: 100%;
    line-height: 1.25;
    white-space: pre-wrap;
    overflow-wrap: break-word;
    outline: none;
  }

  .canvas-editing {
    outline: 2px dashed currentColor;
    outline-offset: 6px;
  }

  .canvas-media {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: contain;
  }
}
</style>
