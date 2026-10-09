<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import type { RouteLocationRaw } from 'vue-router'
import IndexTemplate from '@design/templates/IndexTemplate.vue'
import type { ViewState } from '@design/templates/types'
import NxStage from '@design/components/NxStage.vue'
import NxPillNav from '@design/components/NxPillNav.vue'
import NxPanel from '@design/components/NxPanel.vue'
import NxEmptyState from '@design/components/NxEmptyState.vue'
import NxIcon from '@design/components/NxIcon.vue'
import NxIconButton from '@design/components/NxIconButton.vue'
import NexusPairingPicker from '@components/nexus-pairing-picker/NexusPairingPicker.vue'
import { useFoodDrinkStore } from '@stores/food-drink/food-drink.store'
import { useCellarStore } from '@stores/food-drink/cellar.store'
import { useBeerStore } from '@stores/food-drink/beer.store'
import { useKitchenStore } from '@stores/food-drink/kitchen.store'
import type { FoodDrinkPairing, FoodDrinkSuggestion, PairingVerdict } from '@/types/food-drink/food-drink'
import { foodDrinkNav } from './foodDrinkNav'

const store = useFoodDrinkStore()
const cellar = useCellarStore()
const beer = useBeerStore()
const kitchen = useKitchenStore()

const showPicker = ref(false)
const saving = ref(false)
const preset = ref<{ drinkable_type: 'wine' | 'beer'; drinkable_id: number; kitchen_recipe_id: number } | null>(null)

onMounted(() => {
  void Promise.all([
    store.loadPairings(),
    store.loadSuggestions(),
    cellar.loadWines(),
    beer.loadBeers(),
    kitchen.loadRecipes(),
  ])
})

const state = computed<ViewState>(() =>
  store.pairingsLoading && !store.pairings.length ? 'loading' : 'ready',
)

const wineOptions = computed(() => cellar.wines.map((w) => ({ id: w.id, name: w.name })))
const beerOptions = computed(() => beer.beers.map((b) => ({ id: b.id, name: b.name })))
const recipeOptions = computed(() =>
  kitchen.recipes.map((r) => ({ id: r.id, name: r.meal?.name ?? `Recipe #${r.id}` })),
)

const VERDICT: Record<PairingVerdict, string> = { great: 'Great match', good: 'Good', poor: 'Didn’t work' }

function openPicker(from?: FoodDrinkSuggestion): void {
  preset.value = from
    ? { drinkable_type: from.drinkable_type, drinkable_id: from.drinkable_id, kitchen_recipe_id: from.recipe_id }
    : null
  showPicker.value = true
}

async function onSave(payload: {
  drinkable_type: 'wine' | 'beer'
  drinkable_id: number
  kitchen_recipe_id: number
  verdict: PairingVerdict
  notes: string | null
}): Promise<void> {
  saving.value = true
  try {
    await store.createPairing(payload)
    showPicker.value = false
    await store.loadSuggestions()
  } finally {
    saving.value = false
  }
}

function drinkTo(p: Pick<FoodDrinkPairing, 'drinkable_type' | 'drinkable_id'>): RouteLocationRaw {
  return p.drinkable_type === 'beer'
    ? { name: 'beer-detail', params: { beerId: p.drinkable_id } }
    : { name: 'cellar-wine', params: { wineId: p.drinkable_id } }
}
</script>

<template>
  <IndexTemplate :state="state">
    <template #stage>
      <NxStage
        size="compact"
        eyebrow="Food & Drink"
        title="Pairings"
        accent="that worked"
        lede="Which bottle went with which dish — and the ones worth trying next."
      >
        <template #actions>
          <Button rounded severity="contrast" label="Save a pairing" @click="openPicker()">
            <template #icon="{ class: iconClass }">
              <NxIcon name="plus" :size="16" :class="iconClass" />
            </template>
          </Button>
        </template>
      </NxStage>
    </template>

    <template #toolbar>
      <NxPillNav :items="foodDrinkNav" label="Food and drink" />
    </template>

    <div class="cols">
      <NxPanel :title="`Your pairings · ${store.pairings.length}`">
        <ul v-if="store.pairings.length" class="rows">
          <li v-for="p in store.pairings" :key="p.id" class="row">
            <span class="kind">
              <NxIcon :name="p.drinkable_type === 'beer' ? 'beer' : 'wine'" :size="16" />
            </span>
            <div class="copy">
              <div class="pair">
                <RouterLink :to="drinkTo(p)">{{ p.drinkable_name }}</RouterLink>
                <em>with</em>
                <RouterLink :to="{ name: 'kitchen-recipe', params: { recipeId: p.kitchen_recipe_id } }">
                  {{ p.recipe_name }}
                </RouterLink>
              </div>
              <p v-if="p.notes" class="notes">{{ p.notes }}</p>
            </div>
            <span class="verdict" :class="p.verdict">{{ VERDICT[p.verdict] }}</span>
            <NxIconButton icon="trash" label="Delete pairing" size="sm" @click="store.removePairing(p.id)" />
          </li>
        </ul>
        <NxEmptyState
          v-else
          title="No pairings saved"
          body="Next time a bottle and a dish click, save it here so you can repeat it."
        >
          <Button rounded severity="secondary" label="Save a pairing" @click="openPicker()" />
        </NxEmptyState>
      </NxPanel>

      <NxPanel title="Worth trying">
        <ul v-if="store.suggestions.length" class="rows">
          <li v-for="(s, i) in store.suggestions" :key="i" class="row suggestion">
            <div class="copy">
              <div class="pair">
                {{ s.drink_name }} <em>with</em> {{ s.recipe_name }}
              </div>
              <p v-if="s.reasons.length" class="notes">{{ s.reasons.join(' · ') }}</p>
            </div>
            <Button size="small" rounded text label="Save" @click="openPicker(s)" />
          </li>
        </ul>
        <NxEmptyState v-else title="Nothing to suggest yet" body="Suggestions appear once you have drinks and recipes saved." />
      </NxPanel>
    </div>
  </IndexTemplate>

  <NexusPairingPicker
    v-model:visible="showPicker"
    :wines="wineOptions"
    :beers="beerOptions"
    :recipes="recipeOptions"
    :preset="preset"
    :saving="saving"
    @save="onSave"
  />
</template>

<style scoped>
.cols {
  display: grid;
  grid-template-columns: minmax(0, 1.4fr) minmax(0, 1fr);
  gap: 20px;
  align-items: start;
}

.rows {
  list-style: none;
  margin: 0;
  padding: 0;
}

.row {
  display: grid;
  grid-template-columns: 36px minmax(0, 1fr) auto auto;
  align-items: center;
  gap: 14px;
  padding: 14px 0;
  border-top: 1px solid var(--line);
}

.row:first-child {
  border-top: 0;
}

.row.suggestion {
  grid-template-columns: minmax(0, 1fr) auto;
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
  min-width: 0;
}

.pair {
  font-size: 15px;
  font-weight: 600;
}

.pair a {
  color: inherit;
}

.pair a:hover {
  text-decoration: underline;
  text-underline-offset: 3px;
}

.pair em {
  font-family: var(--font-serif);
  font-weight: 400;
  font-size: 17px;
  color: var(--acc);
  margin: 0 2px;
}

.notes {
  margin: 4px 0 0;
  font-size: 13px;
  color: var(--ink-3);
}

.verdict {
  padding: 5px 10px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 600;
  white-space: nowrap;
  background: var(--tint);
  color: var(--ink-2);
}

.verdict.great {
  background: color-mix(in srgb, var(--acc) 22%, transparent);
  color: var(--ink);
}

.verdict.poor {
  color: var(--ink-3);
}

@media (max-width: 960px) {
  .cols {
    grid-template-columns: minmax(0, 1fr);
  }
}

@media (max-width: 640px) {
  .row {
    grid-template-columns: 36px minmax(0, 1fr) auto;
  }

  .verdict {
    grid-column: 2;
    justify-self: start;
  }
}
</style>
