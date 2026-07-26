<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import NexusPageWrapper from '@components/nexus-page-wrapper/NexusPageWrapper.vue'
import NexusWineIcon from '@components/nexus-wine-icon/NexusWineIcon.vue'
import NexusWineCard from '@components/nexus-wine-card/NexusWineCard.vue'
import NexusQuotaBadge from '@components/nexus-quota-badge/NexusQuotaBadge.vue'
import NexusSkeletonCards from '@components/nexus-skeleton-cards/NexusSkeletonCards.vue'
import NexusRatingInput from '@components/nexus-rating-input/NexusRatingInput.vue'
import { useCellarStore } from '@stores/food-drink/cellar.store'

const cellar = useCellarStore()
const router = useRouter()

const showCreate = ref(false)
const filter = ref('')
const form = reactive({
  name: '',
  producer_name: '',
  vintage: null as number | null,
  wine_type: '',
  region_name: '',
  country: '',
  rating: null as number | null,
  notes: '',
})

onMounted(() => {
  void cellar.loadWines()
  void cellar.loadQuota()
})

async function search(): Promise<void> {
  await cellar.loadWines({ q: filter.value || undefined })
}

async function submitCreate(): Promise<void> {
  if (!form.name.trim()) return
  const created = await cellar.createWine({
    name: form.name.trim(),
    producer_name: form.producer_name || null,
    vintage: form.vintage,
    wine_type: form.wine_type || null,
    region_name: form.region_name || null,
    country: form.country || null,
    rating: form.rating,
    notes: form.notes || null,
  })
  if (created) {
    showCreate.value = false
    form.name = ''
    form.producer_name = ''
    form.vintage = null
    form.wine_type = ''
    form.region_name = ''
    form.country = ''
    form.rating = null
    form.notes = ''
    await router.push({ name: 'cellar-wine', params: { wineId: created.id } })
  }
}
</script>

<template>
  <NexusPageWrapper show-toolbar title="Wine">
    <template #toolbar>
      <NexusQuotaBadge :quota="cellar.quota" />
      <Button
        label="Add wine"
        icon="pi pi-plus"
        @click="showCreate = true"
      />
    </template>

    <div class="cellar-page">
      <header class="hero">
        <div class="glow" aria-hidden="true" />
        <div class="hero-main">
          <div class="icon-wrap">
            <NexusWineIcon :size="28" />
          </div>
          <div>
            <p class="eyebrow">Cellar & Kitchen</p>
            <h2>Wine journal</h2>
            <p class="muted">
              Capture what you drink, match to WineAPI when you want enrichment,
              and build tasting history over time.
            </p>
          </div>
        </div>
        <div class="stats">
          <div class="stat">
            <strong>{{ cellar.winesTotal }}</strong>
            <span>Wines</span>
          </div>
          <div class="stat">
            <strong>{{ cellar.quota?.remaining ?? '—' }}</strong>
            <span>API left</span>
          </div>
        </div>
      </header>

      <div class="filters">
        <InputText
          v-model="filter"
          placeholder="Filter wines…"
          class="grow"
          @keyup.enter="search"
        />
        <Button label="Search" icon="pi pi-search" severity="secondary" @click="search" />
      </div>

      <NexusSkeletonCards v-if="cellar.winesLoading" :cards="6" />
      <div v-else-if="cellar.wines.length" class="grid">
        <NexusWineCard v-for="w in cellar.wines" :key="w.id" :wine="w" />
      </div>
      <p v-else class="empty">No wines yet — add your first bottle.</p>
    </div>

    <Dialog
      v-model:visible="showCreate"
      modal
      header="Add wine"
      style="width: min(480px, 94vw)"
    >
      <div class="form">
        <label>Name</label>
        <InputText v-model="form.name" />
        <label>Producer</label>
        <InputText v-model="form.producer_name" />
        <div class="row">
          <div>
            <label>Vintage</label>
            <InputNumber v-model="form.vintage" :use-grouping="false" />
          </div>
          <div>
            <label>Type</label>
            <InputText v-model="form.wine_type" placeholder="Red / White…" />
          </div>
        </div>
        <label>Region</label>
        <InputText v-model="form.region_name" />
        <label>Country</label>
        <InputText v-model="form.country" />
        <label>Rating</label>
        <NexusRatingInput v-model="form.rating" />
        <label>Notes</label>
        <Textarea v-model="form.notes" rows="3" auto-resize />
      </div>
      <template #footer>
        <Button label="Cancel" text severity="secondary" @click="showCreate = false" />
        <Button
          label="Save"
          :loading="cellar.saving"
          :disabled="!form.name.trim()"
          @click="submitCreate"
        />
      </template>
    </Dialog>
  </NexusPageWrapper>
</template>

<style scoped>
.cellar-page {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.hero {
  position: relative;
  overflow: hidden;
  border-radius: 1rem;
  padding: 1.25rem 1.4rem;
  background: var(--wine-card-surface);
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
}

.glow {
  position: absolute;
  inset: -40% auto auto -10%;
  width: 220px;
  height: 220px;
  background: color-mix(in srgb, var(--wine-accent) 28%, transparent);
  filter: blur(40px);
  pointer-events: none;
}

.hero-main {
  position: relative;
  display: flex;
  gap: 0.9rem;
  max-width: 42rem;
}

.icon-wrap {
  width: 3rem;
  height: 3rem;
  border-radius: 0.75rem;
  display: grid;
  place-items: center;
  background: color-mix(in srgb, var(--wine-accent) 22%, transparent);
  color: var(--wine-accent);
  flex-shrink: 0;
}

.eyebrow {
  margin: 0;
  font-size: 0.75rem;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  opacity: 0.65;
}

h2 {
  margin: 0.15rem 0;
  font-size: 1.55rem;
}

.muted {
  margin: 0;
  opacity: 0.72;
  font-size: 0.92rem;
}

.stats {
  display: flex;
  gap: 1rem;
  align-items: center;
}

.stat {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
}

.stat strong {
  font-size: 1.35rem;
}

.stat span {
  font-size: 0.75rem;
  opacity: 0.65;
}

.filters {
  display: flex;
  gap: 0.5rem;
}

.grow {
  flex: 1;
}

.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(12.5rem, 1fr));
  gap: 1rem;
}

.empty {
  opacity: 0.65;
}

.form {
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
}

.form label {
  font-size: 0.8rem;
  opacity: 0.75;
  margin-top: 0.35rem;
}

.row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.75rem;
}
</style>
