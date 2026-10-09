<script setup lang="ts">
import NxEmptyState from '../components/NxEmptyState.vue'
import NxSkeletonStage from '../components/skeletons/NxSkeletonStage.vue'
import NxSkeletonFields from '../components/skeletons/NxSkeletonFields.vue'
import type { ViewState } from './types'

/**
 * Analysis page: stage with a range control → headline fields → a two-column
 * grid of panels (charts, rank lists) that collapses to one column.
 */
withDefaults(
  defineProps<{
    state?: ViewState
    emptyTitle?: string
    emptyBody?: string
    errorTitle?: string
    errorBody?: string
  }>(),
  {
    state: 'ready',
    emptyTitle: 'Not enough data yet',
    emptyBody: 'Stats appear once there is some history to look at.',
    errorTitle: 'Could not load stats',
    errorBody: 'Try again in a moment.',
  },
)
</script>

<template>
  <div class="nx-stats">
    <div class="head">
      <slot name="stage" />
      <div v-if="$slots.range" class="range"><slot name="range" /></div>
    </div>

    <template v-if="state === 'loading'">
      <NxSkeletonStage :visual="false" />
      <NxSkeletonFields :spans="[3, 3, 3, 3]" />
      <NxSkeletonFields :spans="[6, 6]" :row-height="280" />
    </template>
    <slot v-else-if="state === 'error'" name="error">
      <NxEmptyState :title="errorTitle" :body="errorBody" icon="close" tone="error" />
    </slot>
    <slot v-else-if="state === 'empty'" name="empty">
      <NxEmptyState :title="emptyTitle" :body="emptyBody" />
    </slot>
    <template v-else>
      <slot name="summary" />
      <slot name="fields" />
      <div class="panels"><slot /></div>
    </template>
  </div>
</template>

<style scoped>
.nx-stats {
  display: flex;
  flex-direction: column;
  gap: 36px;
}

.head {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.panels {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
}

.panels > :deep(.wide) {
  grid-column: 1 / -1;
}

@media (max-width: 960px) {
  .panels {
    grid-template-columns: minmax(0, 1fr);
  }
}

@media (max-width: 640px) {
  .nx-stats {
    gap: 24px;
  }
}
</style>
