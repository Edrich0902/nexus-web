<script setup lang="ts">
import NxIcon from './NxIcon.vue'

/** Read-only score out of five: an accent star and a tabular number. */
withDefaults(defineProps<{ value?: number | null; size?: 'sm' | 'lg' }>(), {
  value: null,
  size: 'sm',
})
</script>

<template>
  <span
    class="nx-rating num"
    :class="[`s-${size}`, { empty: value == null }]"
    :aria-label="value != null ? `Rated ${value.toFixed(1)} out of 5` : 'Not rated'"
  >
    <NxIcon name="star" :size="size === 'lg' ? 20 : 14" />
    <span>{{ value != null ? value.toFixed(1) : 'Unrated' }}</span>
  </span>
</template>

<style scoped>
.nx-rating {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-weight: 600;
  font-size: 14px;
  color: var(--ink);
}

.nx-rating :deep(svg) {
  color: var(--acc);
  fill: currentColor;
}

.s-lg {
  font-size: 22px;
  gap: 8px;
}

.empty {
  color: var(--ink-3);
  font-weight: 500;
}

.empty :deep(svg) {
  fill: none;
  color: var(--ink-4);
}
</style>
