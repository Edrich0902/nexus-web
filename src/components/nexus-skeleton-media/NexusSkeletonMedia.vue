<script setup lang="ts">
import NexusSkeletonList from '@components/nexus-skeleton-list/NexusSkeletonList.vue'

withDefaults(
  defineProps<{
    /** Extra list rows under the hero */
    rows?: number
  }>(),
  {
    rows: 6,
  },
)
</script>

<template>
  <div class="skeleton-media" :aria-busy="true" aria-live="polite">
    <header class="hero">
      <Skeleton width="100%" height="100%" border-radius="0.85rem" class="art" />
      <div class="copy">
        <Skeleton width="5rem" height="0.7rem" />
        <Skeleton width="80%" height="1.6rem" />
        <Skeleton width="60%" height="0.9rem" />
        <Skeleton
          width="8rem"
          height="2.25rem"
          border-radius="0.5rem"
          class="cta"
        />
      </div>
    </header>
    <NexusSkeletonList v-if="rows > 0" :rows="rows" variant="track" />
  </div>
</template>

<style scoped>
.skeleton-media {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  width: 100%;
}

.hero {
  display: grid;
  grid-template-columns: minmax(8rem, 12rem) 1fr;
  gap: 1.25rem;
  align-items: center;
}

@media (max-width: 640px) {
  .hero {
    grid-template-columns: 1fr;
  }
}

.art {
  aspect-ratio: 1;
  min-height: 8rem;
}

.copy {
  display: flex;
  flex-direction: column;
  gap: 0.65rem;
  min-width: 0;
}

.cta {
  margin-top: 0.35rem;
}
</style>
