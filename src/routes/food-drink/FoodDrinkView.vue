<script setup lang="ts">
import { computed, onMounted } from 'vue'
import type { RouteLocationRaw } from 'vue-router'
import IndexTemplate from '@design/templates/IndexTemplate.vue'
import type { ViewState } from '@design/templates/types'
import NxStage from '@design/components/NxStage.vue'
import NxPillNav from '@design/components/NxPillNav.vue'
import NxBento from '@design/components/NxBento.vue'
import NxField from '@design/components/NxField.vue'
import NxPanel from '@design/components/NxPanel.vue'
import NxCoverGrid from '@design/components/NxCoverGrid.vue'
import NxCoverCard from '@design/components/NxCoverCard.vue'
import NxEmptyState from '@design/components/NxEmptyState.vue'
import NxIcon from '@design/components/NxIcon.vue'
import { sections, type SectionKey } from '@design/tokens'
import type { IconName } from '@design/icons'
import NexusImage from '@components/nexus-image/NexusImage.vue'
import NexusChart from '@components/nexus-chart/NexusChart.vue'
import NexusQuotaBadge from '@components/nexus-quota-badge/NexusQuotaBadge.vue'
import { toDoughnutChartData } from '@lib/charts'
import { useFoodDrinkStore } from '@stores/food-drink/food-drink.store'
import type { FoodDrinkSuggestion } from '@/types/food-drink/food-drink'
import type { MediaImage } from '@/types/media/media'
import { plural } from '@routes/collections/collectionFields'
import { foodDrinkNav } from './foodDrinkNav'

const store = useFoodDrinkStore()

onMounted(() => {
  void store.loadDashboard()
})

const dash = computed(() => store.dashboard)

const state = computed<ViewState>(() => {
  if (store.dashboardLoading && !dash.value) return 'loading'
  return dash.value ? 'ready' : 'error'
})

interface RecentItem {
  key: string
  kind: string
  icon: IconName
  title: string
  sub: string | null
  media?: MediaImage | null
  src?: string | null
  rating: number | null
  to: RouteLocationRaw
}

const recent = computed<RecentItem[]>(() => {
  const d = dash.value
  if (!d) return []
  const wines = d.recent_wines.map<RecentItem>((w) => ({
    key: `wine-${w.id}`,
    kind: 'Wine',
    icon: 'wine',
    title: w.name,
    sub: w.producer_name,
    media: w.media,
    src: w.image_url,
    rating: w.rating,
    to: { name: 'cellar-wine', params: { wineId: w.id } },
  }))
  const beers = d.recent_beers.map<RecentItem>((b) => ({
    key: `beer-${b.id}`,
    kind: 'Beer',
    icon: 'beer',
    title: b.name,
    sub: b.brewery?.name ?? null,
    media: b.media,
    src: b.image_url,
    rating: b.rating,
    to: { name: 'beer-detail', params: { beerId: b.id } },
  }))
  const spirits = (d.recent_spirits ?? []).map<RecentItem>((s) => ({
    key: `spirit-${s.id}`,
    kind: 'Spirit',
    icon: 'spirits',
    title: s.name,
    sub: s.producer,
    media: s.media,
    src: s.image_url,
    rating: s.rating,
    to: { name: 'spirit-detail', params: { spiritId: s.id } },
  }))
  const recipes = d.top_recipes.map<RecentItem>((r) => ({
    key: `recipe-${r.id}`,
    kind: 'Recipe',
    icon: 'kitchen',
    title: r.meal?.name ?? 'Recipe',
    sub: r.cooked_count ? `Cooked ${r.cooked_count}×` : null,
    media: r.media,
    src: r.image_url ?? r.meal?.thumb_url,
    rating: r.rating,
    to: { name: 'kitchen-recipe', params: { recipeId: r.id } },
  }))

  // Interleave so one busy module doesn't crowd out the rest.
  const lanes = [wines, beers, spirits, recipes]
  const out: RecentItem[] = []
  for (let i = 0; out.length < 8 && lanes.some((l) => l[i]); i++) {
    for (const lane of lanes) if (lane[i] && out.length < 8) out.push(lane[i]!)
  }
  return out
})

const mosaic = computed(() => recent.value.filter((r) => r.media || r.src).slice(0, 4))

const fields = computed(() => {
  const c = dash.value?.counts
  if (!c) return []
  const f = (section: SectionKey, label: string, value: number, sub: string, span: number, to: RouteLocationRaw) => ({
    key: section,
    section,
    label,
    value,
    sub,
    span,
    to,
  })
  return [
    f('cellar', 'Wine', c.wines, plural(c.wines, 'bottle'), 3, { name: 'cellar' }),
    f('beer', 'Beer', c.beers, plural(c.beers, 'beer') + ' logged', 3, { name: 'beer' }),
    f('spirits', 'Spirits', c.spirits ?? 0, 'on the shelf', 2, { name: 'spirits' }),
    f('kitchen', 'Recipes', c.recipes, 'saved', 2, { name: 'kitchen' }),
    f('food-drink', 'Pairings', c.pairings, 'that worked', 2, { name: 'food-drink-pairings' }),
  ]
})

const lede = computed(() => {
  const c = dash.value?.counts
  if (!c) return 'Your cellar, beer log, spirits shelf and kitchen in one place.'
  const total = c.wines + c.beers + (c.spirits ?? 0)
  return `${plural(total, 'drink')} and ${plural(c.recipes, 'recipe')} so far — here is what goes together.`
})

const mixItems = computed(() => {
  const c = dash.value?.counts
  if (!c) return []
  return [
    { label: 'Wine', count: c.wines, color: sections.cellar.field.bg },
    { label: 'Beer', count: c.beers, color: sections.beer.field.bg },
    { label: 'Spirits', count: c.spirits ?? 0, color: sections.spirits.field.bg },
    { label: 'Recipes', count: c.recipes, color: sections.kitchen.field.bg },
  ].filter((i) => i.count > 0)
})

const mixChart = computed(() => {
  const base = toDoughnutChartData(mixItems.value, 'Collection')
  return {
    ...base,
    datasets: base.datasets.map((d) => ({
      ...d,
      backgroundColor: mixItems.value.map((i) => i.color),
      borderWidth: 0,
    })),
  }
})

function suggestionTo(s: FoodDrinkSuggestion): RouteLocationRaw {
  return s.drinkable_type === 'beer'
    ? { name: 'beer-detail', params: { beerId: s.drinkable_id } }
    : { name: 'cellar-wine', params: { wineId: s.drinkable_id } }
}
</script>

<template>
  <IndexTemplate :state="state" error-title="Could not load Food & Drink">
    <template #stage>
      <NxStage eyebrow="Food & Drink" title="What you" accent="taste" :lede="lede">
        <template v-if="mosaic.length" #visual>
          <div class="mosaic" :class="`n-${mosaic.length}`">
            <NexusImage
              v-for="m in mosaic"
              :key="m.key"
              :media="m.media"
              :src="m.src"
              alt=""
              variant="card"
              size="fill"
              fit="cover"
            />
          </div>
        </template>
      </NxStage>
    </template>

    <template #fields>
      <NxBento :row-height="132">
        <NxField
          v-for="f in fields"
          :key="f.key"
          :bg="sections[f.section].field.bg"
          :ink="sections[f.section].field.ink"
          :label="f.label"
          :value="f.value"
          :value-size="44"
          :sub="f.sub"
          :span="f.span"
          :to="f.to"
        />
      </NxBento>
    </template>

    <template #toolbar>
      <NxPillNav :items="foodDrinkNav" label="Food and drink" />
      <span class="grow" />
      <NexusQuotaBadge :quota="dash?.quota ?? null" />
    </template>

    <div v-if="dash" class="lower">
      <NxPanel title="Try tonight" action-label="All pairings" :to="{ name: 'food-drink-pairings' }">
        <ul v-if="dash.suggestions.length" class="suggestions">
          <li v-for="(s, i) in dash.suggestions.slice(0, 5)" :key="`${s.drinkable_type}-${s.drinkable_id}-${s.recipe_id}-${i}`">
            <RouterLink :to="suggestionTo(s)" class="suggestion">
              <span class="kind" :class="s.drinkable_type">
                <NxIcon :name="s.drinkable_type === 'beer' ? 'beer' : 'wine'" :size="16" />
              </span>
              <span class="copy">
                <span class="pair">
                  {{ s.drink_name }} <em>with</em> {{ s.recipe_name }}
                </span>
                <span v-if="s.reasons[0]" class="why">{{ s.reasons[0] }}</span>
              </span>
              <NxIcon name="chevron-right" :size="16" class="go" />
            </RouterLink>
          </li>
        </ul>
        <NxEmptyState
          v-else
          title="No suggestions yet"
          body="Save a few wines or beers and some recipes, and matches will show up here."
        />
      </NxPanel>

      <NxPanel title="Collection mix">
        <NexusChart v-if="mixItems.length" type="doughnut" :data="mixChart" height="15rem" />
        <NxEmptyState v-else title="Nothing to chart yet" body="Add a bottle or a recipe to start." />
      </NxPanel>
    </div>

    <section v-if="recent.length" class="recent" aria-labelledby="recent-title">
      <h2 id="recent-title" class="nx-label">Recently added</h2>
      <NxCoverGrid :min="160">
        <NxCoverCard
          v-for="r in recent"
          :key="r.key"
          :to="r.to"
          :title="r.title"
          :sub="r.sub"
          :media="r.media"
          :src="r.src"
          :rating="r.rating"
          :badge="r.kind"
          :icon="r.icon"
          :aspect="r.kind === 'Recipe' ? 'square' : 'portrait'"
        />
      </NxCoverGrid>
    </section>
  </IndexTemplate>
</template>

<style scoped>
.grow {
  flex: 1;
}

.mosaic {
  display: grid;
  width: 100%;
  height: 100%;
  gap: 3px;
  grid-template-columns: 1fr 1fr;
  grid-template-rows: 1fr 1fr;
}

.mosaic.n-1 {
  grid-template-columns: 1fr;
  grid-template-rows: 1fr;
}

.mosaic.n-2 {
  grid-template-rows: 1fr;
}

.mosaic.n-3 > :first-child {
  grid-row: span 2;
}

.lower {
  display: grid;
  grid-template-columns: minmax(0, 1.5fr) minmax(0, 1fr);
  gap: 20px;
  align-items: start;
}

.suggestions {
  list-style: none;
  margin: 0;
  padding: 0;
}

.suggestion {
  display: grid;
  grid-template-columns: 36px minmax(0, 1fr) auto;
  align-items: center;
  gap: 14px;
  padding: 12px 0;
  border-top: 1px solid var(--line);
  color: inherit;
}

li:first-child .suggestion {
  border-top: 0;
}

.kind {
  width: 36px;
  height: 36px;
  display: grid;
  place-items: center;
  border-radius: 50%;
  background: var(--tint);
  color: var(--acc);
}

.copy {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.pair {
  font-weight: 600;
  font-size: 15px;
}

.pair em {
  font-family: var(--font-serif);
  font-weight: 400;
  font-size: 17px;
  color: var(--acc);
}

.why {
  font-size: 13px;
  color: var(--ink-3);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.go {
  color: var(--ink-4);
  transition: transform 0.2s var(--ease);
}

.suggestion:hover .go {
  color: var(--ink);
  transform: translateX(3px);
}

.recent {
  display: flex;
  flex-direction: column;
  gap: 18px;
  margin-top: 36px;
}

.recent h2 {
  margin: 0;
}

@media (max-width: 960px) {
  .lower {
    grid-template-columns: minmax(0, 1fr);
  }
}
</style>
