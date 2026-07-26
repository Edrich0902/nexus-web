<script setup lang="ts">
import { computed, ref } from 'vue'
import { RouterLink } from 'vue-router'
import NexusImage from '@components/nexus-image/NexusImage.vue'
import NexusImageViewer from '@components/nexus-image-viewer/NexusImageViewer.vue'
import NexusRatingInput from '@components/nexus-rating-input/NexusRatingInput.vue'
import type { KitchenRecipe } from '@/types/food-drink/kitchen'

const props = defineProps<{
  recipe: KitchenRecipe
}>()

const previewOpen = ref(false)

const coverSrc = computed(
  () => props.recipe.image_url ?? props.recipe.meal?.thumb_url ?? null,
)
const canPreview = computed(() => Boolean(props.recipe.media || coverSrc.value))

function openPreview(event: Event): void {
  event.preventDefault()
  event.stopPropagation()
  if (!canPreview.value) return
  previewOpen.value = true
}
</script>

<template>
  <RouterLink
    :to="{ name: 'kitchen-recipe', params: { recipeId: recipe.id } }"
    class="recipe-card"
  >
    <div class="cover">
      <NexusImage
        :media="recipe.media"
        :src="coverSrc"
        :alt="recipe.meal?.name ?? 'Recipe'"
        variant="card"
        size="fill"
        fit="cover"
      />
      <button
        v-if="canPreview"
        type="button"
        class="expand"
        aria-label="View image larger"
        @click="openPreview"
      >
        <i class="pi pi-search-plus" />
      </button>
      <i v-if="recipe.is_favourite" class="pi pi-heart-fill fav" />
      <div class="scrim">
        <h3>{{ recipe.meal?.name }}</h3>
        <p class="meta">
          {{ [recipe.meal?.category, recipe.meal?.area].filter(Boolean).join(' · ') }}
        </p>
      </div>
    </div>
    <div class="body">
      <NexusRatingInput :model-value="recipe.rating" readonly />
      <span class="cooked">Cooked {{ recipe.cooked_count }}×</span>
    </div>
  </RouterLink>

  <NexusImageViewer
    v-model:visible="previewOpen"
    :media="recipe.media"
    :src="coverSrc"
    :alt="recipe.meal?.name ?? 'Recipe'"
    variant="hero"
  />
</template>

<style scoped>
.recipe-card {
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border-radius: 0.9rem;
  background: var(--kitchen-card-surface);
  text-decoration: none;
  color: inherit;
  transition:
    transform 0.22s ease,
    box-shadow 0.22s ease;
}

.recipe-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 12px 28px color-mix(in srgb, #000 35%, transparent);
}

.cover {
  position: relative;
  aspect-ratio: 4 / 5;
  overflow: hidden;
  background: color-mix(in srgb, var(--kitchen-accent) 18%, transparent);
}

.cover :deep(.nexus-image) {
  width: 100%;
  height: 100%;
}

.cover :deep(img) {
  transition: transform 0.35s ease;
}

.recipe-card:hover .cover :deep(img) {
  transform: scale(1.04);
}

.scrim {
  position: absolute;
  inset: auto 0 0;
  padding: 1.4rem 0.85rem 0.75rem;
  background: linear-gradient(
    transparent,
    color-mix(in srgb, #08120a 92%, transparent)
  );
}

h3 {
  margin: 0;
  font-size: 1.05rem;
  font-weight: 650;
  line-height: 1.25;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.meta {
  margin: 0.2rem 0 0;
  font-size: 0.8rem;
  opacity: 0.78;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.expand {
  position: absolute;
  top: 0.55rem;
  right: 0.55rem;
  z-index: 2;
  width: 2rem;
  height: 2rem;
  border: 0;
  border-radius: 999px;
  display: grid;
  place-items: center;
  cursor: pointer;
  color: #fff;
  background: color-mix(in srgb, #000 45%, transparent);
  backdrop-filter: blur(6px);
  opacity: 0;
  transition: opacity 0.2s ease;
}

.recipe-card:hover .expand,
.expand:focus-visible {
  opacity: 1;
}

.fav {
  position: absolute;
  top: 0.65rem;
  left: 0.65rem;
  z-index: 2;
  color: var(--kitchen-accent);
  filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.45));
}

.body {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  padding: 0.75rem 0.85rem 0.9rem;
}

.cooked {
  font-size: 0.75rem;
  opacity: 0.65;
  white-space: nowrap;
}
</style>
