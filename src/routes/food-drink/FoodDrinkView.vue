<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import NexusPageWrapper from '@components/nexus-page-wrapper/NexusPageWrapper.vue'
import NexusFoodDrinkChrome from '@components/nexus-food-drink-chrome/NexusFoodDrinkChrome.vue'
import NexusImage from '@components/nexus-image/NexusImage.vue'
import NexusChart from '@components/nexus-chart/NexusChart.vue'
import NexusQuotaBadge from '@components/nexus-quota-badge/NexusQuotaBadge.vue'
import NexusSkeletonCards from '@components/nexus-skeleton-cards/NexusSkeletonCards.vue'
import { toDoughnutChartData } from '@lib/charts'
import { useFoodDrinkStore } from '@stores/food-drink/food-drink.store'
import type { MediaImage } from '@/types/media/media'

const store = useFoodDrinkStore()
const router = useRouter()

onMounted(() => {
  void store.loadDashboard()
})

type MosaicTile = {
  key: string
  label: string
  media?: MediaImage | null
  src?: string | null
  accent: string
}

const mosaicTiles = computed((): MosaicTile[] => {
  const dash = store.dashboard
  if (!dash) return []

  const tiles: MosaicTile[] = []

  for (const wine of dash.recent_wines) {
    tiles.push({
      key: `wine-${wine.id}`,
      label: wine.name,
      media: wine.media,
      src: wine.image_url,
      accent: 'var(--wine-accent)',
    })
  }
  for (const beer of dash.recent_beers) {
    tiles.push({
      key: `beer-${beer.id}`,
      label: beer.name,
      media: beer.media,
      src: beer.image_url,
      accent: 'var(--beer-accent)',
    })
  }
  for (const recipe of dash.top_recipes) {
    tiles.push({
      key: `recipe-${recipe.id}`,
      label: recipe.meal?.name ?? 'Recipe',
      media: recipe.media,
      src: recipe.image_url ?? recipe.meal?.thumb_url,
      accent: 'var(--kitchen-accent)',
    })
  }

  return tiles.slice(0, 8)
})

const portalCovers = computed(() => {
  const dash = store.dashboard
  return {
    cellar: {
      media: dash?.recent_wines[0]?.media ?? null,
      src: dash?.recent_wines[0]?.image_url ?? null,
    },
    beer: {
      media: dash?.recent_beers[0]?.media ?? null,
      src: dash?.recent_beers[0]?.image_url ?? null,
    },
    kitchen: {
      media: dash?.top_recipes[0]?.media ?? null,
      src:
        dash?.top_recipes[0]?.image_url ??
        dash?.top_recipes[0]?.meal?.thumb_url ??
        null,
    },
  }
})

const mixChartData = computed(() => {
  const counts = store.dashboard?.counts
  if (!counts) {
    return toDoughnutChartData([])
  }

  const items = [
    { label: 'Wines', count: counts.wines },
    { label: 'Beers', count: counts.beers },
    { label: 'Recipes', count: counts.recipes },
  ].filter((item) => item.count > 0)

  const base = toDoughnutChartData(items, 'Collection')
  const colors = ['#c45c6a', '#d4a017', '#6a9e6e']

  return {
    ...base,
    datasets: base.datasets.map((dataset) => ({
      ...dataset,
      backgroundColor: items.map((_, index) => colors[index % colors.length]),
    })),
  }
})

const hasMix = computed(() => {
  const counts = store.dashboard?.counts
  if (!counts) return false
  return counts.wines + counts.beers + counts.recipes > 0
})

function openSuggestion(suggestion: {
  drinkable_type: string
  drinkable_id: number
  recipe_id: number
}): void {
  if (suggestion.drinkable_type === 'beer') {
    void router.push({
      name: 'beer-detail',
      params: { beerId: suggestion.drinkable_id },
    })
    return
  }
  void router.push({
    name: 'cellar-wine',
    params: { wineId: suggestion.drinkable_id },
  })
}
</script>

<template>
  <NexusPageWrapper show-toolbar title="Food & Drink">
    <template #toolbar>
      <NexusQuotaBadge :quota="store.dashboard?.quota ?? null" />
    </template>

    <NexusFoodDrinkChrome />

    <NexusSkeletonCards v-if="store.dashboardLoading" :cards="4" />

    <div v-else-if="store.dashboard" class="atelier">
      <header class="mosaic-hero">
        <div class="mosaic" aria-hidden="true">
          <div
            v-for="(tile, index) in mosaicTiles"
            :key="tile.key"
            class="mosaic__cell"
            :class="`mosaic__cell--${index}`"
            :style="{ '--tile-accent': tile.accent }"
          >
            <NexusImage
              v-if="tile.media || tile.src"
              :media="tile.media"
              :src="tile.src"
              :alt="tile.label"
              variant="card"
              size="fill"
              fit="cover"
            />
            <div v-else class="mosaic__fallback" />
          </div>
          <div
            v-for="n in Math.max(0, 6 - mosaicTiles.length)"
            :key="`empty-${n}`"
            class="mosaic__cell mosaic__cell--empty"
          />
        </div>
        <div class="mosaic-copy">
          <p class="eyebrow">Collection Atelier</p>
          <h2>Food & Drink</h2>
          <p class="lede">
            Your cellar, beer log, and kitchen — one studio for what you taste.
          </p>
        </div>
      </header>

      <section class="portals" aria-label="Modules">
        <button
          type="button"
          class="portal portal--wine"
          @click="router.push({ name: 'cellar' })"
        >
          <div class="portal__media">
            <NexusImage
              v-if="portalCovers.cellar.media || portalCovers.cellar.src"
              :media="portalCovers.cellar.media"
              :src="portalCovers.cellar.src"
              alt=""
              variant="card"
              size="fill"
              fit="cover"
            />
          </div>
          <div class="portal__copy">
            <span class="portal__label">Cellar</span>
            <strong>{{ store.dashboard.counts.wines }}</strong>
            <span class="portal__hint">wines in journal</span>
          </div>
        </button>

        <button
          type="button"
          class="portal portal--beer"
          @click="router.push({ name: 'beer' })"
        >
          <div class="portal__media">
            <NexusImage
              v-if="portalCovers.beer.media || portalCovers.beer.src"
              :media="portalCovers.beer.media"
              :src="portalCovers.beer.src"
              alt=""
              variant="card"
              size="fill"
              fit="cover"
            />
          </div>
          <div class="portal__copy">
            <span class="portal__label">Beer</span>
            <strong>{{ store.dashboard.counts.beers }}</strong>
            <span class="portal__hint">beers logged</span>
          </div>
        </button>

        <button
          type="button"
          class="portal portal--kitchen"
          @click="router.push({ name: 'kitchen' })"
        >
          <div class="portal__media">
            <NexusImage
              v-if="portalCovers.kitchen.media || portalCovers.kitchen.src"
              :media="portalCovers.kitchen.media"
              :src="portalCovers.kitchen.src"
              alt=""
              variant="card"
              size="fill"
              fit="cover"
            />
          </div>
          <div class="portal__copy">
            <span class="portal__label">Kitchen</span>
            <strong>{{ store.dashboard.counts.recipes }}</strong>
            <span class="portal__hint">saved recipes</span>
          </div>
        </button>
      </section>

      <button
        type="button"
        class="pairings-strip"
        @click="router.push({ name: 'food-drink-pairings' })"
      >
        <span>
          <strong>{{ store.dashboard.counts.pairings }}</strong> pairings saved
        </span>
        <span class="pairings-strip__cta">Open pairings →</span>
      </button>

      <div class="analytics">
        <section class="panel panel--chart">
          <h3>Collection mix</h3>
          <NexusChart
            v-if="hasMix"
            type="doughnut"
            :data="mixChartData"
            height="14rem"
            :options="{
              plugins: { legend: { position: 'bottom' } },
            }"
          />
          <p v-else class="empty">Add wines, beers, or recipes to see the mix.</p>
        </section>

        <section class="panel panel--runway">
          <div class="panel__head">
            <h3>Suggested pairings</h3>
          </div>
          <div
            v-if="store.dashboard.suggestions.length"
            class="runway"
          >
            <button
              v-for="(s, i) in store.dashboard.suggestions"
              :key="`${s.drinkable_type}-${s.drinkable_id}-${s.recipe_id}-${i}`"
              type="button"
              class="runway-card"
              :class="`runway-card--${s.drinkable_type}`"
              @click="openSuggestion(s)"
            >
              <span class="runway-card__kind">
                {{ s.drinkable_type === 'beer' ? 'Beer' : 'Wine' }} × Recipe
              </span>
              <strong>{{ s.drink_name }}</strong>
              <span class="runway-card__recipe">{{ s.recipe_name }}</span>
              <small v-if="s.reasons[0]">{{ s.reasons[0] }}</small>
            </button>
          </div>
          <p v-else class="empty">
            Save a few wines, beers, and recipes to unlock suggestions.
          </p>
        </section>
      </div>

      <section class="recent" aria-label="Recent items">
        <div class="recent__col">
          <h3>Recent wines</h3>
          <div v-if="store.dashboard.recent_wines?.length" class="chips">
            <button
              v-for="w in store.dashboard.recent_wines"
              :key="w.id"
              type="button"
              class="chip"
              @click="router.push({ name: 'cellar-wine', params: { wineId: w.id } })"
            >
              <NexusImage
                :media="w.media"
                :src="w.image_url"
                :alt="w.name"
                variant="thumb"
                size="fill"
                fit="cover"
              />
              <span>{{ w.name }}</span>
            </button>
          </div>
          <p v-else class="empty">
            No wines yet.
            <Button label="Add a wine" link @click="router.push({ name: 'cellar' })" />
          </p>
        </div>

        <div class="recent__col">
          <h3>Recent beers</h3>
          <div v-if="store.dashboard.recent_beers?.length" class="chips">
            <button
              v-for="b in store.dashboard.recent_beers"
              :key="b.id"
              type="button"
              class="chip"
              @click="router.push({ name: 'beer-detail', params: { beerId: b.id } })"
            >
              <NexusImage
                :media="b.media"
                :src="b.image_url"
                :alt="b.name"
                variant="thumb"
                size="fill"
                fit="cover"
              />
              <span>{{ b.name }}</span>
            </button>
          </div>
          <p v-else class="empty">
            No beers yet.
            <Button label="Log a beer" link @click="router.push({ name: 'beer' })" />
          </p>
        </div>

        <div class="recent__col">
          <h3>Top recipes</h3>
          <div v-if="store.dashboard.top_recipes?.length" class="chips">
            <button
              v-for="r in store.dashboard.top_recipes"
              :key="r.id"
              type="button"
              class="chip"
              @click="router.push({ name: 'kitchen-recipe', params: { recipeId: r.id } })"
            >
              <NexusImage
                :media="r.media"
                :src="r.image_url ?? r.meal?.thumb_url"
                :alt="r.meal?.name ?? 'Recipe'"
                variant="thumb"
                size="fill"
                fit="cover"
              />
              <span>{{ r.meal?.name }}</span>
            </button>
          </div>
          <p v-else class="empty">
            No saved recipes yet.
            <Button
              label="Discover recipes"
              link
              @click="router.push({ name: 'kitchen-discover' })"
            />
          </p>
        </div>
      </section>
    </div>
  </NexusPageWrapper>
</template>

<style scoped>
.atelier {
  display: flex;
  flex-direction: column;
  gap: 1.15rem;
}

.mosaic-hero {
  position: relative;
  min-height: 16rem;
  border-radius: 1.15rem;
  overflow: hidden;
  isolation: isolate;
  animation: mosaic-in 0.55s ease both;
}

@keyframes mosaic-in {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: none;
  }
}

.mosaic {
  position: absolute;
  inset: 0;
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  grid-template-rows: repeat(2, 1fr);
  gap: 0.2rem;
  opacity: 0.55;
}

.mosaic__cell {
  position: relative;
  overflow: hidden;
  background: color-mix(in srgb, var(--tile-accent, var(--food-drink-accent)) 28%, transparent);
}

.mosaic__cell :deep(.nexus-image),
.mosaic__fallback {
  width: 100%;
  height: 100%;
}

.mosaic__cell--empty {
  background: color-mix(in srgb, var(--food-drink-accent) 12%, transparent);
}

.mosaic__cell--0 {
  grid-column: span 2;
  grid-row: span 2;
}

.mosaic__cell--1,
.mosaic__cell--2 {
  grid-column: span 2;
}

.mosaic-copy {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  min-height: 16rem;
  padding: 1.5rem 1.35rem 1.35rem;
  background: linear-gradient(
    180deg,
    transparent 20%,
    color-mix(in srgb, #100a08 88%, transparent) 78%
  );
}

.eyebrow {
  margin: 0;
  font-size: 0.75rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: color-mix(in srgb, var(--food-drink-accent) 85%, #fff);
}

h2 {
  margin: 0.25rem 0 0.35rem;
  font-size: clamp(1.85rem, 4vw, 2.45rem);
  font-weight: 700;
  line-height: 1.1;
}

.lede {
  margin: 0;
  max-width: 32rem;
  opacity: 0.78;
  font-size: 0.98rem;
}

.portals {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.85rem;
}

.portal {
  position: relative;
  display: grid;
  grid-template-rows: 9.5rem auto;
  overflow: hidden;
  border: 0;
  border-radius: 1rem;
  padding: 0;
  text-align: left;
  color: inherit;
  cursor: pointer;
  background: var(--food-drink-card-surface);
}

.portal__media {
  position: relative;
  overflow: hidden;
  background: color-mix(in srgb, var(--coffee-bean-panel) 80%, transparent);
}

.portal__media :deep(.nexus-image) {
  width: 100%;
  height: 100%;
}

.portal__media :deep(img) {
  transition: transform 0.35s ease;
}

.portal:hover .portal__media :deep(img) {
  transform: scale(1.05);
}

.portal--wine .portal__media {
  background: color-mix(in srgb, var(--wine-accent) 22%, transparent);
}

.portal--beer .portal__media {
  background: color-mix(in srgb, var(--beer-accent) 22%, transparent);
}

.portal--kitchen .portal__media {
  background: color-mix(in srgb, var(--kitchen-accent) 22%, transparent);
}

.portal__copy {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
  padding: 0.85rem 0.95rem 1rem;
}

.portal__label {
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  opacity: 0.65;
}

.portal__copy strong {
  font-size: 1.65rem;
  line-height: 1;
}

.portal__hint {
  font-size: 0.8rem;
  opacity: 0.65;
}

.pairings-strip {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  width: 100%;
  border: 0;
  border-radius: 0.85rem;
  padding: 0.9rem 1.05rem;
  color: inherit;
  cursor: pointer;
  background: color-mix(in srgb, var(--food-drink-accent) 16%, var(--coffee-bean-panel));
}

.pairings-strip__cta {
  opacity: 0.75;
  font-size: 0.9rem;
}

.analytics {
  display: grid;
  grid-template-columns: minmax(14rem, 18rem) minmax(0, 1fr);
  gap: 0.85rem;
}

.panel {
  border-radius: 1rem;
  padding: 1rem 1.05rem;
  background: color-mix(in srgb, var(--coffee-bean-panel) 92%, transparent);
}

.panel h3,
.recent__col h3 {
  margin: 0 0 0.75rem;
  font-size: 1rem;
}

.panel__head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 0.75rem;
}

.runway {
  display: flex;
  gap: 0.75rem;
  overflow-x: auto;
  scroll-snap-type: x mandatory;
  padding-bottom: 0.25rem;
}

.runway-card {
  flex: 0 0 min(16rem, 78vw);
  scroll-snap-align: start;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  border: 0;
  border-radius: 0.85rem;
  padding: 0.95rem;
  text-align: left;
  color: inherit;
  cursor: pointer;
  background: color-mix(in srgb, var(--coffee-bean) 55%, transparent);
}

.runway-card--wine {
  box-shadow: inset 3px 0 0 var(--wine-accent);
}

.runway-card--beer {
  box-shadow: inset 3px 0 0 var(--beer-accent);
}

.runway-card__kind {
  font-size: 0.7rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  opacity: 0.6;
}

.runway-card strong {
  font-size: 1rem;
}

.runway-card__recipe {
  font-size: 0.9rem;
  opacity: 0.85;
}

.runway-card small {
  margin-top: 0.35rem;
  font-size: 0.78rem;
  opacity: 0.62;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.recent {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.85rem;
}

.recent__col {
  border-radius: 1rem;
  padding: 1rem 1.05rem;
  background: color-mix(in srgb, var(--coffee-bean-panel) 92%, transparent);
}

.chips {
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
}

.chip {
  display: grid;
  grid-template-columns: 2.75rem 1fr;
  gap: 0.65rem;
  align-items: center;
  width: 100%;
  border: 0;
  border-radius: 0.65rem;
  padding: 0.3rem 0.45rem 0.3rem 0.3rem;
  text-align: left;
  color: inherit;
  cursor: pointer;
  background: color-mix(in srgb, var(--coffee-bean) 40%, transparent);
}

.chip :deep(.nexus-image) {
  width: 2.75rem;
  height: 2.75rem;
  border-radius: 0.45rem;
}

.chip span {
  font-size: 0.88rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.empty {
  margin: 0;
  opacity: 0.65;
  font-size: 0.9rem;
}

.empty :deep(.p-button) {
  padding-inline: 0.15rem;
  vertical-align: baseline;
}

@media (max-width: 1000px) {
  .portals,
  .analytics,
  .recent {
    grid-template-columns: 1fr;
  }

  .mosaic {
    grid-template-columns: repeat(3, 1fr);
  }

  .mosaic__cell--0 {
    grid-column: span 2;
    grid-row: span 1;
  }
}
</style>
