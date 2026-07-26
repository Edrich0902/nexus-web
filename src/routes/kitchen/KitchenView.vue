<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import NexusPageWrapper from '@components/nexus-page-wrapper/NexusPageWrapper.vue'
import NexusRecipeIcon from '@components/nexus-recipe-icon/NexusRecipeIcon.vue'
import NexusRecipeCard from '@components/nexus-recipe-card/NexusRecipeCard.vue'
import NexusSkeletonCards from '@components/nexus-skeleton-cards/NexusSkeletonCards.vue'
import { useKitchenStore } from '@stores/food-drink/kitchen.store'

const kitchen = useKitchenStore()
const router = useRouter()
const filter = ref('')

onMounted(() => {
  void kitchen.loadRecipes()
})

async function search(): Promise<void> {
  await kitchen.loadRecipes({ q: filter.value || undefined })
}
</script>

<template>
  <NexusPageWrapper show-toolbar title="Recipes">
    <template #toolbar>
      <Button
        label="Discover"
        icon="pi pi-compass"
        severity="secondary"
        @click="router.push({ name: 'kitchen-discover' })"
      />
    </template>

    <div class="kitchen-page">
      <header class="hero">
        <div class="icon-wrap"><NexusRecipeIcon :size="28" /></div>
        <div>
          <p class="eyebrow">Cellar & Kitchen</p>
          <h2>Saved recipes</h2>
          <p class="muted">Import meals from TheMealDB and keep your favourites local.</p>
        </div>
      </header>

      <div class="filters">
        <InputText
          v-model="filter"
          placeholder="Filter saved recipes…"
          class="grow"
          @keyup.enter="search"
        />
        <Button label="Search" icon="pi pi-search" severity="secondary" @click="search" />
      </div>

      <NexusSkeletonCards v-if="kitchen.recipesLoading" :cards="4" />
      <div v-else-if="kitchen.recipes.length" class="grid">
        <NexusRecipeCard v-for="r in kitchen.recipes" :key="r.id" :recipe="r" />
      </div>
      <p v-else class="empty">
        No saved recipes yet.
        <Button label="Discover meals" link @click="router.push({ name: 'kitchen-discover' })" />
      </p>
    </div>
  </NexusPageWrapper>
</template>

<style scoped>
.kitchen-page {
  display: flex;
  flex-direction: column;
  gap: 1.1rem;
}

.hero {
  display: flex;
  gap: 0.9rem;
  padding: 1.2rem;
  border-radius: 1rem;
  background: var(--kitchen-card-surface);
}

.icon-wrap {
  width: 3rem;
  height: 3rem;
  border-radius: 0.75rem;
  display: grid;
  place-items: center;
  background: color-mix(in srgb, var(--kitchen-accent) 22%, transparent);
  color: var(--kitchen-accent);
}

.eyebrow {
  margin: 0;
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  opacity: 0.65;
}

h2 {
  margin: 0.15rem 0;
}

.muted {
  margin: 0;
  opacity: 0.7;
}

.filters {
  display: flex;
  gap: 0.5rem;
}

.grow {
  flex: 1;
}

.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(12.5rem, 1fr));
  gap: 1rem;
}

.empty {
  opacity: 0.7;
}
</style>
