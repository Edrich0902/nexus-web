<script setup lang="ts">
import { provide } from 'vue'
import { BENTO_COLS } from './bento'

/**
 * Grid for colour fields. Fields span columns by importance on desktop and
 * collapse to 4 columns on tablet and 2 on phones.
 */
const props = withDefaults(
  defineProps<{
    cols?: number
    /** Row height in px on desktop / tablet. Phones size rows to content. */
    rowHeight?: number
    gap?: number
  }>(),
  { cols: 12, rowHeight: 124, gap: 10 },
)

provide(BENTO_COLS, props.cols)
</script>

<template>
  <div
    class="nx-bento"
    :style="{ '--cols': cols, '--row': `${rowHeight}px`, '--gap': `${gap}px` }"
  >
    <slot />
  </div>
</template>

<style scoped>
.nx-bento {
  display: grid;
  grid-template-columns: repeat(var(--cols), minmax(0, 1fr));
  grid-auto-rows: var(--row);
  gap: var(--gap);
}

@media (max-width: 960px) {
  .nx-bento {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }
}

@media (max-width: 640px) {
  .nx-bento {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    grid-auto-rows: minmax(min(var(--row), 132px), auto);
  }
}
</style>
