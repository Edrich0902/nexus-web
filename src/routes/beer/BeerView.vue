<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import NexusPageWrapper from '@components/nexus-page-wrapper/NexusPageWrapper.vue'
import NexusBeerIcon from '@components/nexus-beer-icon/NexusBeerIcon.vue'
import NexusBeerCard from '@components/nexus-beer-card/NexusBeerCard.vue'
import NexusRatingInput from '@components/nexus-rating-input/NexusRatingInput.vue'
import NexusSkeletonCards from '@components/nexus-skeleton-cards/NexusSkeletonCards.vue'
import { useBeerStore } from '@stores/food-drink/beer.store'
import type { BeerBrewery } from '@/types/food-drink/beer'

const beer = useBeerStore()
const router = useRouter()
const showCreate = ref(false)
const breweryQuery = ref('')
const selectedBrewery = ref<BeerBrewery | null>(null)
const form = reactive({
  name: '',
  beer_style_id: null as number | null,
  abv: null as number | null,
  rating: null as number | null,
  notes: '',
  format: 'can',
  manual_brewery_name: '',
  manual_city: '',
  manual_country: 'South Africa',
})

onMounted(async () => {
  await beer.loadBeers()
  await beer.loadStyles()
})

function resetCreateForm(): void {
  form.name = ''
  form.beer_style_id = null
  form.abv = null
  form.rating = null
  form.notes = ''
  form.format = 'can'
  form.manual_brewery_name = ''
  form.manual_city = ''
  form.manual_country = 'South Africa'
  selectedBrewery.value = null
  breweryQuery.value = ''
  beer.clearBreweryResults()
}

function openCreate(): void {
  resetCreateForm()
  showCreate.value = true
}

function clearBrewerySearch(): void {
  breweryQuery.value = ''
  beer.clearBreweryResults()
}

async function searchBreweries(): Promise<void> {
  if (breweryQuery.value.trim()) {
    await beer.searchBreweries(breweryQuery.value.trim())
  }
}

async function pickUpstream(obdbId: string): Promise<void> {
  const imported = await beer.importBrewery(obdbId)
  if (imported) {
    selectedBrewery.value = imported
    clearBrewerySearch()
  }
}

async function createManualBrewery(): Promise<void> {
  if (!form.manual_brewery_name.trim()) return
  const created = await beer.createManualBrewery({
    name: form.manual_brewery_name.trim(),
    city: form.manual_city || null,
    country: form.manual_country || null,
  })
  if (created) {
    selectedBrewery.value = created
    form.manual_brewery_name = ''
    form.manual_city = ''
    clearBrewerySearch()
  }
}

function clearSelectedBrewery(): void {
  selectedBrewery.value = null
}

async function submit(): Promise<void> {
  if (!form.name.trim()) return
  const created = await beer.createBeer({
    name: form.name.trim(),
    beer_brewery_id: selectedBrewery.value?.id ?? null,
    beer_style_id: form.beer_style_id,
    abv: form.abv,
    rating: form.rating,
    notes: form.notes || null,
    format: form.format,
  })
  if (created) {
    showCreate.value = false
    await router.push({ name: 'beer-detail', params: { beerId: created.id } })
  }
}
</script>

<template>
  <NexusPageWrapper show-toolbar title="Beer">
    <template #toolbar>
      <Button label="Log beer" icon="pi pi-plus" @click="openCreate" />
    </template>

    <div class="beer-page">
      <header class="hero">
        <div class="icon-wrap"><NexusBeerIcon :size="28" /></div>
        <div>
          <p class="eyebrow">Cellar & Kitchen</p>
          <h2>Beer log</h2>
          <p class="muted">
            Capture beers you drink and link them to a brewery — Open Brewery DB
            or your own entry when coverage is thin.
          </p>
        </div>
      </header>

      <NexusSkeletonCards v-if="beer.beersLoading" :cards="4" />
      <div v-else-if="beer.beers.length" class="grid">
        <NexusBeerCard v-for="b in beer.beers" :key="b.id" :beer="b" />
      </div>
      <p v-else class="empty">No beers logged yet.</p>
    </div>

    <Dialog
      v-model:visible="showCreate"
      modal
      header="Log beer"
      style="width: min(520px, 94vw)"
      @hide="resetCreateForm"
    >
      <div class="form">
        <label>Name</label>
        <InputText v-model="form.name" />
        <label>Style</label>
        <Select
          v-model="form.beer_style_id"
          :options="beer.styles"
          option-label="name"
          option-value="id"
          placeholder="Select style"
          show-clear
        />
        <label>ABV</label>
        <InputNumber v-model="form.abv" :min-fraction-digits="1" :max-fraction-digits="1" />
        <label>Rating</label>
        <NexusRatingInput v-model="form.rating" />
        <label>Notes</label>
        <Textarea v-model="form.notes" rows="2" auto-resize />

        <h4>Brewery</h4>
        <div v-if="selectedBrewery" class="picked-row">
          <p class="picked">
            Linked: {{ selectedBrewery.name }}
            <small v-if="selectedBrewery.city || selectedBrewery.country">
              {{ [selectedBrewery.city, selectedBrewery.country].filter(Boolean).join(', ') }}
            </small>
          </p>
          <Button label="Change" text size="small" @click="clearSelectedBrewery" />
        </div>
        <template v-else>
          <div class="row">
            <InputText
              v-model="breweryQuery"
              placeholder="Search Open Brewery DB…"
              class="grow"
              @keyup.enter="searchBreweries"
            />
            <Button icon="pi pi-search" @click="searchBreweries" />
          </div>
          <ul v-if="beer.breweryResults.length" class="results">
            <li v-for="r in beer.breweryResults" :key="r.obdb_id">
              <button type="button" @click="pickUpstream(r.obdb_id)">
                {{ r.name }}
                <small>{{ [r.city, r.country].filter(Boolean).join(', ') }}</small>
              </button>
            </li>
          </ul>

          <p class="hint">Not in OBDB? Create a local brewery:</p>
          <InputText v-model="form.manual_brewery_name" placeholder="Brewery name" />
          <div class="row">
            <InputText v-model="form.manual_city" placeholder="City" />
            <InputText v-model="form.manual_country" placeholder="Country" />
          </div>
          <Button label="Create local brewery" severity="secondary" size="small" @click="createManualBrewery" />
        </template>
      </div>
      <template #footer>
        <Button label="Cancel" text @click="showCreate = false" />
        <Button label="Save" :loading="beer.saving" :disabled="!form.name.trim()" @click="submit" />
      </template>
    </Dialog>
  </NexusPageWrapper>
</template>

<style scoped>
.beer-page { display: flex; flex-direction: column; gap: 1.1rem; }
.hero {
  display: flex; gap: 0.9rem; padding: 1.2rem; border-radius: 1rem;
  background: var(--beer-card-surface);
}
.icon-wrap {
  width: 3rem; height: 3rem; border-radius: 0.75rem; display: grid; place-items: center;
  background: color-mix(in srgb, var(--beer-accent) 22%, transparent); color: var(--beer-accent);
}
.eyebrow { margin: 0; font-size: 0.75rem; text-transform: uppercase; opacity: 0.65; }
h2 { margin: 0.15rem 0; }
.muted { margin: 0; opacity: 0.7; }
.grid {
  display: grid; grid-template-columns: repeat(auto-fill, minmax(12.5rem, 1fr)); gap: 1rem;
}
.empty { opacity: 0.7; }
.form { display: flex; flex-direction: column; gap: 0.4rem; }
.form label, .hint { font-size: 0.8rem; opacity: 0.7; margin-top: 0.35rem; }
.row { display: flex; gap: 0.5rem; }
.grow { flex: 1; }
.results { list-style: none; margin: 0.4rem 0; padding: 0; max-height: 160px; overflow: auto; }
.results button {
  width: 100%; text-align: left; padding: 0.45rem 0.55rem; border-radius: 0.45rem;
  border: 0; background: color-mix(in srgb, var(--coffee-bean) 40%, transparent); color: inherit; cursor: pointer;
}
.results small { display: block; opacity: 0.65; }
.picked-row {
  display: flex; align-items: flex-start; justify-content: space-between; gap: 0.5rem;
  margin-top: 0.25rem;
}
.picked {
  margin: 0; color: var(--beer-accent); font-size: 0.9rem; font-weight: 600;
}
.picked small { display: block; font-weight: 400; opacity: 0.75; margin-top: 0.15rem; }
</style>
