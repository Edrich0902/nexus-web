<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import IndexTemplate from '@design/templates/IndexTemplate.vue'
import type { ViewState } from '@design/templates/types'
import NxStage from '@design/components/NxStage.vue'
import NxCoverGrid from '@design/components/NxCoverGrid.vue'
import NxCoverCard from '@design/components/NxCoverCard.vue'
import NxSearchField from '@design/components/NxSearchField.vue'
import NxEmptyState from '@design/components/NxEmptyState.vue'
import NxIcon from '@design/components/NxIcon.vue'
import NexusRatingInput from '@components/nexus-rating-input/NexusRatingInput.vue'
import { useBeerStore } from '@stores/food-drink/beer.store'
import CollectionFields from '@routes/collections/CollectionFields.vue'
import { drinkFields } from '@routes/collections/collectionFields'
import type { BeerBrewery } from '@/types/food-drink/beer'

const beer = useBeerStore()
const router = useRouter()

const query = ref('')
const searched = ref('')

onMounted(() => {
  void beer.loadBeers()
  void beer.loadStyles()
})

async function search(q: string): Promise<void> {
  searched.value = q
  await beer.loadBeers(q || undefined)
}

const state = computed<ViewState>(() => {
  if (beer.beersLoading && !beer.beers.length) return 'loading'
  return beer.beers.length ? 'ready' : 'empty'
})

const fields = computed(() =>
  drinkFields({
    items: beer.beers,
    total: beer.beers.length,
    countLabel: 'Beers logged',
    noun: 'beer',
    to: (b) => ({ name: 'beer-detail', params: { beerId: b.id } }),
  }),
)

/* ── Create ─────────────────────────────────────────────── */

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

const formats = [
  { label: 'Can', value: 'can' },
  { label: 'Bottle', value: 'bottle' },
  { label: 'Draught', value: 'draught' },
]

function resetCreateForm(): void {
  Object.assign(form, {
    name: '',
    beer_style_id: null,
    abv: null,
    rating: null,
    notes: '',
    format: 'can',
    manual_brewery_name: '',
    manual_city: '',
    manual_country: 'South Africa',
  })
  selectedBrewery.value = null
  breweryQuery.value = ''
  beer.clearBreweryResults()
}

function openCreate(): void {
  resetCreateForm()
  showCreate.value = true
}

async function searchBreweries(): Promise<void> {
  if (breweryQuery.value.trim()) await beer.searchBreweries(breweryQuery.value.trim())
}

async function pickUpstream(obdbId: string): Promise<void> {
  const imported = await beer.importBrewery(obdbId)
  if (imported) {
    selectedBrewery.value = imported
    breweryQuery.value = ''
    beer.clearBreweryResults()
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
    beer.clearBreweryResults()
  }
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

const place = (b: { city?: string | null; country?: string | null }): string =>
  [b.city, b.country].filter(Boolean).join(', ')
</script>

<template>
  <IndexTemplate :state="searched && state === 'empty' ? 'ready' : state">
    <template #stage>
      <NxStage
        size="compact"
        eyebrow="Taproom"
        title="Beer"
        accent="log"
        lede="Every can, bottle and pour — linked to its brewery, with AI notes on style and bitterness."
      >
        <template #actions>
          <Button rounded severity="contrast" label="Log a beer" @click="openCreate">
            <template #icon="{ class: iconClass }">
              <NxIcon name="plus" :size="16" :class="iconClass" />
            </template>
          </Button>
        </template>
      </NxStage>
    </template>

    <template v-if="beer.beers.length || state === 'loading'" #fields>
      <CollectionFields section="beer" :fields="fields" />
    </template>

    <template #toolbar>
      <NxSearchField v-model="query" placeholder="Search beers and breweries…" :debounce="350" @search="search" />
    </template>

    <template #empty>
      <NxEmptyState
        title="No beers logged yet"
        body="Log what you are drinking and link it to a brewery from Open Brewery DB, or add your own."
        icon="beer"
      >
        <Button rounded label="Log your first beer" @click="openCreate" />
      </NxEmptyState>
    </template>

    <NxEmptyState
      v-if="!beer.beers.length"
      :title="`Nothing matches “${searched}”`"
      body="Try a brewery or a style."
      icon="search"
    />
    <NxCoverGrid v-else :class="{ dim: beer.beersLoading }">
      <NxCoverCard
        v-for="b in beer.beers"
        :key="b.id"
        :to="{ name: 'beer-detail', params: { beerId: b.id } }"
        :title="b.name"
        :sub="b.brewery?.name"
        :meta="[b.style?.name, b.abv != null ? `${b.abv}%` : null].filter(Boolean).join(' · ')"
        :media="b.media"
        :src="b.image_url"
        :rating="b.rating"
        :badge="b.analysis_status === 'pending' ? 'Analysing' : null"
        icon="beer"
      />
    </NxCoverGrid>
  </IndexTemplate>

  <Dialog
    v-model:visible="showCreate"
    modal
    header="Log a beer"
    style="width: min(520px, 94vw)"
    @hide="resetCreateForm"
  >
    <form class="nx-form" @submit.prevent="submit">
      <label class="f">
        <span>Name</span>
        <InputText v-model="form.name" autofocus />
      </label>
      <div class="row">
        <label class="f">
          <span>Style</span>
          <Select
            v-model="form.beer_style_id"
            :options="beer.styles"
            option-label="name"
            option-value="id"
            placeholder="Choose a style"
            filter
            show-clear
          />
        </label>
        <label class="f">
          <span>ABV %</span>
          <InputNumber v-model="form.abv" :min-fraction-digits="1" :max-fraction-digits="1" :min="0" :max="70" />
        </label>
      </div>
      <div class="row">
        <div class="f">
          <span>Format</span>
          <SelectButton v-model="form.format" :options="formats" option-label="label" option-value="value" :allow-empty="false" />
        </div>
        <div class="f">
          <span>Rating</span>
          <NexusRatingInput v-model="form.rating" />
        </div>
      </div>
      <label class="f">
        <span>Notes</span>
        <Textarea v-model="form.notes" rows="2" auto-resize />
      </label>

      <div class="f">
        <span>Brewery</span>
        <div v-if="selectedBrewery" class="picked">
          <div>
            <strong>{{ selectedBrewery.name }}</strong>
            <small v-if="place(selectedBrewery)">{{ place(selectedBrewery) }}</small>
          </div>
          <Button label="Change" text size="small" @click="selectedBrewery = null" />
        </div>
        <template v-else>
          <div class="lookup">
            <InputText
              v-model="breweryQuery"
              placeholder="Search Open Brewery DB…"
              @keydown.enter.prevent="searchBreweries"
            />
            <Button label="Find" severity="secondary" rounded @click="searchBreweries" />
          </div>
          <ul v-if="beer.breweryResults.length" class="results">
            <li v-for="r in beer.breweryResults" :key="r.obdb_id">
              <button type="button" @click="pickUpstream(r.obdb_id)">
                {{ r.name }}
                <small>{{ place(r) }}</small>
              </button>
            </li>
          </ul>
          <p class="hint">Not listed? Add it yourself:</p>
          <InputText v-model="form.manual_brewery_name" placeholder="Brewery name" />
          <div class="row">
            <InputText v-model="form.manual_city" placeholder="City" />
            <InputText v-model="form.manual_country" placeholder="Country" />
          </div>
          <Button
            label="Add brewery"
            severity="secondary"
            size="small"
            rounded
            class="self-start"
            :disabled="!form.manual_brewery_name.trim()"
            @click="createManualBrewery"
          />
        </template>
      </div>
    </form>
    <template #footer>
      <Button label="Cancel" text severity="secondary" @click="showCreate = false" />
      <Button label="Save beer" rounded :loading="beer.saving" :disabled="!form.name.trim()" @click="submit" />
    </template>
  </Dialog>
</template>

<style scoped>
.dim {
  opacity: 0.55;
  transition: opacity 0.2s;
}

.picked {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 14px;
  border-radius: var(--r-md);
  background: color-mix(in srgb, var(--acc) 14%, transparent);
}

.picked small {
  display: block;
  color: var(--ink-3);
  margin-top: 2px;
}

.lookup {
  display: flex;
  gap: 8px;
}

.lookup :deep(.p-inputtext) {
  flex: 1;
}

.results {
  list-style: none;
  margin: 0;
  padding: 4px;
  max-height: 180px;
  overflow: auto;
  border-radius: var(--r-md);
  background: var(--surface);
}

.results button {
  width: 100%;
  padding: 10px 12px;
  border: 0;
  border-radius: var(--r-sm);
  background: transparent;
  color: inherit;
  font: inherit;
  text-align: left;
  cursor: pointer;
}

.results button:hover {
  background: var(--tint-2);
}

.results small {
  display: block;
  color: var(--ink-3);
}

.self-start {
  align-self: flex-start;
}
</style>
