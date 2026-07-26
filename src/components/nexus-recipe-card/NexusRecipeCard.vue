<script setup lang="ts">
import { RouterLink } from 'vue-router'
import NexusImage from '@components/nexus-image/NexusImage.vue'
import NexusRatingInput from '@components/nexus-rating-input/NexusRatingInput.vue'
import type { KitchenRecipe } from '@/types/food-drink/kitchen'

defineProps<{
  recipe: KitchenRecipe
}>()
</script>

<template>
  <RouterLink
    :to="{ name: 'kitchen-recipe', params: { recipeId: recipe.id } }"
    class="recipe-card"
  >
    <NexusImage
      :src="recipe.meal?.thumb_url"
      :alt="recipe.meal?.name ?? 'Recipe'"
      size="md"
      rounded
    />
    <div class="body">
      <div class="top">
        <h3>{{ recipe.meal?.name }}</h3>
        <i v-if="recipe.is_favourite" class="pi pi-heart-fill fav" />
      </div>
      <p class="meta">
        {{ [recipe.meal?.category, recipe.meal?.area].filter(Boolean).join(' · ') }}
      </p>
      <div class="foot">
        <NexusRatingInput :model-value="recipe.rating" readonly />
        <span>Cooked {{ recipe.cooked_count }}×</span>
      </div>
    </div>
  </RouterLink>
</template>

<style scoped>
.recipe-card {
  display: flex;
  gap: 0.9rem;
  padding: 0.9rem;
  border-radius: 0.85rem;
  background: var(--kitchen-card-surface);
  text-decoration: none;
  color: inherit;
}

.body {
  flex: 1;
  min-width: 0;
}

.top {
  display: flex;
  justify-content: space-between;
  gap: 0.5rem;
}

h3 {
  margin: 0;
  font-size: 1rem;
}

.meta {
  margin: 0.25rem 0 0.5rem;
  font-size: 0.85rem;
  opacity: 0.7;
}

.foot {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.75rem;
  opacity: 0.7;
}

.fav {
  color: var(--kitchen-accent);
}
</style>
