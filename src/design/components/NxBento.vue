<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, provide, ref, watch } from 'vue'
import { BENTO_COLS } from './bento'

/**
 * Grid for colour fields, or masonry columns when `layout="masonry"` so tall
 * media never leaves a hole beside it (home board).
 * Masonry wraps in a height-tweening shell so content above/below slides
 * smoothly when cards grow or shrink (matches mobile AnimatedSize).
 */
const props = withDefaults(
  defineProps<{
    cols?: number
    /** Row height in px on desktop / tablet (grid layout). */
    rowHeight?: number
    gap?: number
    /** `grid` = spanned tracks; `masonry` = dense columns that hug content. */
    layout?: 'grid' | 'masonry'
  }>(),
  { cols: 12, rowHeight: 124, gap: 10, layout: 'grid' },
)

provide(BENTO_COLS, props.cols)

const inner = ref<HTMLElement | null>(null)
const shellHeight = ref<number | null>(null)
const ready = ref(false)
let observer: ResizeObserver | null = null
let firstMeasure = true

function measure(): void {
  const el = inner.value
  if (!el) return
  const next = Math.ceil(el.getBoundingClientRect().height)
  if (firstMeasure) {
    shellHeight.value = next
    firstMeasure = false
    // Enable transition after the first paint so load isn't animated from 0.
    requestAnimationFrame(() => {
      ready.value = true
    })
    return
  }
  if (shellHeight.value === next) return
  shellHeight.value = next
}

onMounted(async () => {
  if (props.layout !== 'masonry') return
  await nextTick()
  measure()
  observer = new ResizeObserver(() => measure())
  if (inner.value) observer.observe(inner.value)
})

onBeforeUnmount(() => {
  observer?.disconnect()
  observer = null
})

watch(
  () => props.layout,
  async (layout) => {
    observer?.disconnect()
    observer = null
    firstMeasure = true
    ready.value = false
    shellHeight.value = null
    if (layout !== 'masonry') return
    await nextTick()
    measure()
    observer = new ResizeObserver(() => measure())
    if (inner.value) observer.observe(inner.value)
  },
)
</script>

<template>
  <div
    v-if="layout === 'masonry'"
    class="nx-bento-shell"
    :class="{ ready }"
    :style="shellHeight != null ? { height: `${shellHeight}px` } : undefined"
  >
    <div
      ref="inner"
      class="nx-bento masonry"
      :style="{ '--cols': cols, '--row': `${rowHeight}px`, '--gap': `${gap}px` }"
    >
      <slot />
    </div>
  </div>
  <div
    v-else
    class="nx-bento grid"
    :style="{ '--cols': cols, '--row': `${rowHeight}px`, '--gap': `${gap}px` }"
  >
    <slot />
  </div>
</template>

<style scoped>
.nx-bento-shell {
  overflow: hidden;
}

.nx-bento-shell.ready {
  transition: height 0.58s cubic-bezier(0.4, 0, 0.2, 1);
}

@media (prefers-reduced-motion: reduce) {
  .nx-bento-shell.ready {
    transition: none;
  }
}

.nx-bento.grid {
  display: grid;
  grid-template-columns: repeat(var(--cols), minmax(0, 1fr));
  grid-auto-rows: minmax(var(--row), auto);
  gap: var(--gap);
}

.nx-bento.masonry {
  columns: 2;
  column-gap: var(--gap);
}

.nx-bento.masonry :deep(.nx-field) {
  display: inline-flex;
  width: 100%;
  break-inside: avoid;
  margin: 0 0 var(--gap);
  grid-column: auto;
  grid-row: auto;
  height: auto;
  align-self: auto;
  min-height: 0;
}

.nx-bento.masonry :deep(.nx-field:not(.media)) {
  min-height: 120px;
}

.nx-bento.masonry :deep(.nx-field.wide) {
  column-span: all;
}

@media (min-width: 641px) {
  .nx-bento.masonry {
    columns: 3;
  }
}

@media (min-width: 1100px) {
  .nx-bento.masonry {
    columns: 4;
  }
}

@media (max-width: 960px) {
  .nx-bento.grid {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }
}

@media (max-width: 640px) {
  .nx-bento.grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    grid-auto-rows: minmax(min(var(--row), 132px), auto);
  }

  .nx-bento.masonry {
    columns: 2;
  }
}
</style>
