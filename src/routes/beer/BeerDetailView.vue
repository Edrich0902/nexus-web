<script setup lang="ts">
import { computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import NexusPageWrapper from '@components/nexus-page-wrapper/NexusPageWrapper.vue'
import NexusRatingInput from '@components/nexus-rating-input/NexusRatingInput.vue'
import NexusSkeletonMedia from '@components/nexus-skeleton-media/NexusSkeletonMedia.vue'
import { useBeerStore } from '@stores/food-drink/beer.store'

const beer = useBeerStore()
const route = useRoute()
const router = useRouter()
const beerId = computed(() => Number(route.params.beerId))

async function load(): Promise<void> {
  if (Number.isFinite(beerId.value)) await beer.loadBeer(beerId.value)
}

onMounted(load)
watch(beerId, load)

async function remove(): Promise<void> {
  if (await beer.removeBeer(beerId.value)) {
    await router.push({ name: 'beer' })
  }
}
</script>

<template>
  <NexusPageWrapper show-toolbar title="Beer detail">
    <template #toolbar>
      <Button label="Back" icon="pi pi-arrow-left" text @click="router.push({ name: 'beer' })" />
    </template>

    <NexusSkeletonMedia v-if="beer.beerLoading" />
    <div v-else-if="beer.beer" class="detail">
      <header class="hero">
        <div>
          <p class="eyebrow">{{ beer.beer.style?.name || 'Beer' }}</p>
          <h2>{{ beer.beer.name }}</h2>
          <p class="meta">
            <RouterLink
              v-if="beer.beer.brewery"
              :to="{ name: 'beer-brewery', params: { breweryId: beer.beer.brewery.id } }"
            >
              {{ beer.beer.brewery.name }}
            </RouterLink>
            <span v-if="beer.beer.abv != null"> · {{ beer.beer.abv }}% ABV</span>
            <span v-if="beer.beer.ibu != null"> · {{ beer.beer.ibu }} IBU</span>
          </p>
          <NexusRatingInput :model-value="beer.beer.rating" readonly />
          <Button icon="pi pi-trash" severity="danger" text class="mt" @click="remove" />
        </div>
      </header>
      <section v-if="beer.beer.notes" class="panel">
        <h3>Notes</h3>
        <p>{{ beer.beer.notes }}</p>
      </section>
    </div>
  </NexusPageWrapper>
</template>

<style scoped>
.hero {
  padding: 1.2rem; border-radius: 1rem; background: var(--beer-card-surface);
}
.eyebrow { margin: 0; font-size: 0.75rem; text-transform: uppercase; opacity: 0.65; }
h2 { margin: 0.2rem 0; }
.meta { margin: 0 0 0.6rem; opacity: 0.75; }
.meta a { color: var(--beer-accent); }
.panel {
  margin-top: 1rem; padding: 1rem; border-radius: 0.85rem;
  background: color-mix(in srgb, var(--coffee-bean-panel) 90%, transparent);
}
.mt { margin-top: 0.75rem; }
</style>
