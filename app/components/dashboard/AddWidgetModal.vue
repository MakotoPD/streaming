<script setup lang="ts">
import { WIDGET_CATEGORIES, WIDGETS, type WidgetCategory } from '#shared/widgets'

const emit = defineEmits<{ select: [type: string] }>()
const open = defineModel<boolean>('open', { default: false })
const { t } = useI18n()

const query = ref('')
const category = ref<WidgetCategory | 'all'>('all')
const creating = ref<string>()

const tabs = computed(() => ['all', ...WIDGET_CATEGORIES].map(value => ({
  value,
  label: t(`dashboard.categories.${value}`),
  count: value === 'all' ? Object.keys(WIDGETS).length : Object.values(WIDGETS).filter(def => def.category === value).length
})))

const results = computed(() => {
  const search = query.value.trim().toLowerCase()
  return Object.values(WIDGETS)
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
  query.value = ''
  category.value = 'all'
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
      <UInput
        v-model="query"
        icon="i-lucide-search"
        :placeholder="t('dashboard.searchWidgets')"
        size="lg"
        class="w-full"
        autofocus
      />

      <div role="tablist" class="flex flex-wrap gap-1">
        <UButton
          v-for="tab in tabs"
          :key="tab.value"
          role="tab"
          size="sm"
          :aria-selected="category === tab.value"
          :color="category === tab.value ? 'primary' : 'neutral'"
          :variant="category === tab.value ? 'solid' : 'ghost'"
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
                  <UTooltip v-if="item.def.requiresTwitchLogin" :text="t('dashboard.requiresTwitch')">
                    <UIcon name="i-simple-icons-twitch" class="mt-1 size-3.5 shrink-0 text-[#9146ff]" />
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
