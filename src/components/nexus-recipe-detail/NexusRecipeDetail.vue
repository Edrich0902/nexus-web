<script setup lang="ts">
import { computed } from 'vue'
import NexusImage from '@components/nexus-image/NexusImage.vue'
import type { MealDetail } from '@/types/food-drink/kitchen'
import type { MediaImage } from '@/types/media/media'

const props = defineProps<{
  meal: MealDetail
  eyebrow?: string
  media?: MediaImage | null
  imageUrl?: string | null
}>()

const heroSrc = computed(
  () => props.imageUrl ?? props.meal.thumb_url ?? null,
)

const steps = computed(() => {
  const raw = (props.meal.instructions ?? '').trim()
  if (!raw) return []

  const byBreak = raw
    .split(/\r?\n+/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => line.replace(/^\d+[\).\-:]\s*/, ''))

  if (byBreak.length > 1) return byBreak

  const sentenceSplit = raw
    .split(/(?<=[.!?])\s+(?=[A-Z])/)
    .map((s) => s.trim())
    .filter((s) => s.length > 12)

  return sentenceSplit.length > 1 ? sentenceSplit : [raw]
})

const tags = computed(() => props.meal.tags?.filter(Boolean) ?? [])
</script>

<template>
  <div class="recipe-detail">
    <header class="hero">
      <div class="hero-media">
        <NexusImage
          :media="media"
          :src="heroSrc"
          :alt="meal.name"
          variant="hero"
          size="fill"
          fit="cover"
          previewable
        />
      </div>

      <div class="hero-body">
        <div class="hero-info">
          <p v-if="eyebrow" class="eyebrow">{{ eyebrow }}</p>
          <h2>{{ meal.name }}</h2>
          <div class="chips">
            <span v-if="meal.category" class="chip">{{ meal.category }}</span>
            <span v-if="meal.area" class="chip">{{ meal.area }}</span>
            <span
              v-for="tag in tags.slice(0, 3)"
              :key="tag"
              class="chip chip-muted"
            >
              {{ tag }}
            </span>
          </div>
          <div v-if="$slots.meta" class="meta-slot">
            <slot name="meta" />
          </div>
        </div>

        <div v-if="$slots.actions" class="hero-actions">
          <slot name="actions" />
        </div>
      </div>
    </header>

    <div class="layout">
      <aside class="ingredients">
        <div class="section-head">
          <h3>Ingredients</h3>
          <span class="count">{{ meal.ingredients.length }}</span>
        </div>
        <ul>
          <li
            v-for="ing in meal.ingredients"
            :key="`${ing.id}-${ing.position}`"
          >
            <span class="measure">{{ ing.measure || '—' }}</span>
            <span class="name">{{ ing.name }}</span>
          </li>
        </ul>
      </aside>

      <section class="method">
        <div class="section-head">
          <h3>Method</h3>
          <span class="count">{{ steps.length }} steps</span>
        </div>
        <ol>
          <li v-for="(step, index) in steps" :key="index">
            <span class="step-num" aria-hidden="true">{{ index + 1 }}</span>
            <p>{{ step }}</p>
          </li>
        </ol>
      </section>
    </div>
  </div>
</template>

<style scoped>
.recipe-detail {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.hero {
  display: grid;
  grid-template-columns: minmax(12rem, 16rem) minmax(0, 1fr);
  gap: 1.35rem;
  padding: 1.15rem;
  overflow: hidden;
  border-radius: 1.1rem;
  background: var(--kitchen-card-surface);
  border: 1px solid color-mix(in srgb, var(--lavender-blush) 8%, transparent);
  align-items: stretch;
}

.hero-media {
  min-height: 18rem;
  border-radius: 0.85rem;
  overflow: hidden;
  background: color-mix(in srgb, var(--kitchen-accent) 18%, transparent);
}

.hero-media :deep(.nexus-image) {
  width: 100%;
  height: 100%;
  min-height: 18rem;
}

.hero-body {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 0.75rem;
  align-items: start;
  min-width: 0;
}

.hero-info {
  display: flex;
  flex-direction: column;
  gap: 0.55rem;
  padding-top: 0.15rem;
  min-width: 0;
}

.eyebrow {
  margin: 0;
  font-size: 0.72rem;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  opacity: 0.65;
}

.chips {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
}

.chip {
  font-size: 0.72rem;
  letter-spacing: 0.03em;
  text-transform: uppercase;
  padding: 0.28rem 0.55rem;
  border-radius: 0.4rem;
  background: color-mix(in srgb, var(--kitchen-accent) 22%, transparent);
  color: color-mix(in srgb, var(--kitchen-accent) 80%, var(--lavender-blush));
}

.chip-muted {
  background: color-mix(in srgb, var(--lavender-blush) 10%, transparent);
  color: color-mix(in srgb, var(--lavender-blush) 75%, transparent);
}

h2 {
  margin: 0;
  font-size: clamp(1.55rem, 2.6vw, 2rem);
  line-height: 1.15;
  font-weight: 700;
}

.hero-actions {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
  padding-top: 0.1rem;
}

.meta-slot {
  margin-top: 0.1rem;
}

.layout {
  display: grid;
  grid-template-columns: minmax(240px, 0.9fr) minmax(0, 1.4fr);
  gap: 1rem;
  align-items: start;
}

.ingredients,
.method {
  border-radius: 1rem;
  padding: 1.15rem 1.2rem 1.25rem;
  background: color-mix(in srgb, var(--coffee-bean-panel) 92%, transparent);
  border: 1px solid color-mix(in srgb, var(--lavender-blush) 7%, transparent);
}

.ingredients {
  position: sticky;
  top: 0.75rem;
}

.section-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 0.75rem;
  margin-bottom: 0.9rem;
  padding-bottom: 0.65rem;
  border-bottom: 1px solid color-mix(in srgb, var(--lavender-blush) 10%, transparent);
}

.section-head h3 {
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
}

.count {
  font-size: 0.75rem;
  opacity: 0.55;
}

.ingredients ul {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
}

.ingredients li {
  display: grid;
  grid-template-columns: minmax(4.5rem, 35%) 1fr;
  gap: 0.75rem;
  padding: 0.55rem 0;
  border-bottom: 1px solid color-mix(in srgb, var(--lavender-blush) 6%, transparent);
  font-size: 0.92rem;
}

.ingredients li:last-child {
  border-bottom: 0;
}

.measure {
  color: color-mix(in srgb, var(--kitchen-accent) 75%, var(--lavender-blush));
  font-variant-numeric: tabular-nums;
}

.name {
  opacity: 0.92;
}

.method ol {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
}

.method li {
  display: grid;
  grid-template-columns: 2rem 1fr;
  gap: 0.85rem;
  align-items: start;
}

.step-num {
  width: 2rem;
  height: 2rem;
  border-radius: 0.55rem;
  display: grid;
  place-items: center;
  font-size: 0.85rem;
  font-weight: 650;
  background: color-mix(in srgb, var(--kitchen-accent) 20%, transparent);
  color: color-mix(in srgb, var(--kitchen-accent) 85%, var(--lavender-blush));
}

.method p {
  margin: 0.15rem 0 0;
  line-height: 1.65;
  font-size: 0.98rem;
  color: color-mix(in srgb, var(--lavender-blush) 92%, transparent);
}

@media (max-width: 900px) {
  .hero {
    grid-template-columns: 1fr;
  }

  .hero-media,
  .hero-media :deep(.nexus-image) {
    min-height: 14rem;
    aspect-ratio: 4 / 3;
  }

  .hero-actions {
    flex-direction: row;
  }

  .layout {
    grid-template-columns: 1fr;
  }

  .ingredients {
    position: static;
  }
}
</style>
