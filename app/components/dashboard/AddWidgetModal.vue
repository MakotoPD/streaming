<script setup lang="ts">
import type { Platform } from '#shared/types'
import { WIDGET_CATEGORIES, WIDGETS, type WidgetCategory } from '#shared/widgets'

const emit = defineEmits<{ select: [type: string] }>()
const open = defineModel<boolean>('open', { default: false })
const { t } = useI18n()
const { data: me } = useMe()

const query = ref('')
const category = ref<WidgetCategory | 'all'>('all')
const platform = ref<Platform | 'all'>('all')
const creating = ref<string>()

const supports = (def: typeof WIDGETS[string], value: Platform | 'all') => value === 'all' || !def.platforms || def.platforms.includes(value)

const categoryTabs = computed(() => ['all', ...WIDGET_CATEGORIES].map(value => ({
  value,
  label: t(`dashboard.categories.${value}`),
  count: Object.values(WIDGETS).filter(def => supports(def, platform.value) && (value === 'all' || def.category === value)).length
})))

const platformTabs = computed(() => ([
  { value: 'all' as const, label: t('dashboard.allPlatforms'), icon: 'i-lucide-layers' },
  { value: 'twitch' as const, label: t('platforms.twitch'), icon: 'i-simple-icons-twitch' },
  { value: 'kick' as const, label: t('platforms.kick'), icon: 'i-simple-icons-kick' }
]))

const results = computed(() => {
  const search = query.value.trim().toLowerCase()
  return Object.values(WIDGETS)
    .filter(def => supports(def, platform.value))
    .filter(def => category.value === 'all' || def.category === category.value)
    .map(def => ({ def, name: t(`widgets.${def.type}.name`), description: t(`widgets.${def.type}.description`) }))
    .filter(item => !search || `${item.name} ${item.description}`.toLowerCase().includes(search))
})

const groups = computed(() => {
  if (category.value !== 'all' || query.value.trim()) return [{ category: undefined, items: results.value }]
  return WIDGET_CATEGORIES
    .map(value => ({ category: value, items: results.value.filter(item => item.def.category === value) }))
    .filter(group => group.items.length)
})

watch(open, (value) => {
  if (!value) return
  const channels = me.value?.channels
  query.value = ''
  category.value = 'all'
  platform.value = channels?.twitch && !channels?.kick ? 'twitch' : channels?.kick && !channels?.twitch ? 'kick' : 'all'
  creating.value = undefined
})

function choose(type: string) {
  creating.value = type
  emit('select', type)
}
</script>

<template>
  <UModal
    v-model:open="open"
    :title="t('dashboard.addWidgetTitle')"
    :description="t('dashboard.addWidgetDescription')"
    :ui="{ content: 'sm:max-w-4xl', body: 'space-y-4' }"
  >
    <template #body>
      <div class="flex flex-col gap-2 sm:flex-row">
        <UInput
          v-model="query"
          icon="i-lucide-search"
          :placeholder="t('dashboard.searchWidgets')"
          size="lg"
          class="flex-1"
          autofocus
        />
        <UFieldGroup size="lg">
          <UTooltip v-for="item in platformTabs" :key="item.value" :text="item.label">
            <UButton
              :icon="item.icon"
              :aria-label="item.label"
              :aria-pressed="platform === item.value"
              :color="platform === item.value ? 'primary' : 'neutral'"
              :variant="platform === item.value ? 'solid' : 'outline'"
              @click="platform = item.value"
            />
          </UTooltip>
        </UFieldGroup>
      </div>

      <div role="tablist" class="flex flex-wrap gap-1">
        <UButton
          v-for="tab in categoryTabs"
          :key="tab.value"
          role="tab"
          size="sm"
          :aria-selected="category === tab.value"
          :color="category === tab.value ? 'primary' : 'neutral'"
          :variant="category === tab.value ? 'solid' : 'ghost'"
          :disabled="!tab.count"
          @click="category = tab.value as WidgetCategory | 'all'"
        >
          {{ tab.label }}
          <UBadge :label="String(tab.count)" size="sm" :color="category === tab.value ? 'neutral' : 'primary'" variant="subtle" />
        </UButton>
      </div>

      <div class="max-h-[60vh] overflow-y-auto pe-1 space-y-5">
        <p v-if="!results.length" class="py-10 text-center text-sm text-muted">
          {{ t('dashboard.noWidgetsFound') }}
        </p>

        <section v-for="group in groups" :key="group.category ?? 'results'" class="space-y-2">
          <h3 v-if="group.category" class="text-xs font-semibold uppercase tracking-wide text-muted">
            {{ t(`dashboard.categories.${group.category}`) }}
          </h3>
          <div class="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            <button
              v-for="item in group.items"
              :key="item.def.type"
              type="button"
              class="group flex gap-3 rounded-lg border border-default p-3 text-left transition-colors hover:border-primary hover:bg-elevated disabled:opacity-60"
              :disabled="!!creating"
              @click="choose(item.def.type)"
            >
              <div class="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-inverted">
                <UIcon v-if="creating === item.def.type" name="i-lucide-loader-circle" class="size-5 animate-spin" />
                <UIcon v-else :name="item.def.icon" class="size-5" />
              </div>
              <div class="min-w-0 flex-1">
                <div class="flex items-start gap-1.5">
                  <span class="font-medium leading-snug">{{ item.name }}</span>
                  <UTooltip v-if="item.def.platforms?.length === 1" :text="t('dashboard.onlyOnPlatform', { platform: t(`platforms.${item.def.platforms[0]}`) })">
                    <UIcon :name="`i-simple-icons-${item.def.platforms[0]}`" class="mt-1 size-3.5 shrink-0" :class="item.def.platforms[0] === 'twitch' ? 'text-[#9146ff]' : 'text-[#53fc18]'" />
                  </UTooltip>
                </div>
                <p class="mt-0.5 line-clamp-2 text-xs text-muted">
                  {{ item.description }}
                </p>
              </div>
            </button>
          </div>
        </section>
      </div>
    </template>
  </UModal>
</template>
