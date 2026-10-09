<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import IndexTemplate from '@design/templates/IndexTemplate.vue'
import type { ViewState } from '@design/templates/types'
import NxStage from '@design/components/NxStage.vue'
import NxPillNav from '@design/components/NxPillNav.vue'
import NxPillGroup from '@design/components/NxPillGroup.vue'
import NxCoverGrid from '@design/components/NxCoverGrid.vue'
import NxCoverCard from '@design/components/NxCoverCard.vue'
import NxSearchField from '@design/components/NxSearchField.vue'
import NxEmptyState from '@design/components/NxEmptyState.vue'
import NxIcon from '@design/components/NxIcon.vue'
import { useKitchenStore } from '@stores/food-drink/kitchen.store'
import CollectionFields from '@routes/collections/CollectionFields.vue'
import { plural, type CollectionField } from '@routes/collections/collectionFields'
import { kitchenNav } from './kitchenNav'

const kitchen = useKitchenStore()
const router = useRouter()

const query = ref('')
const show = ref<'all' | 'favourites'>('all')
const filtered = computed(() => Boolean(query.value.trim()) || show.value === 'favourites')

onMounted(() => {
  void kitchen.loadRecipes()
})

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
    <NxCoverGrid v-else :class="{ dim: kitchen.recipesLoading }">
      <NxCoverCard
        v-for="r in kitchen.recipes"
        :key="r.id"
        :to="{ name: 'kitchen-recipe', params: { recipeId: r.id } }"
        :title="r.meal?.name ?? 'Recipe'"
        :sub="[r.meal?.category, r.meal?.area].filter(Boolean).join(' · ')"
        :meta="r.cooked_count ? `Cooked ${r.cooked_count}×` : 'Not cooked yet'"
        :media="r.media"
        :src="r.image_url ?? r.meal?.thumb_url"
        :rating="r.rating"
        :favourite="r.is_favourite"
        aspect="square"
        icon="kitchen"
      />
    </NxCoverGrid>
  </IndexTemplate>
</template>

<style scoped>
.dim {
  opacity: 0.55;
  transition: opacity 0.2s;
}
</style>
