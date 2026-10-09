<script setup lang="ts">
import NxEmptyState from '../components/NxEmptyState.vue'
import NxSkeletonStage from '../components/skeletons/NxSkeletonStage.vue'
import NxSkeletonFields from '../components/skeletons/NxSkeletonFields.vue'
import type { ViewState } from './types'

/**
 * Module landing page: stage → summary fields → toolbar → collection.
 * Content slots render only when `state` is ready; loading / empty / error
 * have sensible defaults that can be overridden by slot.
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
    emptyTitle: 'Nothing here yet',
    emptyBody: undefined,
    errorTitle: 'Something went wrong',
    errorBody: 'We could not load this right now. Try again in a moment.',
  },
)
</script>

<template>
  <div class="nx-index">
    <slot v-if="state !== 'loading'" name="stage" />
    <NxSkeletonStage v-else :visual="false" />

    <div v-if="$slots.fields" class="fields">
      <slot v-if="state !== 'loading'" name="fields" />
      <NxSkeletonFields v-else />
    </div>

    <div v-if="$slots.toolbar" class="toolbar">
      <slot name="toolbar" />
    </div>

    <div class="content">
      <slot v-if="state === 'loading'" name="loading">
        <NxSkeletonFields :spans="[3, 3, 3, 3, 3, 3, 3, 3]" :row-height="180" />
      </slot>
      <slot v-else-if="state === 'error'" name="error">
        <NxEmptyState :title="errorTitle" :body="errorBody" icon="close" tone="error" />
      </slot>
      <slot v-else-if="state === 'empty'" name="empty">
        <NxEmptyState :title="emptyTitle" :body="emptyBody" />
      </slot>
      <slot v-else />
    </div>
  </div>
</template>

<style scoped>
.nx-index {
  display: flex;
  flex-direction: column;
  gap: 36px;
}

.toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px;
}

@media (max-width: 640px) {
  .nx-index {
    gap: 24px;
  }
}
</style>
