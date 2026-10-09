<script setup lang="ts">
/** Responsive grid for NxCoverCard: fills the row, two columns on phones. */
withDefaults(defineProps<{ min?: number }>(), { min: 180 })
</script>

<template>
  <div class="nx-cover-grid" :style="{ '--min': `${min}px` }">
    <slot />
  </div>
</template>

<style scoped>
.nx-cover-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(var(--min), 1fr));
  gap: 32px 20px;
}

@media (max-width: 640px) {
  .nx-cover-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 24px 14px;
  }
}
</style>
