<script setup lang="ts">
import { computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import NexusPageWrapper from '@components/nexus-page-wrapper/NexusPageWrapper.vue'
import { useBeerStore } from '@stores/food-drink/beer.store'

const beer = useBeerStore()
const route = useRoute()
const router = useRouter()
const breweryId = computed(() => Number(route.params.breweryId))

onMounted(() => {
  if (Number.isFinite(breweryId.value)) void beer.loadBrewery(breweryId.value)
})
watch(breweryId, (id) => {
  if (Number.isFinite(id)) void beer.loadBrewery(id)
})
</script>

<template>
  <NexusPageWrapper show-toolbar title="Brewery">
    <template #toolbar>
      <Button label="Back" icon="pi pi-arrow-left" text @click="router.push({ name: 'beer' })" />
    </template>

    <div v-if="beer.brewery" class="panel">
      <p class="eyebrow">{{ beer.brewery.source }}</p>
      <h2>{{ beer.brewery.name }}</h2>
      <p>
        {{ [beer.brewery.city, beer.brewery.country].filter(Boolean).join(', ') }}
      </p>
      <a
        v-if="beer.brewery.website_url"
        :href="beer.brewery.website_url"
        target="_blank"
        rel="noopener"
      >
        Website
      </a>
    </div>
  </NexusPageWrapper>
</template>

<style scoped>
.panel {
  padding: 1.2rem; border-radius: 1rem; background: var(--beer-card-surface);
}
.eyebrow { margin: 0; font-size: 0.75rem; text-transform: uppercase; opacity: 0.65; }
h2 { margin: 0.2rem 0; }
a { color: var(--beer-accent); }
</style>
