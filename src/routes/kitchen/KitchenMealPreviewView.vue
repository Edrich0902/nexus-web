<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import type { ViewState } from '@design/templates/types'
import NxIcon from '@design/components/NxIcon.vue'
import NexusRecipeDetail from '@components/nexus-recipe-detail/NexusRecipeDetail.vue'
import { useKitchenStore } from '@stores/food-drink/kitchen.store'

const kitchen = useKitchenStore()
const route = useRoute()
const router = useRouter()

const mealdbId = computed(() => String(route.params.mealdbId ?? ''))
const attempted = ref(false)

async function load(): Promise<void> {
  attempted.value = false
  if (mealdbId.value) await kitchen.loadMealPreview(mealdbId.value)
  attempted.value = true
}

onMounted(load)
watch(mealdbId, load)

const meal = computed(() => (kitchen.previewMeal?.mealdb_id === mealdbId.value ? kitchen.previewMeal : null))

const state = computed<ViewState>(() => {
  if (meal.value) return 'ready'
  return kitchen.previewLoading || !attempted.value ? 'loading' : 'error'
})

async function save(): Promise<void> {
  if (!mealdbId.value) return
  const saved = await kitchen.saveMeal(mealdbId.value)
  if (saved) await router.push({ name: 'kitchen-recipe', params: { recipeId: saved.id } })
}
</script>

<template>
  <NexusRecipeDetail
    :state="state"
    :meal="meal"
    :back-to="{ name: 'kitchen-discover' }"
    back-label="Discover"
    eyebrow="From TheMealDB"
  >
    <template #actions>
      <Button rounded severity="contrast" label="Save to my recipes" :loading="kitchen.saving" @click="save">
        <template #icon="{ class: iconClass }">
          <NxIcon name="bookmark" :size="16" :class="iconClass" />
        </template>
      </Button>
    </template>
  </NexusRecipeDetail>
</template>
