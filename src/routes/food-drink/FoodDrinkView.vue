<script setup lang="ts">
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import NexusPageWrapper from '@components/nexus-page-wrapper/NexusPageWrapper.vue'
import NexusFoodDrinkChrome from '@components/nexus-food-drink-chrome/NexusFoodDrinkChrome.vue'
import NexusFoodDrinkIcon from '@components/nexus-food-drink-icon/NexusFoodDrinkIcon.vue'
import NexusQuotaBadge from '@components/nexus-quota-badge/NexusQuotaBadge.vue'
import NexusSkeletonCards from '@components/nexus-skeleton-cards/NexusSkeletonCards.vue'
import { useFoodDrinkStore } from '@stores/food-drink/food-drink.store'

const store = useFoodDrinkStore()
const router = useRouter()

onMounted(() => {
  void store.loadDashboard()
})
</script>

<template>
  <NexusPageWrapper show-toolbar title="Food & Drink">
    <template #toolbar>
      <NexusQuotaBadge :quota="store.dashboard?.quota ?? null" />
    </template>

    <NexusFoodDrinkChrome />

    <NexusSkeletonCards v-if="store.dashboardLoading" :cards="4" />

    <div v-else-if="store.dashboard" class="hub">
      <header class="hero">
        <div class="icon-wrap"><NexusFoodDrinkIcon :size="28" /></div>
        <div>
          <p class="eyebrow">Modules</p>
          <h2>Food & Drink</h2>
          <p class="muted">
            Your wine journal, beer log, and recipe library — plus pairings and
            suggestions built from your own data.
          </p>
        </div>
      </header>

      <div class="stats">
        <button type="button" class="stat" @click="router.push({ name: 'cellar' })">
          <strong>{{ store.dashboard.counts.wines }}</strong>
          <span>Wines</span>
        </button>
        <button type="button" class="stat" @click="router.push({ name: 'beer' })">
          <strong>{{ store.dashboard.counts.beers }}</strong>
          <span>Beers</span>
        </button>
        <button type="button" class="stat" @click="router.push({ name: 'kitchen' })">
          <strong>{{ store.dashboard.counts.recipes }}</strong>
          <span>Recipes</span>
        </button>
        <button type="button" class="stat" @click="router.push({ name: 'food-drink-pairings' })">
          <strong>{{ store.dashboard.counts.pairings }}</strong>
          <span>Pairings</span>
        </button>
      </div>

      <section class="panel">
        <h3>Suggested pairings</h3>
        <ul v-if="store.dashboard.suggestions.length">
          <li v-for="(s, i) in store.dashboard.suggestions" :key="i">
            <strong>{{ s.drink_name }}</strong> × {{ s.recipe_name }}
            <small>{{ s.reasons[0] }}</small>
          </li>
        </ul>
        <p v-else class="empty">
          Save a few wines, beers, and recipes to unlock suggestions.
        </p>
      </section>

      <div class="cols">
        <section class="panel">
          <h3>Recent wines</h3>
          <ul v-if="store.dashboard.recent_wines.length">
            <li v-for="w in store.dashboard.recent_wines" :key="w.id">
              <button type="button" @click="router.push({ name: 'cellar-wine', params: { wineId: w.id } })">
                {{ w.name }}
              </button>
            </li>
          </ul>
          <p v-else class="empty">
            No wines yet.
            <Button label="Add a wine" link @click="router.push({ name: 'cellar' })" />
          </p>
        </section>
        <section class="panel">
          <h3>Recent beers</h3>
          <ul v-if="store.dashboard.recent_beers.length">
            <li v-for="b in store.dashboard.recent_beers" :key="b.id">
              <button type="button" @click="router.push({ name: 'beer-detail', params: { beerId: b.id } })">
                {{ b.name }}
              </button>
            </li>
          </ul>
          <p v-else class="empty">
            No beers yet.
            <Button label="Log a beer" link @click="router.push({ name: 'beer' })" />
          </p>
        </section>
        <section class="panel">
          <h3>Top recipes</h3>
          <ul v-if="store.dashboard.top_recipes.length">
            <li v-for="r in store.dashboard.top_recipes" :key="r.id">
              <button type="button" @click="router.push({ name: 'kitchen-recipe', params: { recipeId: r.id } })">
                {{ r.meal?.name }}
              </button>
            </li>
          </ul>
          <p v-else class="empty">
            No saved recipes yet.
            <Button label="Discover recipes" link @click="router.push({ name: 'kitchen-discover' })" />
          </p>
        </section>
      </div>
    </div>
  </NexusPageWrapper>
</template>

<style scoped>
.hub { display: flex; flex-direction: column; gap: 1rem; }
.hero {
  display: flex; gap: 0.9rem; padding: 1.2rem; border-radius: 1rem;
  background: var(--food-drink-card-surface);
}
.icon-wrap {
  width: 3rem; height: 3rem; border-radius: 0.75rem; display: grid; place-items: center;
  background: color-mix(in srgb, var(--food-drink-accent) 22%, transparent);
  color: var(--food-drink-accent);
}
.eyebrow { margin: 0; font-size: 0.75rem; text-transform: uppercase; opacity: 0.65; }
h2 { margin: 0.15rem 0; }
.muted { margin: 0; opacity: 0.7; }
.stats { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 0.65rem; }
.stat {
  border: 0; border-radius: 0.75rem; padding: 0.85rem;
  background: color-mix(in srgb, var(--coffee-bean-panel) 90%, transparent);
  color: inherit; cursor: pointer; text-align: left;
}
.stat strong { display: block; font-size: 1.35rem; }
.stat span { font-size: 0.75rem; opacity: 0.65; }
.panel {
  padding: 1rem; border-radius: 0.85rem;
  background: color-mix(in srgb, var(--coffee-bean-panel) 90%, transparent);
}
.panel h3 { margin: 0 0 0.55rem; font-size: 1rem; }
.panel ul { list-style: none; margin: 0; padding: 0; }
.panel li { padding: 0.35rem 0; border-bottom: 1px solid color-mix(in srgb, var(--lavender-blush) 8%, transparent); }
.panel button { border: 0; background: transparent; color: inherit; cursor: pointer; padding: 0; }
.panel small { display: block; opacity: 0.65; font-size: 0.8rem; }
.cols { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 0.85rem; }
.empty { opacity: 0.65; margin: 0; }
.empty :deep(.p-button) {
  padding-inline: 0.15rem;
  vertical-align: baseline;
}
@media (max-width: 1000px) {
  .stats { grid-template-columns: 1fr 1fr; }
  .cols { grid-template-columns: 1fr; }
}
</style>
