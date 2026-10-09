<script setup lang="ts">
import type { RouteLocationRaw } from 'vue-router'
import NxIcon from '../components/NxIcon.vue'
import NxEmptyState from '../components/NxEmptyState.vue'
import NxSkeletonStage from '../components/skeletons/NxSkeletonStage.vue'
import NxSkeletonFields from '../components/skeletons/NxSkeletonFields.vue'
import type { ViewState } from './types'

/**
 * Single item page: back link → stage (artwork + serif title) → main column
 * with an optional 420px aside that drops below on tablets and phones.
 */
withDefaults(
  defineProps<{
    state?: ViewState
    backTo?: RouteLocationRaw
    backLabel?: string
    errorTitle?: string
    errorBody?: string
    /** When the aside drops below on narrow screens, show it first instead. */
    asideFirst?: boolean
  }>(),
  {
    state: 'ready',
    backTo: undefined,
    backLabel: 'Back',
    asideFirst: false,
    errorTitle: 'Could not load this',
    errorBody: 'It may have been removed, or the connection dropped.',
  },
)
</script>

<template>
  <div class="nx-detail">
    <RouterLink v-if="backTo" :to="backTo" class="back">
      <NxIcon name="chevron-left" :size="16" />{{ backLabel }}
    </RouterLink>

    <template v-if="state === 'loading'">
      <slot name="loading">
        <NxSkeletonStage />
        <NxSkeletonFields />
      </slot>
    </template>
    <slot v-else-if="state === 'error' || state === 'empty'" name="error">
      <NxEmptyState :title="errorTitle" :body="errorBody" icon="close" tone="error" />
    </slot>
    <template v-else>
      <slot name="stage" />
      <div class="body" :class="{ 'has-aside': $slots.aside, 'aside-first': asideFirst }">
        <div class="main"><slot /></div>
        <aside v-if="$slots.aside" class="aside"><slot name="aside" /></aside>
      </div>
    </template>
  </div>
</template>

<style scoped>
.nx-detail {
  display: flex;
  flex-direction: column;
  gap: 36px;
}

.back {
  align-self: flex-start;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 13px;
  color: var(--ink-3);
  margin-bottom: -20px;
}

.back:hover {
  color: var(--ink);
}

.body {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 28px;
  align-items: start;
}

.body.has-aside {
  grid-template-columns: minmax(0, 1fr) 420px;
}

.main,
.aside {
  display: flex;
  flex-direction: column;
  gap: 28px;
  min-width: 0;
}

@media (max-width: 960px) {
  .body.has-aside {
    grid-template-columns: minmax(0, 1fr);
  }

  .aside-first .aside {
    order: -1;
  }
}

@media (max-width: 640px) {
  .nx-detail {
    gap: 24px;
  }

  .back {
    margin-bottom: -10px;
  }
}
</style>
