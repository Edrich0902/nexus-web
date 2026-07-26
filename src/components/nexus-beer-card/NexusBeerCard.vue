<script setup lang="ts">
import { RouterLink } from 'vue-router'
import NexusRatingDisplay from '@components/nexus-rating-display/NexusRatingDisplay.vue'
import type { BeerBeer } from '@/types/food-drink/beer'

defineProps<{ beer: BeerBeer }>()
</script>

<template>
  <RouterLink :to="{ name: 'beer-detail', params: { beerId: beer.id } }" class="beer-card">
    <div class="body">
      <h3>{{ beer.name }}</h3>
      <p class="meta">
        <span v-if="beer.brewery">{{ beer.brewery.name }}</span>
        <span v-if="beer.style"> · {{ beer.style.name }}</span>
        <span v-if="beer.abv != null"> · {{ beer.abv }}% ABV</span>
      </p>
      <NexusRatingDisplay
        :model-value="beer.rating"
        accent="var(--beer-accent, #d8a13a)"
      />
    </div>
  </RouterLink>
</template>

<style scoped>
.beer-card {
  display: block;
  padding: 0.95rem;
  border-radius: 0.85rem;
  background: var(--beer-card-surface);
  text-decoration: none;
  color: inherit;
}

h3 {
  margin: 0;
  font-size: 1rem;
}

.meta {
  margin: 0.3rem 0 0.55rem;
  font-size: 0.85rem;
  opacity: 0.7;
}
</style>
