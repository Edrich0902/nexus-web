<script setup lang="ts">
import NxBento from '@design/components/NxBento.vue'
import NxField from '@design/components/NxField.vue'
import { sections, type SectionKey } from '@design/tokens'
import type { CollectionField } from './collectionFields'

defineProps<{
  section: SectionKey
  fields: CollectionField[]
}>()
</script>

<template>
  <NxBento :row-height="132">
    <NxField
      v-for="f in fields"
      :key="f.key"
      :bg="f.variant === 'solid' ? sections[section].field.bg : sections[section].ambient.acc"
      :ink="f.variant === 'solid' ? sections[section].field.ink : undefined"
      :variant="f.variant"
      :label="f.label"
      :aside="f.aside"
      :value="f.title ? undefined : f.value"
      :value-size="44"
      :sub="f.sub"
      :span="f.span"
      :progress="f.progress"
      :to="f.to"
    >
      <div v-if="f.title" class="name">{{ f.title }}</div>
    </NxField>
  </NxBento>
</template>

<style scoped>
.name {
  margin-top: auto;
  padding-top: 8px;
  font-family: var(--font-serif);
  font-size: 22px;
  line-height: 1.1;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
