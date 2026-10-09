<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import IndexTemplate from '@design/templates/IndexTemplate.vue'
import type { ViewState } from '@design/templates/types'
import NxStage from '@design/components/NxStage.vue'
import NxPillNav from '@design/components/NxPillNav.vue'
import NxCoverGrid from '@design/components/NxCoverGrid.vue'
import NxCoverCard from '@design/components/NxCoverCard.vue'
import NxSearchField from '@design/components/NxSearchField.vue'
import NxEmptyState from '@design/components/NxEmptyState.vue'
import NxIcon from '@design/components/NxIcon.vue'
import { useKitchenStore } from '@stores/food-drink/kitchen.store'
import { kitchenNav } from './kitchenNav'

const kitchen = useKitchenStore()
const router = useRouter()

const DEFAULT_CATEGORY = 'Seafood'
const q = ref('')
const category = ref<string | null>(DEFAULT_CATEGORY)
const area = ref<string | null>(null)

onMounted(async () => {
  await Promise.all([kitchen.loadFilters(), kitchen.browseDiscover({ category: DEFAULT_CATEGORY })])
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

async function browse(): Promise<void> {
  q.value = ''
  await search()
}

async function surprise(): Promise<void> {
  await kitchen.loadRandom()
  const id = kitchen.randomMeal?.mealdb_id
  if (id) await router.push({ name: 'kitchen-meal-preview', params: { mealdbId: id } })
}

const heading = computed(() => {
  if (q.value.trim()) return `Results for “${q.value.trim()}”`
  return [area.value, category.value].filter(Boolean).join(' ') || 'Everything'
})

const state = computed<ViewState>(() => {
  if (kitchen.discoverLoading && !kitchen.discover.length) return 'loading'
  return 'ready'
})
</script>

<template>
  <IndexTemplate :state="state">
    <template #stage>
      <NxStage
        size="compact"
        eyebrow="Kitchen · TheMealDB"
        title="What should we"
        accent="cook?"
        lede="Browse by category or cuisine, open anything that looks good, and save the keepers."
      >
        <template #actions>
          <Button rounded severity="contrast" label="Surprise me" @click="surprise">
            <template #icon="{ class: iconClass }">
              <NxIcon name="dice" :size="16" :class="iconClass" />
            </template>
          </Button>
        </template>
      </NxStage>
    </template>

    <template #toolbar>
      <NxPillNav :items="kitchenNav" label="Recipes" />
      <NxSearchField v-model="q" placeholder="Search meals…" @search="search" />
      <Select
        v-model="category"
        :options="kitchen.filters?.categories ?? []"
        placeholder="Category"
        show-clear
        class="filter"
        aria-label="Category"
        @change="browse"
      />
      <Select
        v-model="area"
        :options="kitchen.filters?.areas ?? []"
        placeholder="Cuisine"
        show-clear
        filter
        class="filter"
        aria-label="Cuisine"
        @change="browse"
      />
    </template>

    <h2 class="nx-label heading">{{ heading }}</h2>

    <NxEmptyState
      v-if="!kitchen.discover.length"
      title="No meals found"
      body="Try a different search, or clear the filters to browse everything in a category."
      icon="search"
    >
      <Button
        rounded
        severity="secondary"
        label="Browse seafood"
        @click="
          category = DEFAULT_CATEGORY;
          area = null;
          browse()
        "
      />
    </NxEmptyState>
    <NxCoverGrid v-else :class="{ dim: kitchen.discoverLoading }">
      <NxCoverCard
        v-for="m in kitchen.discover"
        :key="m.mealdb_id"
        :to="{ name: 'kitchen-meal-preview', params: { mealdbId: m.mealdb_id } }"
        :title="m.name ?? 'Meal'"
        :sub="[m.category, m.area].filter(Boolean).join(' · ') || null"
        :src="m.thumb_url"
        aspect="square"
        icon="kitchen"
      />
    </NxCoverGrid>
  </IndexTemplate>
</template>

<style scoped>
.filter {
  width: 168px;
  border-radius: 999px;
}

.heading {
  margin: 0 0 18px;
}

.dim {
  opacity: 0.55;
  transition: opacity 0.2s;
}

@media (max-width: 640px) {
  .filter {
    flex: 1 1 140px;
    width: auto;
  }
}
</style>
