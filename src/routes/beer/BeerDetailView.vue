<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import NexusPageWrapper from '@components/nexus-page-wrapper/NexusPageWrapper.vue'
import NexusImage from '@components/nexus-image/NexusImage.vue'
import NexusImageUploader from '@components/nexus-image-uploader/NexusImageUploader.vue'
import NexusRatingDisplay from '@components/nexus-rating-display/NexusRatingDisplay.vue'
import NexusSkeletonMedia from '@components/nexus-skeleton-media/NexusSkeletonMedia.vue'
import { useBeerStore } from '@stores/food-drink/beer.store'
import type { MediaImage } from '@/types/media/media'

const beer = useBeerStore()
const route = useRoute()
const router = useRouter()
const beerId = computed(() => Number(route.params.beerId))
const showImageUploader = ref(false)

async function load(): Promise<void> {
  if (Number.isFinite(beerId.value)) await beer.loadBeer(beerId.value)
}

onMounted(load)
watch(beerId, load)

async function remove(): Promise<void> {
  if (await beer.removeBeer(beerId.value)) {
    await router.push({ name: 'beer' })
  }
}

function onImageUploaded(image: MediaImage | null): void {
  if (!beer.beer || !image) return
  beer.beer.media = image
  beer.beer.image_url = image.url
}
</script>

<template>
  <NexusPageWrapper show-toolbar title="Beer detail">
    <template #toolbar>
      <Button label="Back" icon="pi pi-arrow-left" text @click="router.push({ name: 'beer' })" />
    </template>

    <NexusSkeletonMedia v-if="beer.beerLoading" />
    <div v-else-if="beer.beer" class="detail">
      <header class="hero">
        <div class="hero-media">
          <NexusImage
            :media="beer.beer.media"
            :src="beer.beer.image_url"
            :alt="beer.beer.name"
            variant="hero"
            size="fill"
            fit="cover"
            previewable
          />
        </div>

        <div class="hero-body">
          <div class="hero-info">
            <p class="eyebrow">{{ beer.beer.style?.name || 'Beer' }}</p>
            <h2>{{ beer.beer.name }}</h2>
            <p class="meta">
              <RouterLink
                v-if="beer.beer.brewery"
                :to="{ name: 'beer-brewery', params: { breweryId: beer.beer.brewery.id } }"
              >
                {{ beer.beer.brewery.name }}
              </RouterLink>
              <span v-if="beer.beer.abv != null"> · {{ beer.beer.abv }}% ABV</span>
              <span v-if="beer.beer.ibu != null"> · {{ beer.beer.ibu }} IBU</span>
            </p>
            <NexusRatingDisplay
              :model-value="beer.beer.rating"
              accent="var(--beer-accent, #d8a13a)"
            />
          </div>

          <div class="hero-actions" role="toolbar" aria-label="Beer actions">
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
              icon="pi pi-trash"
              severity="danger"
              text
              rounded
              aria-label="Delete beer"
              v-tooltip.left="'Delete'"
              @click="remove"
            />
          </div>
        </div>
      </header>

      <section v-if="beer.beer.notes" class="panel">
        <h3>Notes</h3>
        <p>{{ beer.beer.notes }}</p>
      </section>
    </div>

    <NexusImageUploader
      v-if="beer.beer"
      v-model:visible="showImageUploader"
      :model-value="beer.beer.media ?? null"
      collection="beer"
      :attach-to="{ type: 'beer_beer', id: beer.beer.id }"
      header="Beer image"
      @update:model-value="onImageUploaded"
    />
  </NexusPageWrapper>
</template>

<style scoped>
.detail {
  display: flex;
  flex-direction: column;
  gap: 1.1rem;
}

.hero {
  display: grid;
  grid-template-columns: minmax(12rem, 16rem) minmax(0, 1fr);
  gap: 1.35rem;
  padding: 1.15rem;
  border-radius: 1.1rem;
  background: var(--beer-card-surface);
  align-items: stretch;
}

.hero-media {
  min-height: 18rem;
  border-radius: 0.85rem;
  overflow: hidden;
  background: color-mix(in srgb, var(--beer-accent) 18%, transparent);
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
  gap: 0.45rem;
  padding-top: 0.15rem;
  min-width: 0;
}

.eyebrow {
  margin: 0;
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  opacity: 0.65;
}

h2 {
  margin: 0;
  font-size: clamp(1.55rem, 2.6vw, 2rem);
  line-height: 1.15;
  font-weight: 700;
}

.meta {
  margin: 0;
  opacity: 0.72;
  font-size: 0.95rem;
}

.meta a {
  color: var(--beer-accent);
}

.hero-actions {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
  padding-top: 0.1rem;
}

.panel {
  padding: 1rem 1.1rem;
  border-radius: 0.85rem;
  background: color-mix(in srgb, var(--coffee-bean-panel) 90%, transparent);
}

.panel h3 {
  margin: 0 0 0.55rem;
  font-size: 1.05rem;
}

@media (max-width: 720px) {
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
}
</style>
