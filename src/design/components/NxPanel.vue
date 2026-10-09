<script setup lang="ts">
import NxSectionHeader from './NxSectionHeader.vue'
import type { RouteLocationRaw } from 'vue-router'

/** Quiet surface for grouped content (lists, charts, forms). */
withDefaults(
  defineProps<{
    title?: string
    actionLabel?: string
    to?: RouteLocationRaw
    /** `flush` removes the surface and padding (section on the ambient). */
    variant?: 'surface' | 'flush'
  }>(),
  { title: undefined, actionLabel: undefined, to: undefined, variant: 'surface' },
)

defineEmits<{ action: [] }>()
</script>

<template>
  <section class="nx-panel" :class="`v-${variant}`">
    <NxSectionHeader
      v-if="title"
      :title="title"
      :action-label="actionLabel"
      :to="to"
      @action="$emit('action')"
    >
      <template v-if="$slots.action" #action><slot name="action" /></template>
    </NxSectionHeader>
    <slot />
  </section>
</template>

<style scoped>
.nx-panel {
  min-width: 0;
}

.v-surface {
  background: var(--surface);
  border-radius: var(--r-xl);
  padding: 20px 22px;
}

@media (max-width: 640px) {
  .v-surface {
    padding: 16px;
  }
}
</style>
