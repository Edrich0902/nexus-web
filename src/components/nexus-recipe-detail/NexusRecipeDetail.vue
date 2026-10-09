<script setup lang="ts">
import { computed } from 'vue'
import type { RouteLocationRaw } from 'vue-router'
import DetailTemplate from '@design/templates/DetailTemplate.vue'
import type { ViewState } from '@design/templates/types'
import NxStage from '@design/components/NxStage.vue'
import NxPanel from '@design/components/NxPanel.vue'
import NxSectionHeader from '@design/components/NxSectionHeader.vue'
import NxChips from '@design/components/NxChips.vue'
import NxIcon from '@design/components/NxIcon.vue'
import { usePaletteAmbient } from '@design/usePaletteAmbient'
import NexusImage from '@components/nexus-image/NexusImage.vue'
import { mediaDeliveryUrl } from '@lib/media'
import type { MealDetail } from '@/types/food-drink/kitchen'
import type { MediaImage } from '@/types/media/media'

/**
 * A recipe page: dish photo and serif name on the stage, the method in the
 * main column and ingredients in a sticky aside. Used for saved recipes and
 * TheMealDB previews.
 */
const props = withDefaults(
  defineProps<{
    state: ViewState
    meal?: MealDetail | null
    backTo: RouteLocationRaw
    backLabel: string
    eyebrow?: string
    media?: MediaImage | null
    imageUrl?: string | null
  }>(),
  { meal: null, eyebrow: undefined, media: null, imageUrl: null },
)

const heroSrc = computed(() => props.imageUrl ?? props.meal?.thumb_url ?? null)

usePaletteAmbient(() => mediaDeliveryUrl(props.media, 'thumb') ?? heroSrc.value)

const steps = computed(() => {
  const raw = (props.meal?.instructions ?? '').trim()
  if (!raw) return []

  const byBreak = raw
    .split(/\r?\n+/)
    .map((line) => line.trim())
    .filter((line) => line && !/^step\s*\d+:?$/i.test(line))
    .map((line) => line.replace(/^(step\s*)?\d+[).\-:]?\s+/i, ''))

  if (byBreak.length > 1) return byBreak

  const sentences = raw
    .split(/(?<=[.!?])\s+(?=[A-Z])/)
    .map((s) => s.trim())
    .filter((s) => s.length > 12)

  return sentences.length > 1 ? sentences : [raw]
})

const tags = computed(() => props.meal?.tags?.filter(Boolean).slice(0, 4) ?? [])

const lede = computed(() => {
  const m = props.meal
  if (!m) return undefined
  const parts = [m.area ? `${m.area} cooking` : null, m.category, `${m.ingredients.length} ingredients`]
  return parts.filter(Boolean).join(' · ')
})
</script>

<template>
  <DetailTemplate
    :state="state"
    :back-to="backTo"
    :back-label="backLabel"
    error-title="Recipe not found"
    aside-first
  >
    <template #stage>
      <NxStage :eyebrow="eyebrow" :title="meal?.name" :lede="lede">
        <template #visual>
          <NexusImage
            :media="media"
            :src="heroSrc"
            :alt="meal?.name ?? ''"
            variant="hero"
            size="fill"
            fit="cover"
            previewable
          />
        </template>
        <template v-if="$slots.actions" #actions>
          <slot name="actions" />
        </template>
        <div v-if="$slots.meta || tags.length" class="meta">
          <slot name="meta" />
          <NxChips :items="tags" label="Tags" />
        </div>
      </NxStage>
    </template>

    <section aria-labelledby="method-title">
      <NxSectionHeader id="method-title" :title="`Method · ${steps.length} steps`" />
      <ol class="steps">
        <li v-for="(step, i) in steps" :key="i">
          <span class="n num" aria-hidden="true">{{ String(i + 1).padStart(2, '0') }}</span>
          <p>{{ step }}</p>
        </li>
      </ol>
    </section>

    <template #aside>
      <NxPanel :title="`Ingredients · ${meal?.ingredients.length ?? 0}`" class="ingredients">
        <ul>
          <li v-for="ing in meal?.ingredients ?? []" :key="`${ing.id}-${ing.position}`">
            <span class="name">{{ ing.name }}</span>
            <span class="measure">{{ ing.measure || '—' }}</span>
          </li>
        </ul>
      </NxPanel>
      <div v-if="meal?.youtube_url || meal?.source_url" class="links">
        <a v-if="meal.youtube_url" :href="meal.youtube_url" target="_blank" rel="noopener noreferrer">
          Watch it made <NxIcon name="external-link" :size="14" />
        </a>
        <a v-if="meal.source_url" :href="meal.source_url" target="_blank" rel="noopener noreferrer">
          Original recipe <NxIcon name="external-link" :size="14" />
        </a>
      </div>
      <slot name="aside" />
    </template>
  </DetailTemplate>
</template>

<style scoped>
.meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 14px;
  margin-top: 20px;
}

.steps {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
}

.steps li {
  display: grid;
  grid-template-columns: 56px minmax(0, 1fr);
  gap: 16px;
  padding: 20px 0;
  border-top: 1px solid var(--line);
}

.steps li:first-child {
  border-top: 0;
  padding-top: 4px;
}

.n {
  font-family: var(--font-display);
  font-weight: 800;
  font-size: 28px;
  letter-spacing: -0.04em;
  line-height: 1;
  color: var(--acc);
}

.steps p {
  margin: 0;
  font-size: 16.5px;
  line-height: 1.7;
  color: var(--ink-2);
  max-width: 68ch;
}

.ingredients {
  position: sticky;
  top: calc(var(--shell-top, 72px) + 12px);
}

.ingredients ul {
  list-style: none;
  margin: 0;
  padding: 0;
}

.ingredients li {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 16px;
  padding: 11px 0;
  border-top: 1px solid var(--line);
  font-size: 14.5px;
}

.ingredients li:first-child {
  border-top: 0;
}

.name {
  color: var(--ink);
}

.measure {
  flex-shrink: 0;
  max-width: 50%;
  text-align: right;
  font-family: var(--font-mono);
  font-size: 13px;
  color: var(--acc);
}

.links {
  display: flex;
  flex-wrap: wrap;
  gap: 18px;
  padding: 0 4px;
}

.links a {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  color: var(--ink-2);
}

.links a:hover {
  color: var(--ink);
}

@media (max-width: 960px) {
  .ingredients {
    position: static;
  }
}

@media (max-width: 640px) {
  .steps li {
    grid-template-columns: 40px minmax(0, 1fr);
    gap: 12px;
  }

  .n {
    font-size: 22px;
  }

  .steps p {
    font-size: 15.5px;
  }
}
</style>
