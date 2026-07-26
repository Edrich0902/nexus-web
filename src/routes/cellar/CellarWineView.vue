<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import NexusPageWrapper from '@components/nexus-page-wrapper/NexusPageWrapper.vue'
import NexusImage from '@components/nexus-image/NexusImage.vue'
import NexusRatingDisplay from '@components/nexus-rating-display/NexusRatingDisplay.vue'
import NexusRatingInput from '@components/nexus-rating-input/NexusRatingInput.vue'
import NexusQuotaBadge from '@components/nexus-quota-badge/NexusQuotaBadge.vue'
import NexusTastingTimeline from '@components/nexus-tasting-timeline/NexusTastingTimeline.vue'
import NexusWineMatchDialog from '@components/nexus-wine-match-dialog/NexusWineMatchDialog.vue'
import NexusSkeletonMedia from '@components/nexus-skeleton-media/NexusSkeletonMedia.vue'
import NexusImageUploader from '@components/nexus-image-uploader/NexusImageUploader.vue'
import { useCellarStore } from '@stores/food-drink/cellar.store'
import type { WineMatchCandidate } from '@/types/food-drink/cellar'
import type { MediaImage } from '@/types/media/media'

const cellar = useCellarStore()
const route = useRoute()
const router = useRouter()

const wineId = computed(() => Number(route.params.wineId))
const showMatch = ref(false)
const showTasting = ref(false)
const showImageUploader = ref(false)
const tastingForm = reactive({
  tasted_on: new Date().toISOString().slice(0, 10),
  rating: null as number | null,
  notes: '',
  occasion: '',
  location: '',
})

async function load(): Promise<void> {
  if (!Number.isFinite(wineId.value)) return
  await cellar.loadWine(wineId.value)
  await cellar.loadQuota()
}

onMounted(load)
watch(wineId, load)

async function openMatch(): Promise<void> {
  showMatch.value = true
  await cellar.fetchCandidates(wineId.value)
}

async function onSearch(q: string): Promise<void> {
  await cellar.fetchCandidates(wineId.value, q || undefined)
}

async function onSelect(candidate: WineMatchCandidate): Promise<void> {
  await cellar.confirmMatch(wineId.value, candidate.wineapi_id)
  showMatch.value = false
}

async function onNoMatch(): Promise<void> {
  await cellar.markNoMatch(wineId.value)
  showMatch.value = false
}

async function saveTasting(): Promise<void> {
  await cellar.addTasting(wineId.value, {
    tasted_on: tastingForm.tasted_on,
    rating: tastingForm.rating,
    notes: tastingForm.notes || null,
    occasion: tastingForm.occasion || null,
    location: tastingForm.location || null,
  })
  showTasting.value = false
}

async function removeWine(): Promise<void> {
  if (await cellar.removeWine(wineId.value)) {
    await router.push({ name: 'cellar' })
  }
}

function onImageUploaded(image: MediaImage | null): void {
  if (!cellar.wine || !image) return
  cellar.wine.media = image
  cellar.wine.image_url = image.url
}
</script>

<template>
  <NexusPageWrapper show-toolbar title="Wine detail">
    <template #toolbar>
      <NexusQuotaBadge :quota="cellar.quota" />
      <Button
        label="Back"
        icon="pi pi-arrow-left"
        text
        severity="secondary"
        @click="router.push({ name: 'cellar' })"
      />
    </template>

    <NexusSkeletonMedia v-if="cellar.wineLoading" />

    <div v-else-if="cellar.wine" class="detail">
      <header class="hero">
        <div class="hero-media">
          <NexusImage
            :media="cellar.wine.media ?? cellar.wine.catalog?.media"
            :src="cellar.wine.image_url ?? cellar.wine.catalog?.image_url"
            :alt="cellar.wine.name"
            variant="hero"
            size="fill"
            fit="cover"
            previewable
          />
        </div>

        <div class="hero-body">
          <div class="hero-info">
            <p class="eyebrow">{{ cellar.wine.producer_name || 'Wine journal' }}</p>
            <h2>{{ cellar.wine.name }}</h2>
            <p class="meta">
              <span v-if="cellar.wine.vintage">{{ cellar.wine.vintage }}</span>
              <span v-if="cellar.wine.wine_type"> · {{ cellar.wine.wine_type }}</span>
              <span v-if="cellar.wine.region_name || cellar.wine.country">
                · {{ cellar.wine.region_name || cellar.wine.country }}
              </span>
            </p>
            <NexusRatingDisplay :model-value="cellar.wine.rating" />
            <p v-if="cellar.wine.match_status" class="match">
              Match: {{ cellar.wine.match_status.replaceAll('_', ' ') }}
            </p>
          </div>

          <div class="hero-actions" role="toolbar" aria-label="Wine actions">
            <Button
              v-if="cellar.wine.match_status !== 'matched'"
              icon="pi pi-search"
              severity="secondary"
              text
              rounded
              aria-label="Find match"
              v-tooltip.left="'Find match'"
              @click="openMatch"
            />
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
              icon="pi pi-pencil"
              severity="secondary"
              text
              rounded
              aria-label="Log tasting"
              v-tooltip.left="'Log tasting'"
              @click="showTasting = true"
            />
            <Button
              icon="pi pi-trash"
              severity="danger"
              text
              rounded
              aria-label="Delete wine"
              v-tooltip.left="'Delete'"
              @click="removeWine"
            />
          </div>
        </div>
      </header>

      <Message
        v-if="cellar.wine.catalog?.enrichment_status === 'queued' || cellar.wine.catalog?.enrichment_status === 'pending'"
        severity="info"
        :closable="false"
      >
        Enrichment {{ cellar.wine.catalog.enrichment_status }} — WineAPI notes will
        appear when the daily budget allows.
      </Message>

      <section v-if="cellar.wine.catalog?.enrichment_status === 'complete'" class="panel">
        <h3>Catalog notes</h3>
        <p v-if="cellar.wine.catalog.description">{{ cellar.wine.catalog.description }}</p>
        <div class="chips">
          <Tag
            v-for="g in cellar.wine.catalog.grapes"
            :key="g.id"
            :value="g.name"
            rounded
          />
        </div>
        <div v-if="cellar.wine.catalog.pairings?.length" class="pairings">
          <h4>Suggested food pairings</h4>
          <ul>
            <li v-for="(p, i) in cellar.wine.catalog.pairings" :key="i">
              {{ p.food }}
              <small v-if="p.notes"> — {{ p.notes }}</small>
            </li>
          </ul>
        </div>
      </section>

      <section class="panel">
        <div class="band-head">
          <h3>Tasting history</h3>
        </div>
        <NexusTastingTimeline
          :tastings="cellar.wine.tastings ?? []"
          @remove="(id) => cellar.removeTasting(id, wineId)"
        />
      </section>

      <section v-if="cellar.wine.notes" class="panel">
        <h3>Notes</h3>
        <p>{{ cellar.wine.notes }}</p>
      </section>
    </div>

    <NexusWineMatchDialog
      v-model:visible="showMatch"
      :loading="cellar.candidatesLoading"
      :result="cellar.candidates"
      @search="onSearch"
      @select="onSelect"
      @no-match="onNoMatch"
    />

    <Dialog
      v-model:visible="showTasting"
      modal
      header="Log tasting"
      style="width: min(420px, 94vw)"
    >
      <div class="form">
        <label>Date</label>
        <InputText v-model="tastingForm.tasted_on" type="date" />
        <label>Rating</label>
        <NexusRatingInput v-model="tastingForm.rating" />
        <label>Occasion</label>
        <InputText v-model="tastingForm.occasion" />
        <label>Location</label>
        <InputText v-model="tastingForm.location" />
        <label>Notes</label>
        <Textarea v-model="tastingForm.notes" rows="3" auto-resize />
      </div>
      <template #footer>
        <Button label="Cancel" text @click="showTasting = false" />
        <Button label="Save" :loading="cellar.saving" @click="saveTasting" />
      </template>
    </Dialog>

    <NexusImageUploader
      v-if="cellar.wine"
      v-model:visible="showImageUploader"
      :model-value="cellar.wine.media ?? null"
      collection="cellar"
      :attach-to="{ type: 'cellar_wine', id: cellar.wine.id }"
      header="Wine image"
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
  background: var(--wine-card-surface);
  align-items: stretch;
}

.hero-media {
  min-height: 18rem;
  border-radius: 0.85rem;
  overflow: hidden;
  background: color-mix(in srgb, var(--wine-accent) 18%, transparent);
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

.match {
  margin: 0.15rem 0 0;
  font-size: 0.8rem;
  text-transform: capitalize;
  opacity: 0.55;
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
  margin: 0 0 0.6rem;
  font-size: 1.05rem;
}

.chips {
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
  margin-top: 0.6rem;
}

.pairings ul {
  margin: 0.4rem 0 0;
  padding-left: 1.1rem;
}

.form {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.form label {
  font-size: 0.8rem;
  opacity: 0.7;
  margin-top: 0.3rem;
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
