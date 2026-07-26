<script setup lang="ts">
import { RouterLink } from 'vue-router'
import NexusImage from '@components/nexus-image/NexusImage.vue'
import NexusRatingDisplay from '@components/nexus-rating-display/NexusRatingDisplay.vue'
import type { CellarWine } from '@/types/food-drink/cellar'

defineProps<{
  wine: CellarWine
}>()

function matchSeverity(status: string): 'success' | 'warn' | 'secondary' | 'contrast' {
  if (status === 'matched') return 'success'
  if (status === 'no_match') return 'secondary'
  if (status === 'matching') return 'warn'
  return 'contrast'
}
</script>

<template>
  <RouterLink :to="{ name: 'cellar-wine', params: { wineId: wine.id } }" class="wine-card">
    <NexusImage
      :src="wine.catalog?.image_url"
      :alt="wine.name"
      size="md"
      rounded
    />
    <div class="body">
      <div class="top">
        <h3>{{ wine.name }}</h3>
        <Tag
          :value="wine.match_status.replace('_', ' ')"
          :severity="matchSeverity(wine.match_status)"
          rounded
        />
      </div>
      <p class="meta">
        <span v-if="wine.producer_name">{{ wine.producer_name }}</span>
        <span v-if="wine.vintage"> · {{ wine.vintage }}</span>
        <span v-if="wine.region_name || wine.country">
          · {{ wine.region_name || wine.country }}
        </span>
      </p>
      <div class="foot">
        <NexusRatingDisplay :model-value="wine.rating" />
        <span class="tastings">{{ wine.tastings_count ?? 0 }} tastings</span>
      </div>
    </div>
  </RouterLink>
</template>

<style scoped>
.wine-card {
  display: flex;
  gap: 0.9rem;
  padding: 0.9rem;
  border-radius: 0.85rem;
  background: var(--wine-card-surface);
  text-decoration: none;
  color: inherit;
  transition: transform 0.15s ease;
}

.wine-card:hover {
  transform: translateY(-1px);
}

.body {
  flex: 1;
  min-width: 0;
}

.top {
  display: flex;
  justify-content: space-between;
  gap: 0.5rem;
  align-items: flex-start;
}

h3 {
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
}

.meta {
  margin: 0.25rem 0 0.55rem;
  font-size: 0.85rem;
  color: color-mix(in srgb, var(--lavender-blush) 65%, transparent);
}

.foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.tastings {
  font-size: 0.75rem;
  opacity: 0.65;
  white-space: nowrap;
}
</style>
