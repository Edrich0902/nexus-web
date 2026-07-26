<script setup lang="ts">
import { computed, ref } from 'vue'
import { RouterLink } from 'vue-router'
import NexusImage from '@components/nexus-image/NexusImage.vue'
import NexusImageViewer from '@components/nexus-image-viewer/NexusImageViewer.vue'
import NexusRatingDisplay from '@components/nexus-rating-display/NexusRatingDisplay.vue'
import type { CellarWine } from '@/types/food-drink/cellar'

const props = defineProps<{
  wine: CellarWine
}>()

const previewOpen = ref(false)

const coverMedia = computed(
  () => props.wine.media ?? props.wine.catalog?.media ?? null,
)
const coverSrc = computed(
  () => props.wine.image_url ?? props.wine.catalog?.image_url ?? null,
)
const canPreview = computed(() => Boolean(coverMedia.value || coverSrc.value))

function matchLabel(status: string): string {
  return status.replaceAll('_', ' ')
}

function openPreview(event: Event): void {
  event.preventDefault()
  event.stopPropagation()
  if (!canPreview.value) return
  previewOpen.value = true
}
</script>

<template>
  <RouterLink
    :to="{ name: 'cellar-wine', params: { wineId: wine.id } }"
    class="wine-card"
  >
    <div class="cover">
      <NexusImage
        :media="coverMedia"
        :src="coverSrc"
        :alt="wine.name"
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
        <h3>{{ wine.name }}</h3>
        <p class="meta">
          <span v-if="wine.producer_name">{{ wine.producer_name }}</span>
          <span v-if="wine.vintage"> · {{ wine.vintage }}</span>
        </p>
      </div>
    </div>
    <div class="body">
      <p class="region">
        {{ [wine.region_name, wine.country].filter(Boolean).join(' · ') || '—' }}
      </p>
      <div class="foot">
        <NexusRatingDisplay :model-value="wine.rating" />
        <span class="status">{{ matchLabel(wine.match_status) }}</span>
      </div>
    </div>
  </RouterLink>

  <NexusImageViewer
    v-model:visible="previewOpen"
    :media="coverMedia"
    :src="coverSrc"
    :alt="wine.name"
    variant="hero"
  />
</template>

<style scoped>
.wine-card {
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border-radius: 0.9rem;
  background: var(--wine-card-surface);
  text-decoration: none;
  color: inherit;
  transition:
    transform 0.22s ease,
    box-shadow 0.22s ease;
}

.wine-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 12px 28px color-mix(in srgb, #000 35%, transparent);
}

.cover {
  position: relative;
  aspect-ratio: 4 / 5;
  overflow: hidden;
  background: color-mix(in srgb, var(--wine-accent) 18%, transparent);
}

.cover :deep(.nexus-image) {
  width: 100%;
  height: 100%;
}

.cover :deep(img) {
  transition: transform 0.35s ease;
}

.wine-card:hover .cover :deep(img) {
  transform: scale(1.04);
}

.scrim {
  position: absolute;
  inset: auto 0 0;
  padding: 1.4rem 0.85rem 0.75rem;
  background: linear-gradient(
    transparent,
    color-mix(in srgb, #12080a 92%, transparent)
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

.wine-card:hover .expand,
.expand:focus-visible {
  opacity: 1;
}

.body {
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
  padding: 0.75rem 0.85rem 0.9rem;
}

.region {
  margin: 0;
  font-size: 0.78rem;
  opacity: 0.65;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
}

.status {
  font-size: 0.7rem;
  text-transform: capitalize;
  opacity: 0.6;
  white-space: nowrap;
}
</style>
