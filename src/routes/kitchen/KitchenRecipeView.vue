<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import NexusPageWrapper from '@components/nexus-page-wrapper/NexusPageWrapper.vue'
import NexusRatingDisplay from '@components/nexus-rating-display/NexusRatingDisplay.vue'
import NexusRatingInput from '@components/nexus-rating-input/NexusRatingInput.vue'
import NexusRecipeDetail from '@components/nexus-recipe-detail/NexusRecipeDetail.vue'
import NexusSkeletonMedia from '@components/nexus-skeleton-media/NexusSkeletonMedia.vue'
import NexusImageUploader from '@components/nexus-image-uploader/NexusImageUploader.vue'
import { useKitchenStore } from '@stores/food-drink/kitchen.store'
import type { MediaImage } from '@/types/media/media'

const kitchen = useKitchenStore()
const route = useRoute()
const router = useRouter()
const recipeId = computed(() => Number(route.params.recipeId))
const showImageUploader = ref(false)
const showRatingEdit = ref(false)

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

function onImageUploaded(image: MediaImage | null): void {
  if (!kitchen.recipe || !image) return
  kitchen.recipe.media = image
  kitchen.recipe.image_url = image.url
}

async function saveRating(value: number | null): Promise<void> {
  await kitchen.updateRecipe(recipeId.value, { rating: value })
  showRatingEdit.value = false
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
      :media="kitchen.recipe.media"
      :image-url="kitchen.recipe.image_url"
      eyebrow="Saved recipe"
    >
      <template #actions>
        <Button
          icon="pi pi-image"
          severity="secondary"
          text
          rounded
          aria-label="Change image"
          v-tooltip.left="'Change image'"
          @click="showImageUploader = true"
        />
        <Button
          :icon="kitchen.recipe.is_favourite ? 'pi pi-heart-fill' : 'pi pi-heart'"
          severity="secondary"
          text
          rounded
          :aria-label="kitchen.recipe.is_favourite ? 'Unfavourite' : 'Favourite'"
          v-tooltip.left="kitchen.recipe.is_favourite ? 'Unfavourite' : 'Favourite'"
          @click="toggleFavourite"
        />
        <Button
          icon="pi pi-check"
          severity="secondary"
          text
          rounded
          aria-label="Mark cooked"
          v-tooltip.left="'Cooked it'"
          @click="kitchen.markCooked(recipeId)"
        />
        <Button
          icon="pi pi-trash"
          severity="danger"
          text
          rounded
          aria-label="Remove recipe"
          v-tooltip.left="'Delete'"
          @click="remove"
        />
      </template>

      <template #meta>
        <div class="meta-row">
          <button
            type="button"
            class="rating-hit"
            aria-label="Edit rating"
            @click="showRatingEdit = true"
          >
            <NexusRatingDisplay
              :model-value="kitchen.recipe.rating"
              accent="var(--kitchen-accent, #6a9e6e)"
            />
          </button>
          <span class="cooked">Cooked {{ kitchen.recipe.cooked_count }}×</span>
        </div>
      </template>
    </NexusRecipeDetail>

    <NexusImageUploader
      v-if="kitchen.recipe"
      v-model:visible="showImageUploader"
      :model-value="kitchen.recipe.media ?? null"
      collection="kitchen"
      :attach-to="{ type: 'kitchen_recipe', id: kitchen.recipe.id }"
      header="Recipe image"
      @update:model-value="onImageUploaded"
    />

    <Dialog
      v-if="kitchen.recipe"
      v-model:visible="showRatingEdit"
      modal
      header="Rate recipe"
      style="width: min(22rem, 92vw)"
    >
      <NexusRatingInput
        :model-value="kitchen.recipe.rating"
        @update:model-value="saveRating"
      />
    </Dialog>
  </NexusPageWrapper>
</template>

<style scoped>
.meta-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.85rem;
}

.rating-hit {
  border: 0;
  padding: 0;
  background: transparent;
  color: inherit;
  cursor: pointer;
}

.cooked {
  font-size: 0.85rem;
  opacity: 0.7;
}
</style>
