<script setup lang="ts">
/**
 * Dense tool layout (pull requests, diffs, admin): compact header, a list
 * rail and a main pane that each scroll independently on desktop. On tablets
 * and phones the rail stacks above the pane and the page scrolls normally.
 */
withDefaults(defineProps<{ railWidth?: number }>(), { railWidth: 340 })
</script>

<template>
  <div class="nx-workbench" :style="{ '--rail': `${railWidth}px` }">
    <header v-if="$slots.header" class="head"><slot name="header" /></header>
    <div class="panes" :class="{ 'has-rail': $slots.rail }">
      <nav v-if="$slots.rail" class="rail"><slot name="rail" /></nav>
      <div class="pane"><slot /></div>
    </div>
  </div>
</template>

<style scoped>
.nx-workbench {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.head {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.panes {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 14px;
}

.panes.has-rail {
  grid-template-columns: var(--rail) minmax(0, 1fr);
}

.rail,
.pane {
  min-width: 0;
  background: var(--surface);
  border-radius: var(--r-xl);
  padding: 14px;
}

.panes.has-rail .rail,
.panes.has-rail .pane {
  height: calc(100dvh - var(--shell-top) - var(--shell-dock-space) - 90px);
  min-height: 420px;
  overflow: auto;
  overscroll-behavior: contain;
}

@media (max-width: 960px) {
  .panes.has-rail {
    grid-template-columns: minmax(0, 1fr);
  }

  .panes.has-rail .rail,
  .panes.has-rail .pane {
    height: auto;
    min-height: 0;
    overflow: visible;
  }

  .panes.has-rail .rail {
    max-height: 40dvh;
    overflow: auto;
  }
}
</style>
