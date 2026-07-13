<script setup lang="ts">
withDefaults(
  defineProps<{
    rows?: number
    /** Track-style row with art thumb + two text lines */
    variant?: 'track' | 'plain' | 'repo' | 'session'
  }>(),
  {
    rows: 5,
    variant: 'track',
  },
)
</script>

<template>
  <div class="skeleton-list" :aria-busy="true" aria-live="polite">
    <div
      v-for="n in rows"
      :key="n"
      class="skeleton-row"
      :class="`variant-${variant}`"
    >
      <Skeleton
        v-if="variant === 'track'"
        width="2.5rem"
        height="2.5rem"
        border-radius="0.4rem"
      />
      <Skeleton
        v-else-if="variant === 'session'"
        shape="circle"
        size="2.25rem"
      />
      <div class="lines">
        <Skeleton
          :width="variant === 'plain' ? '55%' : '42%'"
          height="0.85rem"
        />
        <Skeleton
          v-if="variant !== 'plain'"
          :width="variant === 'repo' ? '70%' : '28%'"
          height="0.65rem"
        />
      </div>
      <Skeleton
        v-if="variant === 'track' || variant === 'session'"
        width="2.5rem"
        height="0.65rem"
        class="trailing"
      />
    </div>
  </div>
</template>

<style scoped>
.skeleton-list {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  width: 100%;
}

.skeleton-row {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.45rem 0;
  min-width: 0;
}

.skeleton-row.variant-repo,
.skeleton-row.variant-session {
  padding: 0.65rem 0.15rem;
}

.lines {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.trailing {
  flex-shrink: 0;
}
</style>
