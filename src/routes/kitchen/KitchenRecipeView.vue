<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useConfirm } from 'primevue/useconfirm'
import type { ViewState } from '@design/templates/types'
import NxIcon from '@design/components/NxIcon.vue'
import NxIconButton from '@design/components/NxIconButton.vue'
import NxRating from '@design/components/NxRating.vue'
import NexusRatingInput from '@components/nexus-rating-input/NexusRatingInput.vue'
import NexusRecipeDetail from '@components/nexus-recipe-detail/NexusRecipeDetail.vue'
import NexusImageUploader from '@components/nexus-image-uploader/NexusImageUploader.vue'
import { useKitchenStore } from '@stores/food-drink/kitchen.store'
import type { MediaImage } from '@/types/media/media'

const kitchen = useKitchenStore()
const route = useRoute()
const router = useRouter()
const confirm = useConfirm()

const recipeId = computed(() => Number(route.params.recipeId))
const attempted = ref(false)
const showImageUploader = ref(false)
const showRatingEdit = ref(false)

async function load(): Promise<void> {
  attempted.value = false
  if (Number.isFinite(recipeId.value)) await kitchen.loadRecipe(recipeId.value)
  attempted.value = true
}

onMounted(load)
watch(recipeId, load)

const recipe = computed(() => (kitchen.recipe?.id === recipeId.value ? kitchen.recipe : null))

const state = computed<ViewState>(() => {
  if (recipe.value?.meal) return 'ready'
  return kitchen.recipeLoading || !attempted.value ? 'loading' : 'error'
})

const lastCooked = computed(() => {
  const iso = recipe.value?.last_cooked_on
  if (!iso) return null
  return new Date(`${iso.slice(0, 10)}T12:00:00`).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })
})

async function toggleFavourite(): Promise<void> {
  if (!recipe.value) return
  await kitchen.updateRecipe(recipeId.value, { is_favourite: !recipe.value.is_favourite })
}

function askRemove(event: MouseEvent): void {
  confirm.require({
    target: event.currentTarget as HTMLElement,
    message: 'Remove this recipe from your collection?',
    acceptLabel: 'Remove',
    rejectLabel: 'Keep',
    acceptProps: { severity: 'danger', size: 'small' },
    rejectProps: { severity: 'secondary', text: true, size: 'small' },
    accept: async () => {
      if (await kitchen.removeRecipe(recipeId.value)) await router.push({ name: 'kitchen' })
    },
  })
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
  <NexusRecipeDetail
    :state="state"
    :meal="recipe?.meal"
    :media="recipe?.media"
    :image-url="recipe?.image_url"
    :back-to="{ name: 'kitchen' }"
    back-label="Recipes"
    eyebrow="Saved recipe"
  >
    <template #actions>
      <Button rounded severity="contrast" label="Cooked it" @click="kitchen.markCooked(recipeId)">
        <template #icon="{ class: iconClass }">
          <NxIcon name="check" :size="16" :class="iconClass" />
        </template>
      </Button>
      <NxIconButton
        icon="heart"
        :label="recipe?.is_favourite ? 'Remove from favourites' : 'Add to favourites'"
        variant="tint"
        :active="recipe?.is_favourite"
        class="fav"
        :class="{ on: recipe?.is_favourite }"
        @click="toggleFavourite"
      />
      <NxIconButton icon="image" label="Change photo" variant="tint" @click="showImageUploader = true" />
      <NxIconButton icon="trash" label="Remove recipe" variant="tint" @click="askRemove" />
    </template>

    <template #meta>
      <button type="button" class="rating" aria-label="Change rating" @click="showRatingEdit = true">
        <NxRating :value="recipe?.rating" />
      </button>
      <span class="cooked">
        Cooked {{ recipe?.cooked_count ?? 0 }}×<template v-if="lastCooked"> · last on {{ lastCooked }}</template>
      </span>
    </template>
  </NexusRecipeDetail>

  <NexusImageUploader
    v-if="recipe"
    v-model:visible="showImageUploader"
    :model-value="recipe.media ?? null"
    collection="kitchen"
    :attach-to="{ type: 'kitchen_recipe', id: recipe.id }"
    header="Recipe photo"
    @update:model-value="onImageUploaded"
  />

  <Dialog v-if="recipe" v-model:visible="showRatingEdit" modal header="Rate this recipe" style="width: min(22rem, 92vw)">
    <NexusRatingInput :model-value="recipe.rating" size="large" @update:model-value="saveRating" />
  </Dialog>
</template>

<style scoped>
.rating {
  padding: 6px 12px;
  border: 0;
  border-radius: 999px;
  background: var(--tint);
  color: inherit;
  cursor: pointer;
}

.rating:hover {
  background: var(--tint-2);
}

.cooked {
  font-size: 14px;
  color: var(--ink-3);
}

.fav.on {
  color: var(--acc);
}

.fav.on :deep(svg) {
  fill: currentColor;
}
</style>
