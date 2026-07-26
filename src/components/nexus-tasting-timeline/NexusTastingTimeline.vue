<script setup lang="ts">
import NexusRatingInput from '@components/nexus-rating-input/NexusRatingInput.vue'
import type { CellarWineTasting } from '@/types/food-drink/cellar'

defineProps<{
  tastings: CellarWineTasting[]
}>()

const emit = defineEmits<{
  remove: [tastingId: number]
}>()
</script>

<template>
  <div class="timeline">
    <p v-if="!tastings.length" class="empty">No tastings logged yet.</p>
    <article v-for="t in tastings" :key="t.id" class="entry">
      <div class="when">
        <strong>{{ t.tasted_on }}</strong>
        <span v-if="t.occasion">{{ t.occasion }}</span>
      </div>
      <div class="body">
        <NexusRatingInput :model-value="t.rating" readonly />
        <p v-if="t.notes">{{ t.notes }}</p>
        <p v-if="t.location" class="loc">{{ t.location }}</p>
      </div>
      <Button
        icon="pi pi-trash"
        text
        severity="danger"
        aria-label="Delete tasting"
        @click="emit('remove', t.id)"
      />
    </article>
  </div>
</template>

<style scoped>
.timeline {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.entry {
  display: grid;
  grid-template-columns: 8rem 1fr auto;
  gap: 0.75rem;
  padding: 0.75rem 0;
  border-bottom: 1px solid color-mix(in srgb, var(--lavender-blush) 10%, transparent);
}

.when {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  font-size: 0.85rem;
}

.when span,
.loc {
  opacity: 0.65;
  font-size: 0.8rem;
}

.body p {
  margin: 0.35rem 0 0;
  font-size: 0.9rem;
}

.empty {
  opacity: 0.65;
}

@media (max-width: 640px) {
  .entry {
    grid-template-columns: 1fr auto;
  }

  .when {
    grid-column: 1 / -1;
  }
}
</style>
