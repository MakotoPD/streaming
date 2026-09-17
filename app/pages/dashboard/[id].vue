<script setup lang="ts">
import type { Settings } from '#shared/types'
import { sampleEvent, styleKeys, WIDGET_TESTS, WIDGETS, widgetTexts } from '#shared/widgets'

definePageMeta({ middleware: 'auth' })

const { t } = useI18n()
const toast = useToast()
const route = useRoute()
const id = String(route.params.id)

interface WidgetRow { id: string, type: string, name: string, token: string, settings: Settings }
interface StyleRow { id: string, name: string, values: Settings }

const { data: widget, error } = await useFetch<WidgetRow>(`/api/widgets/${id}`)
if (error.value || !widget.value) throw createError({ statusCode: 404, fatal: true })

const def = WIDGETS[widget.value.type]!
const settings = ref<Settings>(structuredClone(widget.value.settings))
const name = ref(widget.value.name)

useHead({ title: () => widgetTitle({ ...widget.value!, name: name.value }, t) })

const { data: myStyles, refresh: refreshStyles } = await useFetch<StyleRow[]>('/api/styles', { query: { type: def.type }, default: () => [] })

const sections = computed(() => [...new Set(def.fields.map(f => f.section))])
const activeSection = ref(sections.value[0]!)
const tabs = computed(() => sections.value.map(section => ({ value: section, label: t(`sections.${section}`) })))
const visibleFields = computed(() => def.fields.filter(f => f.section === activeSection.value))

const texts = computed(() => widgetTexts(settings.value.language ?? 'en'))
function placeholderFor(key: string) {
  const alerts = texts.value.alerts as Record<string, string>
  if (key === 'sub.textResub') return alerts.resub
  if (key.endsWith('.text')) return alerts[key.split('.')[0]!]
  const scene = texts.value.scene[settings.value.mode as 'starting'] as [string, string] | undefined
  if (key === 'title') return scene?.[0]
  if (key === 'titleAccent') return scene?.[1]
  return undefined
}

const saveState = ref<'saved' | 'saving' | 'error'>('saved')
let saveTimer: ReturnType<typeof setTimeout> | undefined

async function save() {
  saveState.value = 'saving'
  try {
    await $fetch(`/api/widgets/${id}`, { method: 'PATCH', body: { name: name.value, settings: settings.value } })
    saveState.value = 'saved'
  }
  catch {
    saveState.value = 'error'
  }
}

watch([settings, name], () => {
  saveState.value = 'saving'
  clearTimeout(saveTimer)
  saveTimer = setTimeout(save, 700)
}, { deep: true })

onBeforeUnmount(() => {
  if (saveState.value === 'saving') {
    clearTimeout(saveTimer)
    save()
  }
})

function applyStyle(values: Settings) {
  for (const key of styleKeys(def)) {
    if (key in values) settings.value[key] = structuredClone(values[key])
  }
}

const styleName = ref('')
const styleModalOpen = ref(false)
async function saveStyle() {
  if (!styleName.value.trim()) return
  const values = Object.fromEntries(styleKeys(def).map(key => [key, settings.value[key]]))
  await $fetch('/api/styles', { method: 'POST', body: { widgetType: def.type, name: styleName.value, values } })
  styleModalOpen.value = false
  styleName.value = ''
  await refreshStyles()
  toast.add({ title: t('editor.styleSaved'), color: 'success', icon: 'i-lucide-check' })
}

async function deleteStyle(style: StyleRow) {
  await $fetch(`/api/styles/${style.id}`, { method: 'DELETE' })
  await refreshStyles()
}

const preview = useTemplateRef<{ emit: (event: ReturnType<typeof sampleEvent>) => void }>('preview')
const live = ref(true)
const tests = WIDGET_TESTS[def.type] ?? []

async function sendToObs(test: string) {
  await $fetch(`/api/widgets/${id}/test`, { method: 'POST', body: { test } })
  toast.add({ title: t('editor.testSent'), color: 'success', icon: 'i-lucide-send' })
}

const { obsUrl, copyObsUrl } = useObsUrl()

async function regenerateToken() {
  if (!confirm(t('editor.confirmRegenerate'))) return
  const updated = await $fetch<WidgetRow>(`/api/widgets/${id}/token`, { method: 'POST' })
  widget.value = { ...widget.value!, token: updated.token }
}
</script>

<template>
  <UContainer v-if="widget" class="py-8">
    <div class="flex flex-wrap items-center gap-3 mb-6">
      <UButton to="/dashboard" icon="i-lucide-arrow-left" color="neutral" variant="ghost" :aria-label="t('common.back')" />
      <UIcon :name="def.icon" class="size-6 text-primary" />
      <UInput v-model="name" :placeholder="widgetTitle({ ...widget, name: '' }, t)" variant="ghost" size="xl" class="font-semibold min-w-0 flex-1 sm:flex-none sm:min-w-60" />
      <div class="flex-1" />
      <UBadge
        :color="saveState === 'error' ? 'error' : saveState === 'saving' ? 'neutral' : 'success'"
        variant="subtle"
        :icon="saveState === 'saving' ? 'i-lucide-loader-circle' : saveState === 'error' ? 'i-lucide-circle-alert' : 'i-lucide-check'"
        :label="t(`editor.save.${saveState}`)"
      />
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-[minmax(0,420px)_minmax(0,1fr)] gap-6 items-start">
      <UCard :ui="{ body: 'space-y-5' }">
        <div role="tablist" class="flex flex-wrap gap-1 rounded-lg bg-elevated p-1">
          <UButton
            v-for="tab in tabs"
            :key="tab.value"
            role="tab"
            size="sm"
            :aria-selected="activeSection === tab.value"
            :color="activeSection === tab.value ? 'primary' : 'neutral'"
            :variant="activeSection === tab.value ? 'solid' : 'ghost'"
            :label="tab.label"
            @click="activeSection = tab.value"
          />
        </div>

        <div v-if="activeSection === 'style'" class="space-y-3">
          <div class="text-sm font-medium">
            {{ t('editor.presets') }}
          </div>
          <div class="flex flex-wrap gap-2">
            <UButton
              v-for="preset in def.presets"
              :key="preset.id"
              size="sm"
              color="neutral"
              variant="outline"
              :label="t(`presets.${preset.id}`)"
              @click="applyStyle(preset.values)"
            />
          </div>
          <div class="flex items-center justify-between">
            <div class="text-sm font-medium">
              {{ t('editor.myStyles') }}
            </div>
            <UModal v-model:open="styleModalOpen" :title="t('editor.saveStyle')">
              <UButton size="xs" icon="i-lucide-plus" variant="soft" :label="t('editor.saveStyle')" />
              <template #body>
                <UForm :state="{ styleName }" class="flex gap-2" @submit="saveStyle">
                  <UInput v-model="styleName" :placeholder="t('editor.styleName')" maxlength="40" autofocus class="flex-1" />
                  <UButton type="submit" :label="t('common.save')" />
                </UForm>
              </template>
            </UModal>
          </div>
          <div v-if="myStyles.length" class="flex flex-wrap gap-2">
            <UFieldGroup v-for="style in myStyles" :key="style.id" size="sm">
              <UButton color="primary" variant="soft" :label="style.name" @click="applyStyle(style.values)" />
              <UButton color="primary" variant="soft" icon="i-lucide-x" :aria-label="t('common.delete')" @click="deleteStyle(style)" />
            </UFieldGroup>
          </div>
          <p v-else class="text-sm text-muted">
            {{ t('editor.noStyles') }}
          </p>
          <USeparator />
        </div>

        <EditorField
          v-for="field in visibleFields"
          :key="field.key"
          v-model="settings[field.key]"
          :field="field"
          :placeholder="placeholderFor(field.key)"
        />

        <EditorCssReference
          v-if="activeSection === 'advanced'"
          :definition="def"
          @insert="settings.customCss = `${settings.customCss ? `${settings.customCss.trimEnd()}\n\n` : ''}${$event}`"
        />
      </UCard>

      <div class="space-y-4 lg:sticky lg:top-20">
        <UCard :ui="{ body: 'space-y-3' }">
          <div class="flex flex-wrap items-center gap-3">
            <div class="font-semibold">
              {{ t('editor.preview') }}
            </div>
            <USwitch v-model="live" :label="t('editor.liveChat')" />
            <div class="flex-1" />
            <span class="text-xs text-muted">{{ def.size[0] }}×{{ def.size[1] }}</span>
          </div>

          <EditorPreview ref="preview" :token="widget.token" :settings="settings" :size="def.size" :live="live" />

          <div v-if="tests.length" class="flex flex-wrap items-center gap-2">
            <span class="text-sm text-muted">{{ t('editor.test') }}:</span>
            <UFieldGroup v-for="test in tests" :key="test" size="sm">
              <UButton color="neutral" variant="outline" icon="i-lucide-play" :label="t(`tests.${test}`)" @click="preview?.emit(sampleEvent(test))" />
              <UTooltip :text="t('editor.sendToObs')">
                <UButton color="neutral" variant="outline" icon="i-lucide-send" :aria-label="t('editor.sendToObs')" @click="sendToObs(test)" />
              </UTooltip>
            </UFieldGroup>
          </div>
        </UCard>

        <UCard :ui="{ body: 'space-y-3' }">
          <div class="font-semibold">
            {{ t('editor.obsTitle') }}
          </div>
          <UFieldGroup class="w-full">
            <UInput :model-value="obsUrl(widget.token)" readonly class="flex-1 font-mono" />
            <UButton icon="i-lucide-copy" :label="t('dashboard.copyUrl')" @click="copyObsUrl(widget.token)" />
            <UTooltip :text="t('editor.regenerate')">
              <UButton icon="i-lucide-refresh-cw" color="neutral" variant="outline" :aria-label="t('editor.regenerate')" @click="regenerateToken" />
            </UTooltip>
          </UFieldGroup>
          <ol class="text-sm text-muted list-decimal ps-5 space-y-1">
            <li>{{ t('editor.obsStep1') }}</li>
            <li>{{ t('editor.obsStep2', { width: def.size[0], height: def.size[1] }) }}</li>
            <li>{{ t('editor.obsStep3') }}</li>
          </ol>
        </UCard>
      </div>
    </div>
  </UContainer>
</template>
