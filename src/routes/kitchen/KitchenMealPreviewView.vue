<script setup lang="ts">
import { computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import NexusPageWrapper from '@components/nexus-page-wrapper/NexusPageWrapper.vue'
import NexusRecipeDetail from '@components/nexus-recipe-detail/NexusRecipeDetail.vue'
import NexusSkeletonMedia from '@components/nexus-skeleton-media/NexusSkeletonMedia.vue'
import { useKitchenStore } from '@stores/food-drink/kitchen.store'

const kitchen = useKitchenStore()
const route = useRoute()
const router = useRouter()

const mealdbId = computed(() => String(route.params.mealdbId ?? ''))

async function load(): Promise<void> {
  if (mealdbId.value) {
    await kitchen.loadMealPreview(mealdbId.value)
  }
}

onMounted(load)
watch(mealdbId, load)

async function save(): Promise<void> {
  if (!mealdbId.value) return
  const saved = await kitchen.saveMeal(mealdbId.value)
  if (saved) {
    await router.push({ name: 'kitchen-recipe', params: { recipeId: saved.id } })
  }
}
</script>

<template>
  <NexusPageWrapper show-toolbar title="Recipe preview">
    <template #toolbar>
      <Button
        label="Back to discover"
        icon="pi pi-arrow-left"
        text
        @click="router.push({ name: 'kitchen-discover' })"
      />
    </template>

    <NexusSkeletonMedia v-if="kitchen.previewLoading" />

    <NexusRecipeDetail
      v-else-if="kitchen.previewMeal"
      :meal="kitchen.previewMeal"
      eyebrow="Preview from TheMealDB"
    >
      <template #actions>
        <Button
          icon="pi pi-bookmark"
          severity="secondary"
          text
          rounded
          aria-label="Save to my recipes"
          v-tooltip.left="'Save to my recipes'"
          :loading="kitchen.saving"
          @click="save"
        />
        <Button
          icon="pi pi-compass"
          severity="secondary"
          text
          rounded
          aria-label="Keep browsing"
          v-tooltip.left="'Keep browsing'"
          @click="router.push({ name: 'kitchen-discover' })"
        />
      </template>
    </NexusRecipeDetail>

    <p v-else class="empty">Meal not found.</p>
  </NexusPageWrapper>
</template>

<style scoped>
.empty {
  opacity: 0.65;
}
</style>
