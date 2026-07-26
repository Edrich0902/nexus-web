<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import NexusPageWrapper from '@components/nexus-page-wrapper/NexusPageWrapper.vue'
import NexusImage from '@components/nexus-image/NexusImage.vue'
import NexusRatingInput from '@components/nexus-rating-input/NexusRatingInput.vue'
import NexusQuotaBadge from '@components/nexus-quota-badge/NexusQuotaBadge.vue'
import NexusTastingTimeline from '@components/nexus-tasting-timeline/NexusTastingTimeline.vue'
import NexusWineMatchDialog from '@components/nexus-wine-match-dialog/NexusWineMatchDialog.vue'
import NexusSkeletonMedia from '@components/nexus-skeleton-media/NexusSkeletonMedia.vue'
import { useCellarStore } from '@stores/food-drink/cellar.store'
import type { WineMatchCandidate } from '@/types/food-drink/cellar'

const cellar = useCellarStore()
const route = useRoute()
const router = useRouter()

const wineId = computed(() => Number(route.params.wineId))
const showMatch = ref(false)
const showTasting = ref(false)
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
        <NexusImage
          :src="cellar.wine.catalog?.image_url"
          :alt="cellar.wine.name"
          size="lg"
          rounded
        />
        <div class="info">
          <p class="eyebrow">{{ cellar.wine.producer_name || 'Wine journal' }}</p>
          <h2>{{ cellar.wine.name }}</h2>
          <p class="meta">
            <span v-if="cellar.wine.vintage">{{ cellar.wine.vintage }}</span>
            <span v-if="cellar.wine.wine_type"> · {{ cellar.wine.wine_type }}</span>
            <span v-if="cellar.wine.region_name || cellar.wine.country">
              · {{ cellar.wine.region_name || cellar.wine.country }}
            </span>
          </p>
          <NexusRatingInput :model-value="cellar.wine.rating" readonly />
          <div class="actions">
            <Button
              v-if="cellar.wine.match_status !== 'matched'"
              label="Find match"
              icon="pi pi-search"
              @click="openMatch"
            />
            <Button
              label="Log tasting"
              icon="pi pi-pencil"
              severity="secondary"
              @click="showTasting = true"
            />
            <Button
              icon="pi pi-trash"
              severity="danger"
              text
              aria-label="Delete wine"
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
  </NexusPageWrapper>
</template>

<style scoped>
.detail {
  display: flex;
  flex-direction: column;
  gap: 1.1rem;
}

.hero {
  display: flex;
  gap: 1.25rem;
  padding: 1.2rem;
  border-radius: 1rem;
  background: var(--wine-card-surface);
  flex-wrap: wrap;
}

.info {
  flex: 1;
  min-width: 220px;
}

.eyebrow {
  margin: 0;
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  opacity: 0.65;
}

h2 {
  margin: 0.2rem 0;
  font-size: 1.6rem;
}

.meta {
  margin: 0 0 0.6rem;
  opacity: 0.7;
}

.actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: 0.85rem;
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

.band-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>
