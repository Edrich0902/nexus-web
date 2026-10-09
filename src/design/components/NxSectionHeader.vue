<script setup lang="ts">
import type { RouteLocationRaw } from 'vue-router'

defineProps<{
  title: string
  /** Optional right-hand link. */
  actionLabel?: string
  to?: RouteLocationRaw
}>()

defineEmits<{ action: [] }>()
</script>

<template>
  <div class="nx-section-header">
    <h2 class="nx-label">{{ title }}</h2>
    <slot name="action">
      <RouterLink v-if="actionLabel && to" :to="to" class="action">{{ actionLabel }}</RouterLink>
      <button v-else-if="actionLabel" type="button" class="action" @click="$emit('action')">
        {{ actionLabel }}
      </button>
    </slot>
  </div>
</template>

<style scoped>
.nx-section-header {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
  margin: 0 0 14px;
}

h2 {
  margin: 0;
}

.action {
  border: 0;
  padding: 0;
  background: none;
  font-size: 13px;
  color: var(--ink-3);
  cursor: pointer;
  white-space: nowrap;
}

.action:hover {
  color: var(--ink);
}
</style>
