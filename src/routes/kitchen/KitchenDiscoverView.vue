<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import NexusPageWrapper from '@components/nexus-page-wrapper/NexusPageWrapper.vue'
import NexusDiscoverMealCard from '@components/nexus-discover-meal-card/NexusDiscoverMealCard.vue'
import NexusSkeletonCards from '@components/nexus-skeleton-cards/NexusSkeletonCards.vue'
import NexusRecipeIcon from '@components/nexus-recipe-icon/NexusRecipeIcon.vue'
import { useKitchenStore } from '@stores/food-drink/kitchen.store'

const kitchen = useKitchenStore()
const router = useRouter()
const q = ref('')
const category = ref<string | null>(null)
const area = ref<string | null>(null)

onMounted(async () => {
  await kitchen.loadFilters()
  await kitchen.browseDiscover({ category: 'Seafood' })
})

async function search(): Promise<void> {
  if (q.value.trim()) {
    await kitchen.searchDiscover(q.value.trim())
    return
  }
  await kitchen.browseDiscover({
    category: category.value || undefined,
    area: area.value || undefined,
  })
}

function viewMeal(mealdbId: string): void {
  void router.push({
    name: 'kitchen-meal-preview',
    params: { mealdbId },
  })
}

async function loadRandomAndView(): Promise<void> {
  await kitchen.loadRandom()
  if (kitchen.randomMeal?.mealdb_id) {
    viewMeal(kitchen.randomMeal.mealdb_id)
  }
}
</script>

<template>
  <NexusPageWrapper show-toolbar title="Discover recipes">
    <template #toolbar>
      <Button
        label="My recipes"
        icon="pi pi-bookmark"
        text
        @click="router.push({ name: 'kitchen' })"
      />
      <Button
        label="Surprise me"
        icon="pi pi-sparkles"
        severity="secondary"
        @click="loadRandomAndView"
      />
    </template>

    <div class="discover">
      <header class="hero">
        <div class="icon-wrap">
          <NexusRecipeIcon :size="26" />
        </div>
        <div>
          <p class="eyebrow">Cellar & Kitchen</p>
          <h2>Discover recipes</h2>
          <p class="muted">
            Browse TheMealDB, open a recipe to read it, then save the ones you
            want to keep.
          </p>
        </div>
      </header>

      <div class="filters">
        <IconField class="grow">
          <InputIcon class="pi pi-search" />
          <InputText
            v-model="q"
            placeholder="Search meals…"
            class="w-full"
            @keyup.enter="search"
          />
        </IconField>
        <Select
          v-model="category"
          :options="kitchen.filters?.categories ?? []"
          placeholder="Category"
          show-clear
          class="filter-select"
        />
        <Select
          v-model="area"
          :options="kitchen.filters?.areas ?? []"
          placeholder="Cuisine"
          show-clear
          class="filter-select"
        />
        <Button label="Search" @click="search" />
      </div>

      <NexusSkeletonCards v-if="kitchen.discoverLoading" :cards="8" />
      <div v-else-if="kitchen.discover.length" class="grid">
        <NexusDiscoverMealCard
          v-for="m in kitchen.discover"
          :key="m.mealdb_id"
          :meal="m"
          @select="viewMeal"
        />
      </div>
      <div v-else class="empty-panel">
        <p>No meals found for that search.</p>
        <Button
          label="Browse seafood"
          severity="secondary"
          @click="
            category = 'Seafood';
            area = null;
            q = '';
            search();
          "
        />
      </div>
    </div>
  </NexusPageWrapper>
</template>

<style scoped>
.discover {
  display: flex;
  flex-direction: column;
  gap: 1.15rem;
}

.hero {
  display: flex;
  gap: 0.95rem;
  padding: 1.15rem 1.25rem;
  border-radius: 1rem;
  background: var(--kitchen-card-surface);
}

.icon-wrap {
  width: 3rem;
  height: 3rem;
  border-radius: 0.75rem;
  display: grid;
  place-items: center;
  flex-shrink: 0;
  background: color-mix(in srgb, var(--kitchen-accent) 22%, transparent);
  color: var(--kitchen-accent);
}

.eyebrow {
  margin: 0;
  font-size: 0.75rem;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  opacity: 0.65;
}

h2 {
  margin: 0.15rem 0;
  font-size: 1.45rem;
}

.muted {
  margin: 0;
  opacity: 0.72;
  font-size: 0.92rem;
  max-width: 36rem;
}

.filters {
  display: flex;
  flex-wrap: wrap;
  gap: 0.55rem;
  align-items: center;
}

.grow {
  flex: 1 1 14rem;
  min-width: 12rem;
}

.filter-select {
  width: 11rem;
}

.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 1rem;
}

.empty-panel {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 1.25rem;
  border-radius: 1rem;
  background: color-mix(in srgb, var(--coffee-bean-panel) 90%, transparent);
}

.empty-panel p {
  margin: 0;
  opacity: 0.7;
}

@media (max-width: 640px) {
  .filter-select {
    width: 100%;
  }
}
</style>
