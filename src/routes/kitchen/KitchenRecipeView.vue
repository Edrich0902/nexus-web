<script setup lang="ts">
import { computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import NexusPageWrapper from '@components/nexus-page-wrapper/NexusPageWrapper.vue'
import NexusRatingInput from '@components/nexus-rating-input/NexusRatingInput.vue'
import NexusRecipeDetail from '@components/nexus-recipe-detail/NexusRecipeDetail.vue'
import NexusSkeletonMedia from '@components/nexus-skeleton-media/NexusSkeletonMedia.vue'
import { useKitchenStore } from '@stores/food-drink/kitchen.store'

const kitchen = useKitchenStore()
const route = useRoute()
const router = useRouter()
const recipeId = computed(() => Number(route.params.recipeId))

async function load(): Promise<void> {
  if (Number.isFinite(recipeId.value)) {
    await kitchen.loadRecipe(recipeId.value)
  }
}

onMounted(load)
watch(recipeId, load)

async function toggleFavourite(): Promise<void> {
  if (!kitchen.recipe) return
  await kitchen.updateRecipe(recipeId.value, {
    is_favourite: !kitchen.recipe.is_favourite,
  })
}

async function remove(): Promise<void> {
  if (await kitchen.removeRecipe(recipeId.value)) {
    await router.push({ name: 'kitchen' })
  }
}
</script>

<template>
  <NexusPageWrapper show-toolbar title="Recipe">
    <template #toolbar>
      <Button
        label="Back"
        icon="pi pi-arrow-left"
        text
        @click="router.push({ name: 'kitchen' })"
      />
    </template>

    <NexusSkeletonMedia v-if="kitchen.recipeLoading" />

    <NexusRecipeDetail
      v-else-if="kitchen.recipe?.meal"
      :meal="kitchen.recipe.meal"
      eyebrow="Saved recipe"
    >
      <template #actions>
        <Button
          :label="kitchen.recipe.is_favourite ? 'Favourited' : 'Favourite'"
          :icon="kitchen.recipe.is_favourite ? 'pi pi-heart-fill' : 'pi pi-heart'"
          severity="secondary"
          @click="toggleFavourite"
        />
        <Button
          label="Cooked it"
          icon="pi pi-check"
          @click="kitchen.markCooked(recipeId)"
        />
        <Button
          icon="pi pi-trash"
          severity="danger"
          text
          aria-label="Remove recipe"
          @click="remove"
        />
      </template>

      <template #meta>
        <div class="meta-row">
          <NexusRatingInput
            :model-value="kitchen.recipe.rating"
            @update:model-value="(v) => kitchen.updateRecipe(recipeId, { rating: v })"
          />
          <span class="cooked">Cooked {{ kitchen.recipe.cooked_count }}×</span>
        </div>
      </template>
    </NexusRecipeDetail>
  </NexusPageWrapper>
</template>

<style scoped>
.meta-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.85rem;
}

.cooked {
  font-size: 0.85rem;
  opacity: 0.7;
}
</style>
