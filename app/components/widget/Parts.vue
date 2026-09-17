<script setup lang="ts">
import type { ChatPart } from '#shared/types'

defineProps<{ parts: ChatPart[] }>()
</script>

<template>
  <span>
    <template v-for="(part, i) in parts" :key="i">
      <template v-if="part.type === 'text'">{{ part.text }}</template>
      <span v-else class="emote">
        <img :src="part.url" :alt="part.name" :title="part.name">
        <img v-for="layer in part.layers" :key="layer" :src="layer" alt="">
      </span>
    </template>
  </span>
</template>
