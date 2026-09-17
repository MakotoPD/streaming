<script setup lang="ts">
interface Usage { widgetId: string, type: string, name: string, mode?: string, fields: { key: string, label: string, section: string }[] }

defineProps<{
  usages: Usage[]
  title: (usage: Usage) => string
  field: (field: Usage['fields'][number]) => string
}>()

const { t } = useI18n()
</script>

<template>
  <div class="text-xs">
    <div class="mb-1 font-medium text-muted">
      {{ usages.length ? t('library.usedIn') : t('library.unused') }}
    </div>
    <ul v-if="usages.length" class="space-y-1">
      <li v-for="usage in usages" :key="usage.widgetId">
        <NuxtLink :to="`/dashboard/${usage.widgetId}`" class="font-medium text-primary hover:underline">
          {{ title(usage) }}
        </NuxtLink>
        <span class="text-muted"> — {{ usage.fields.map(field).join(', ') }}</span>
      </li>
    </ul>
  </div>
</template>
