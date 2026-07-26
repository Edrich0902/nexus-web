<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import NexusFoodDrinkIcon from '@components/nexus-food-drink-icon/NexusFoodDrinkIcon.vue'
import NexusImage from '@components/nexus-image/NexusImage.vue'
import NexusRatingDisplay from '@components/nexus-rating-display/NexusRatingDisplay.vue'
import NexusWineIcon from '@components/nexus-wine-icon/NexusWineIcon.vue'
import NexusBeerIcon from '@components/nexus-beer-icon/NexusBeerIcon.vue'
import NexusRecipeIcon from '@components/nexus-recipe-icon/NexusRecipeIcon.vue'
import { useFoodDrinkStore } from '@stores/food-drink/food-drink.store'
import type { FoodDrinkSuggestion } from '@/types/food-drink/food-drink'
import type { MediaImage } from '@/types/media/media'

const store = useFoodDrinkStore()
const router = useRouter()

onMounted(() => {
  void store.loadDashboard()
})

const mode = computed<'loading' | 'empty' | 'ready'>(() => {
  if (store.dashboardLoading && !store.dashboard) return 'loading'
  if (!store.dashboard) return 'empty'
  const { wines, beers, recipes } = store.dashboard.counts
  if (wines + beers + recipes === 0) return 'empty'
  return 'ready'
})

const counts = computed(() => store.dashboard?.counts)

const totalLogged = computed(() => {
  if (!counts.value) return 0
  return counts.value.wines + counts.value.beers + counts.value.recipes
})

const suggestion = computed(
  () => store.dashboard?.suggestions?.[0] ?? null,
)

const latestWine = computed(() => store.dashboard?.recent_wines?.[0] ?? null)
const latestBeer = computed(() => store.dashboard?.recent_beers?.[0] ?? null)
const topRecipe = computed(() => store.dashboard?.top_recipes?.[0] ?? null)
const latestPairing = computed(
  () => store.dashboard?.recent_pairings?.[0] ?? null,
)

type SpotlightItem = {
  kind: 'wine' | 'beer' | 'recipe'
  id: number
  title: string
  subtitle: string
  rating: number | null
  media?: MediaImage | null
  imageUrl?: string | null
  routeName: string
  routeParams: Record<string, number>
}

const spotlight = computed<SpotlightItem | null>(() => {
  const wine = latestWine.value
  if (wine) {
    return {
      kind: 'wine',
      id: wine.id,
      title: wine.name,
      subtitle: [wine.producer_name, wine.vintage].filter(Boolean).join(' · ') || 'Wine journal',
      rating: wine.rating,
      media: wine.media,
      imageUrl: wine.image_url,
      routeName: 'cellar-wine',
      routeParams: { wineId: wine.id },
    }
  }

  const beer = latestBeer.value
  if (beer) {
    return {
      kind: 'beer',
      id: beer.id,
      title: beer.name,
      subtitle: beer.brewery?.name || 'Beer log',
      rating: beer.rating,
      media: beer.media,
      imageUrl: beer.image_url,
      routeName: 'beer-detail',
      routeParams: { beerId: beer.id },
    }
  }

  const recipe = topRecipe.value
  if (recipe) {
    return {
      kind: 'recipe',
      id: recipe.id,
      title: recipe.meal?.name || 'Saved recipe',
      subtitle:
        recipe.cooked_count > 0
          ? `Cooked ${recipe.cooked_count}×`
          : 'Kitchen favourite',
      rating: recipe.rating,
      media: recipe.media,
      imageUrl: recipe.image_url ?? recipe.meal?.thumb_url,
      routeName: 'kitchen-recipe',
      routeParams: { recipeId: recipe.id },
    }
  }

  return null
})

const gallery = computed(() => {
  const items: Array<{
    key: string
    media?: MediaImage | null
    src?: string | null
    alt: string
    to: { name: string; params: Record<string, number> }
  }> = []

  for (const wine of store.dashboard?.recent_wines?.slice(0, 2) ?? []) {
    items.push({
      key: `wine-${wine.id}`,
      media: wine.media,
      src: wine.image_url,
      alt: wine.name,
      to: { name: 'cellar-wine', params: { wineId: wine.id } },
    })
  }
  for (const beer of store.dashboard?.recent_beers?.slice(0, 1) ?? []) {
    items.push({
      key: `beer-${beer.id}`,
      media: beer.media,
      src: beer.image_url,
      alt: beer.name,
      to: { name: 'beer-detail', params: { beerId: beer.id } },
    })
  }
  for (const recipe of store.dashboard?.top_recipes?.slice(0, 1) ?? []) {
    items.push({
      key: `recipe-${recipe.id}`,
      media: recipe.media,
      src: recipe.image_url ?? recipe.meal?.thumb_url,
      alt: recipe.meal?.name || 'Recipe',
      to: { name: 'kitchen-recipe', params: { recipeId: recipe.id } },
    })
  }

  return items.slice(0, 4)
})

function openHub(): void {
  void router.push({ name: 'food-drink' })
}

function openMetric(routeName: string): void {
  void router.push({ name: routeName })
}

function openSpotlight(item: SpotlightItem): void {
  void router.push({ name: item.routeName, params: item.routeParams })
}

function openSuggestion(s: FoodDrinkSuggestion): void {
  if (s.drinkable_type === 'wine') {
    void router.push({
      name: 'cellar-wine',
      params: { wineId: s.drinkable_id },
    })
    return
  }
  void router.push({
    name: 'beer-detail',
    params: { beerId: s.drinkable_id },
  })
}

function openPairing(): void {
  void router.push({ name: 'food-drink-pairings' })
}

function kindLabel(kind: SpotlightItem['kind']): string {
  switch (kind) {
    case 'wine':
      return 'Latest wine'
    case 'beer':
      return 'Latest beer'
    case 'recipe':
      return 'Top recipe'
  }
}

function verdictLabel(verdict: string): string {
  return verdict.replaceAll('_', ' ')
}
</script>

<template>
  <article class="pulse-card" :class="`is-${mode}`">
    <header class="pulse-head">
      <div class="pulse-brand">
        <NexusFoodDrinkIcon :size="22" />
        <div>
          <h3>Food & Drink</h3>
          <p class="subtitle">
            <Skeleton
              v-if="mode === 'loading'"
              width="8rem"
              height="0.75rem"
            />
            <template v-else-if="mode === 'empty'">
              Start your cellar, beer log, or recipes
            </template>
            <template v-else>
              {{ totalLogged }} logged
              <span v-if="counts?.pairings">
                · {{ counts.pairings }} pairing{{ counts.pairings === 1 ? '' : 's' }}
              </span>
            </template>
          </p>
        </div>
      </div>
      <Button
        label="Hub"
        icon="pi pi-arrow-right"
        size="small"
        severity="secondary"
        text
        @click.stop="openHub"
      />
    </header>

    <div v-if="mode === 'loading'" class="pulse-skel">
      <div class="metrics">
        <Skeleton v-for="n in 3" :key="n" height="2.6rem" border-radius="0.7rem" />
      </div>
      <Skeleton height="4.5rem" border-radius="0.75rem" />
      <div class="gallery">
        <Skeleton v-for="n in 4" :key="`g-${n}`" height="3.4rem" border-radius="0.55rem" />
      </div>
    </div>

    <div v-else-if="mode === 'empty'" class="pulse-empty">
      <p>
        Log a wine tasting, save a recipe, or note a beer — then come back for
        pairings and suggestions.
      </p>
      <div class="empty-actions">
        <Button
          label="Wine"
          size="small"
          severity="secondary"
          @click.stop="openMetric('cellar')"
        />
        <Button
          label="Beer"
          size="small"
          severity="secondary"
          @click.stop="openMetric('beer')"
        />
        <Button
          label="Recipes"
          size="small"
          severity="secondary"
          @click.stop="openMetric('kitchen')"
        />
      </div>
    </div>

    <template v-else>
      <div class="metrics" role="navigation" aria-label="Food and drink modules">
        <button
          type="button"
          class="metric metric-wine"
          @click.stop="openMetric('cellar')"
        >
          <NexusWineIcon :size="15" />
          <span class="metric-value">{{ counts?.wines ?? 0 }}</span>
          <span class="metric-label">Wines</span>
        </button>
        <button
          type="button"
          class="metric metric-beer"
          @click.stop="openMetric('beer')"
        >
          <NexusBeerIcon :size="15" />
          <span class="metric-value">{{ counts?.beers ?? 0 }}</span>
          <span class="metric-label">Beers</span>
        </button>
        <button
          type="button"
          class="metric metric-kitchen"
          @click.stop="openMetric('kitchen')"
        >
          <NexusRecipeIcon :size="15" />
          <span class="metric-value">{{ counts?.recipes ?? 0 }}</span>
          <span class="metric-label">Recipes</span>
        </button>
      </div>

      <button
        v-if="suggestion"
        type="button"
        class="suggestion"
        @click.stop="openSuggestion(suggestion)"
      >
        <p class="eyebrow">Try tonight</p>
        <strong>
          {{ suggestion.recipe_name || 'Recipe' }}
          <span class="with">with</span>
          {{ suggestion.drink_name || 'drink' }}
        </strong>
        <p v-if="suggestion.reasons?.length" class="reason">
          {{ suggestion.reasons[0] }}
        </p>
      </button>

      <button
        v-else-if="spotlight"
        type="button"
        class="spotlight"
        @click.stop="openSpotlight(spotlight)"
      >
        <div class="spotlight-media">
          <NexusImage
            :media="spotlight.media"
            :src="spotlight.imageUrl"
            :alt="spotlight.title"
            variant="thumb"
            size="fill"
            fit="cover"
          />
        </div>
        <div class="spotlight-body">
          <p class="eyebrow">{{ kindLabel(spotlight.kind) }}</p>
          <strong>{{ spotlight.title }}</strong>
          <p class="meta">{{ spotlight.subtitle }}</p>
          <NexusRatingDisplay
            v-if="spotlight.rating != null"
            :model-value="spotlight.rating"
            accent="var(--food-drink-accent)"
          />
        </div>
      </button>

      <button
        v-if="latestPairing"
        type="button"
        class="pairing"
        @click.stop="openPairing"
      >
        <span class="pairing-label">Recent pairing</span>
        <span class="pairing-copy">
          {{ latestPairing.drinkable_name || 'Drink' }}
          ·
          {{ latestPairing.recipe_name || 'Recipe' }}
        </span>
        <Tag
          :value="verdictLabel(latestPairing.verdict)"
          severity="secondary"
          rounded
        />
      </button>

      <div v-if="gallery.length" class="gallery">
        <RouterLink
          v-for="item in gallery"
          :key="item.key"
          :to="item.to"
          class="gallery-item"
          @click.stop
        >
          <NexusImage
            :media="item.media"
            :src="item.src"
            :alt="item.alt"
            variant="thumb"
            size="fill"
            fit="cover"
          />
        </RouterLink>
      </div>
    </template>
  </article>
</template>

<style scoped>
.pulse-card {
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
  padding: 1rem 1.1rem;
  border-radius: 1rem;
  background: var(--food-drink-card-surface);
  border: 1px solid color-mix(in srgb, var(--food-drink-accent) 18%, transparent);
  color: inherit;
}

.pulse-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.75rem;
}

.pulse-brand {
  display: flex;
  align-items: flex-start;
  gap: 0.65rem;
  min-width: 0;
  color: var(--food-drink-accent);
}

.pulse-brand h3 {
  margin: 0;
  font-size: 1rem;
  font-weight: 700;
  color: inherit;
}

.subtitle {
  margin: 0.2rem 0 0;
  font-size: 0.8rem;
  opacity: 0.72;
  color: var(--p-text-color);
}

.pulse-skel,
.pulse-empty {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.pulse-empty p {
  margin: 0;
  font-size: 0.88rem;
  line-height: 1.45;
  opacity: 0.78;
}

.empty-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
}

.metrics {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.45rem;
}

.metric {
  display: grid;
  grid-template-columns: auto 1fr;
  grid-template-rows: auto auto;
  column-gap: 0.4rem;
  row-gap: 0.05rem;
  align-items: center;
  padding: 0.55rem 0.6rem;
  border: 0;
  border-radius: 0.7rem;
  text-align: left;
  cursor: pointer;
  color: inherit;
  background: color-mix(in srgb, var(--food-drink-accent) 12%, transparent);
  transition: background 0.18s ease;
}

.metric > :first-child {
  grid-row: 1 / span 2;
}

.metric:hover {
  background: color-mix(in srgb, var(--food-drink-accent) 22%, transparent);
}

.metric-wine {
  color: var(--wine-accent);
}

.metric-beer {
  color: var(--beer-accent);
}

.metric-kitchen {
  color: var(--kitchen-accent);
}

.metric-value {
  font-size: 1.05rem;
  font-weight: 700;
  line-height: 1.1;
  color: var(--p-text-color);
}

.metric-label {
  font-size: 0.68rem;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  opacity: 0.7;
  color: var(--p-text-color);
}

.suggestion,
.spotlight,
.pairing {
  width: 100%;
  border: 0;
  text-align: left;
  cursor: pointer;
  color: inherit;
  border-radius: 0.8rem;
  background: color-mix(in srgb, var(--food-drink-accent) 10%, transparent);
  transition: background 0.18s ease;
}

.suggestion:hover,
.spotlight:hover,
.pairing:hover {
  background: color-mix(in srgb, var(--food-drink-accent) 18%, transparent);
}

.suggestion {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  padding: 0.75rem 0.85rem;
}

.eyebrow {
  margin: 0;
  font-size: 0.65rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--food-drink-accent);
}

.suggestion strong {
  font-size: 0.95rem;
  line-height: 1.3;
}

.with {
  font-weight: 500;
  opacity: 0.65;
}

.reason,
.meta {
  margin: 0;
  font-size: 0.8rem;
  opacity: 0.72;
  line-height: 1.35;
}

.spotlight {
  display: grid;
  grid-template-columns: 3.6rem minmax(0, 1fr);
  gap: 0.75rem;
  align-items: center;
  padding: 0.55rem;
}

.spotlight-media {
  width: 3.6rem;
  height: 4.4rem;
  border-radius: 0.55rem;
  overflow: hidden;
  background: color-mix(in srgb, var(--food-drink-accent) 16%, transparent);
}

.spotlight-media :deep(.nexus-image) {
  width: 100%;
  height: 100%;
}

.spotlight-body {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
  min-width: 0;
}

.spotlight-body strong {
  font-size: 0.95rem;
  line-height: 1.25;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.pairing {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  grid-template-rows: auto auto;
  column-gap: 0.55rem;
  row-gap: 0.15rem;
  align-items: center;
  padding: 0.65rem 0.8rem;
}

.pairing-label {
  grid-column: 1;
  font-size: 0.65rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--food-drink-accent);
}

.pairing-copy {
  grid-column: 1;
  font-size: 0.85rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.pairing :deep(.p-tag) {
  grid-column: 2;
  grid-row: 1 / span 2;
  text-transform: capitalize;
}

.gallery {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 0.4rem;
}

.gallery-item {
  display: block;
  aspect-ratio: 1;
  border-radius: 0.55rem;
  overflow: hidden;
  background: color-mix(in srgb, var(--food-drink-accent) 14%, transparent);
}

.gallery-item :deep(.nexus-image) {
  width: 100%;
  height: 100%;
}
</style>
