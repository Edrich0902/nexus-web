<script setup lang="ts">
import NxBento from '../NxBento.vue'

/** Placeholder bento: pass the spans you expect (default: a typical 4-field row). */
withDefaults(defineProps<{ spans?: number[]; rowHeight?: number }>(), {
  spans: () => [5, 3, 2, 2],
  rowHeight: 124,
})
</script>

<template>
  <NxBento :row-height="rowHeight" aria-busy="true" aria-live="polite">
    <div v-for="(span, i) in spans" :key="i" class="sk" :style="{ '--span': span }">
      <Skeleton width="100%" height="100%" border-radius="var(--r-xl)" />
    </div>
  </NxBento>
</template>

<style scoped>
.sk {
  grid-column: span var(--span);
  min-height: 120px;
}

@media (max-width: 960px) {
  .sk {
    grid-column: span 2;
  }
}

@media (max-width: 640px) {
  .sk {
    grid-column: span 1;
  }
}
</style>
