<script setup lang="ts">
import { computed, ref } from 'vue'
import { RouterLink } from 'vue-router'
import NexusImage from '@components/nexus-image/NexusImage.vue'
import NexusImageViewer from '@components/nexus-image-viewer/NexusImageViewer.vue'
import NexusRatingDisplay from '@components/nexus-rating-display/NexusRatingDisplay.vue'
import type { SpiritSpirit } from '@/types/food-drink/spirits'

const props = defineProps<{ spirit: SpiritSpirit }>()

const previewOpen = ref(false)

const canPreview = computed(() => Boolean(props.spirit.media || props.spirit.image_url))

function statusLabel(): string {
  const status = props.spirit.analysis_status ?? 'none'
  if (status === 'complete') return 'Analysed'
  if (status === 'pending') return 'Analysing'
  if (status === 'failed') return 'Failed'
  return 'Ready'
}

function openPreview(event: Event): void {
  event.preventDefault()
  event.stopPropagation()
  if (!canPreview.value) return
  previewOpen.value = true
}

const metaLine = computed(() => {
  const parts: string[] = []
  if (props.spirit.producer) parts.push(props.spirit.producer)
  if (props.spirit.abv != null) parts.push(`${props.spirit.abv}% ABV`)
  return parts.join(' · ')
})

const subLine = computed(() => {
  const parts = [props.spirit.category, props.spirit.age_statement].filter(Boolean)
  return parts.join(' · ') || 'Spirit'
})
</script>

<template>
  <RouterLink
    :to="{ name: 'spirit-detail', params: { spiritId: spirit.id } }"
    class="spirit-card"
  >
    <div class="cover">
      <NexusImage
        :media="spirit.media"
        :src="spirit.image_url"
        :alt="spirit.name"
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
      <div class="scrim">
        <h3>{{ spirit.name }}</h3>
        <p v-if="metaLine" class="meta">{{ metaLine }}</p>
      </div>
    </div>
    <div class="body">
      <p class="style">{{ subLine }}</p>
      <div class="foot">
        <NexusRatingDisplay
          :model-value="spirit.rating"
          accent="var(--spirit-accent, #c47a3a)"
        />
        <span class="status">{{ statusLabel() }}</span>
      </div>
    </div>
  </RouterLink>

  <NexusImageViewer
    v-model:visible="previewOpen"
    :media="spirit.media"
    :src="spirit.image_url"
    :alt="spirit.name"
    variant="hero"
  />
</template>

<style scoped>
.spirit-card {
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border-radius: 0.9rem;
  background: var(--spirit-card-surface);
  text-decoration: none;
  color: inherit;
  transition:
    transform 0.22s ease,
    box-shadow 0.22s ease;
}

.spirit-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 12px 28px color-mix(in srgb, #000 35%, transparent);
}

.cover {
  position: relative;
  aspect-ratio: 4 / 5;
  overflow: hidden;
  background: color-mix(in srgb, var(--spirit-accent) 18%, transparent);
}

.cover :deep(.nexus-image) {
  width: 100%;
  height: 100%;
}

.cover :deep(img) {
  transition: transform 0.35s ease;
}

.spirit-card:hover .cover :deep(img) {
  transform: scale(1.04);
}

.scrim {
  position: absolute;
  inset: auto 0 0;
  padding: 1.4rem 0.85rem 0.75rem;
  background: linear-gradient(
    transparent,
    color-mix(in srgb, #120c04 92%, transparent)
  );
}

.scrim h3 {
  margin: 0;
  font-size: 1rem;
  font-weight: 650;
  line-height: 1.25;
}

.meta {
  margin: 0.2rem 0 0;
  font-size: 0.78rem;
  opacity: 0.78;
}

.expand {
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  z-index: 1;
  width: 2rem;
  height: 2rem;
  border: 0;
  border-radius: 999px;
  display: grid;
  place-items: center;
  cursor: pointer;
  color: var(--lavender-blush);
  background: color-mix(in srgb, #000 45%, transparent);
  opacity: 0;
  transition: opacity 0.2s ease;
}

.spirit-card:hover .expand,
.expand:focus-visible {
  opacity: 1;
}

.body {
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
  padding: 0.7rem 0.8rem 0.85rem;
}

.style {
  margin: 0;
  font-size: 0.8rem;
  opacity: 0.7;
}

.foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
}

.status {
  font-size: 0.72rem;
  letter-spacing: 0.03em;
  text-transform: uppercase;
  opacity: 0.55;
}
</style>
