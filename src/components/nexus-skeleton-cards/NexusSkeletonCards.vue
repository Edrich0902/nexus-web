<script setup lang="ts">
withDefaults(
  defineProps<{
    cards?: number
  }>(),
  {
    cards: 6,
  },
)
</script>

<template>
  <div class="skeleton-cards" :aria-busy="true" aria-live="polite">
    <div v-for="n in cards" :key="n" class="card">
      <Skeleton width="100%" height="100%" border-radius="0.6rem" class="art" />
      <Skeleton width="70%" height="0.75rem" />
    </div>
  </div>
</template>

<style scoped>
.skeleton-cards {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(7.5rem, 1fr));
  gap: 0.85rem;
}

.card {
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
}

.art {
  aspect-ratio: 1;
  min-height: 7rem;
}
</style>
