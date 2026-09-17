<script setup lang="ts">
defineProps<{ placeholder?: string }>()
const model = defineModel<string>({ default: '' })

const textarea = useTemplateRef<HTMLTextAreaElement>('textarea')
const tokens = computed(() => tokenizeCss(model.value))

const CLASSES: Record<CssTokenType, string> = {
  comment: 'text-dimmed italic',
  string: 'text-emerald-400',
  selector: 'text-violet-300',
  property: 'text-sky-300',
  punct: 'text-muted',
  color: 'text-default',
  variable: 'text-pink-300',
  number: 'text-amber-300',
  function: 'text-teal-300',
  value: 'text-default',
  text: 'text-default'
}

function resize() {
  const el = textarea.value
  if (!el) return
  el.style.height = 'auto'
  el.style.height = `${el.scrollHeight}px`
}

watch(model, () => nextTick(resize))
onMounted(resize)

function replaceToken(token: CssToken, value: string) {
  model.value = model.value.slice(0, token.start) + value + model.value.slice(token.start + token.text.length)
}

function focusAt(position: number) {
  textarea.value?.focus()
  textarea.value?.setSelectionRange(position, position)
}
</script>

<template>
  <div class="css-editor relative rounded-md border border-default bg-default focus-within:border-primary">
    <pre aria-hidden="true" class="css-layer pointer-events-none absolute inset-0 z-10 m-0 overflow-hidden"><template v-for="(token, i) in tokens" :key="i"><EditorColorPopover v-if="token.type === 'color'" :model-value="token.text" @update:model-value="replaceToken(token, $event)"><span class="pointer-events-auto cursor-pointer rounded-sm underline decoration-dotted underline-offset-2" @mousedown.prevent="focusAt(token.start + token.text.length)"><span class="swatch" :style="{ '--swatch': token.text }" />{{ token.text }}</span></EditorColorPopover><span v-else :class="CLASSES[token.type]">{{ token.text }}</span></template>{{ '\n' }}</pre>
    <textarea
      ref="textarea"
      v-model="model"
      :placeholder="placeholder"
      spellcheck="false"
      autocomplete="off"
      autocapitalize="off"
      class="css-layer relative block w-full min-h-48 resize-none overflow-hidden bg-transparent text-transparent caret-[var(--ui-text-highlighted)] outline-none placeholder:text-dimmed selection:bg-primary/30"
      @input="resize"
    />
  </div>
</template>

<style scoped>
.css-layer {
  padding: 0.75rem;
  font-family: ui-monospace, "JetBrains Mono", Consolas, monospace;
  font-size: 0.75rem;
  line-height: 1.25rem;
  tab-size: 2;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
  word-break: normal;
  letter-spacing: normal;
}

.swatch {
  display: inline-block;
  width: 0.7em;
  height: 0.7em;
  margin-right: -0.7em;
  transform: translateX(-0.95em);
  border-radius: 2px;
  outline: 1px solid rgb(255 255 255 / 0.3);
  background:
    linear-gradient(var(--swatch), var(--swatch)),
    repeating-conic-gradient(#9ca3af 0 25%, #f3f4f6 0 50%) 0 0 / 4px 4px;
  vertical-align: -0.05em;
}
</style>
