<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import IndexTemplate from '@design/templates/IndexTemplate.vue'
import type { ViewState } from '@design/templates/types'
import NxStage from '@design/components/NxStage.vue'
import NxPillNav from '@design/components/NxPillNav.vue'
import NxPillGroup from '@design/components/NxPillGroup.vue'
import NxSearchField from '@design/components/NxSearchField.vue'
import NxEmptyState from '@design/components/NxEmptyState.vue'
import NxIcon from '@design/components/NxIcon.vue'
import { useKitchenStore } from '@stores/food-drink/kitchen.store'
import { useFoodDrinkStore } from '@stores/food-drink/food-drink.store'
import CollectionFields from '@routes/collections/CollectionFields.vue'
import CollectionPrints from '@routes/collections/CollectionPrints.vue'
import { recipePrint } from '@routes/collections/prints'
import { plural, type CollectionField } from '@routes/collections/collectionFields'
import type { PairingVerdict } from '@/types/food-drink/food-drink'
import { kitchenNav } from './kitchenNav'

const kitchen = useKitchenStore()
const foodDrink = useFoodDrinkStore()
const router = useRouter()

const query = ref('')
const show = ref<'all' | 'favourites'>('all')
const filtered = computed(() => Boolean(query.value.trim()) || show.value === 'favourites')

onMounted(() => {
  void kitchen.loadRecipes()
  if (!foodDrink.pairings.length) void foodDrink.loadPairings()
})

const VERDICT_RANK: Record<PairingVerdict, number> = { great: 2, good: 1, poor: 0 }

/** The best-rated drink for each recipe; poor matches are not suggested. */
const pairs = computed(() => {
  const best = new Map<number, { name: string; rank: number }>()
  for (const p of foodDrink.pairings) {
    const rank = VERDICT_RANK[p.verdict]
    if (!rank || !p.drinkable_name) continue
    const current = best.get(p.kitchen_recipe_id)
    if (!current || rank > current.rank) best.set(p.kitchen_recipe_id, { name: p.drinkable_name, rank })
  }
  return best
})

const prints = computed(() => kitchen.recipes.map((r) => recipePrint(r, pairs.value.get(r.id)?.name ?? null)))

async function reload(): Promise<void> {
  await kitchen.loadRecipes({
    q: query.value.trim() || undefined,
    favourite: show.value === 'favourites' || undefined,
  })
}

async function surprise(): Promise<void> {
  await kitchen.loadRandom()
  const id = kitchen.randomMeal?.mealdb_id
  if (id) await router.push({ name: 'kitchen-meal-preview', params: { mealdbId: id } })
}

const state = computed<ViewState>(() => {
  if (kitchen.recipesLoading && !kitchen.recipes.length) return 'loading'
  return kitchen.recipes.length || filtered.value ? 'ready' : 'empty'
})

const fields = computed<CollectionField[]>(() => {
  const recipes = kitchen.recipes
  const cooked = recipes.reduce((sum, r) => sum + r.cooked_count, 0)
  const favourites = recipes.filter((r) => r.is_favourite).length
  const most = [...recipes].sort((a, b) => b.cooked_count - a.cooked_count)[0]
  return [
    { key: 'saved', label: 'Saved', value: recipes.length, sub: plural(favourites, 'favourite'), variant: 'solid', span: 4 },
    { key: 'cooked', label: 'Times cooked', value: cooked, sub: 'across your saved recipes', variant: 'tint', span: 3 },
    most && most.cooked_count > 0
      ? {
          key: 'most',
          label: 'Most cooked',
          title: most.meal?.name ?? 'Recipe',
          sub: `${most.cooked_count}× so far`,
          variant: 'tint',
          span: 5,
          to: { name: 'kitchen-recipe', params: { recipeId: most.id } },
        }
      : { key: 'most', label: 'Most cooked', title: 'Cook something and mark it done', variant: 'outline', span: 5 },
  ]
})
</script>

<template>
  <IndexTemplate :state="state">
    <template #stage>
      <NxStage
        size="compact"
        eyebrow="Kitchen"
        title="Recipes"
        accent="worth keeping"
        lede="Meals saved from TheMealDB, with what you thought of them and how often they made it to the table."
      >
        <template #actions>
          <RouterLink v-slot="{ href, navigate }" :to="{ name: 'kitchen-discover' }" custom>
            <Button as="a" :href="href" rounded severity="contrast" label="Discover" @click="navigate">
              <template #icon="{ class: iconClass }">
                <NxIcon name="compass" :size="16" :class="iconClass" />
              </template>
            </Button>
          </RouterLink>
          <Button rounded severity="secondary" label="Surprise me" @click="surprise">
            <template #icon="{ class: iconClass }">
              <NxIcon name="dice" :size="16" :class="iconClass" />
            </template>
          </Button>
        </template>
      </NxStage>
    </template>

    <template v-if="kitchen.recipes.length || state === 'loading'" #fields>
      <CollectionFields section="kitchen" :fields="fields" />
    </template>

    <template #toolbar>
      <NxPillNav :items="kitchenNav" label="Recipes" />
      <NxSearchField v-model="query" placeholder="Search saved recipes…" :debounce="350" @search="reload" />
      <NxPillGroup
        v-model="show"
        :options="[
          { value: 'all', label: 'All' },
          { value: 'favourites', label: 'Favourites' },
        ]"
        label="Show"
        size="sm"
        @update:model-value="reload"
      />
    </template>

    <template #empty>
      <NxEmptyState
        title="No saved recipes yet"
        body="Browse TheMealDB, open something that looks good and save it here."
        icon="kitchen"
      >
        <Button rounded label="Discover recipes" @click="router.push({ name: 'kitchen-discover' })" />
      </NxEmptyState>
    </template>

    <NxEmptyState
      v-if="!kitchen.recipes.length"
      title="Nothing matches"
      :body="show === 'favourites' ? 'No favourites match that search yet.' : 'Try another ingredient or dish name.'"
      icon="search"
    />
    <CollectionPrints v-else :prints="prints" filter-label="Tags" :class="{ dim: kitchen.recipesLoading }" />
  </IndexTemplate>
</template>

<style scoped>
.dim {
  opacity: 0.55;
  transition: opacity 0.2s;
}
</style>
