<script setup lang="ts">
import NexusImage from '@components/nexus-image/NexusImage.vue'
import type { MealSummary } from '@/types/food-drink/kitchen'

defineProps<{
  meal: MealSummary
}>()

const emit = defineEmits<{
  select: [mealdbId: string]
}>()
</script>

<template>
  <article
    class="discover-card"
    role="button"
    tabindex="0"
    :aria-label="`View ${meal.name ?? 'recipe'}`"
    @click="emit('select', meal.mealdb_id)"
    @keyup.enter="emit('select', meal.mealdb_id)"
  >
    <div class="media">
      <NexusImage
        :src="meal.thumb_url"
        :alt="meal.name ?? 'Recipe'"
        size="fill"
        fit="cover"
      />
      <div class="media-shade" aria-hidden="true" />
    </div>

    <div class="body">
      <div class="meta">
        <span v-if="meal.category">{{ meal.category }}</span>
        <span v-if="meal.category && meal.area" class="dot" aria-hidden="true">·</span>
        <span v-if="meal.area">{{ meal.area }}</span>
      </div>
      <h3>{{ meal.name }}</h3>
      <span class="cta">
        View recipe
        <i class="pi pi-arrow-right" aria-hidden="true" />
      </span>
    </div>
  </article>
</template>

<style scoped>
.discover-card {
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border-radius: 1rem;
  background: var(--coffee-bean-panel);
  border: 1px solid color-mix(in srgb, var(--lavender-blush) 8%, transparent);
  cursor: pointer;
  text-align: left;
  color: inherit;
  transition:
    transform 0.18s ease,
    border-color 0.18s ease,
    box-shadow 0.18s ease;
}

.discover-card:hover,
.discover-card:focus-visible {
  transform: translateY(-3px);
  border-color: color-mix(in srgb, var(--kitchen-accent) 45%, transparent);
  box-shadow: 0 12px 28px color-mix(in srgb, #000 35%, transparent);
  outline: none;
}

.media {
  position: relative;
  aspect-ratio: 4 / 3;
  background: color-mix(in srgb, var(--kitchen-accent) 12%, var(--coffee-bean));
}

.media-shade {
  position: absolute;
  inset: auto 0 0;
  height: 42%;
  background: linear-gradient(
    to top,
    color-mix(in srgb, var(--coffee-bean) 78%, transparent),
    transparent
  );
  pointer-events: none;
}

.body {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  padding: 0.9rem 1rem 1.05rem;
}

.meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.3rem;
  font-size: 0.72rem;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: color-mix(in srgb, var(--kitchen-accent) 85%, var(--lavender-blush));
}

.dot {
  opacity: 0.55;
}

h3 {
  margin: 0;
  font-size: 1.05rem;
  font-weight: 600;
  line-height: 1.3;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.cta {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  margin-top: 0.35rem;
  font-size: 0.82rem;
  color: color-mix(in srgb, var(--lavender-blush) 72%, transparent);
}

.discover-card:hover .cta,
.discover-card:focus-visible .cta {
  color: var(--kitchen-accent);
}

.cta i {
  font-size: 0.7rem;
  transition: transform 0.15s ease;
}

.discover-card:hover .cta i,
.discover-card:focus-visible .cta i {
  transform: translateX(3px);
}
</style>
