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
import NexusQuotaBadge from '@components/nexus-quota-badge/NexusQuotaBadge.vue'
import NexusRatingInput from '@components/nexus-rating-input/NexusRatingInput.vue'
import { useCellarStore } from '@stores/food-drink/cellar.store'
import { useAnalysisStore } from '@stores/analysis/analysis.store'
import CollectionFields from '@routes/collections/CollectionFields.vue'
import { drinkFields } from '@routes/collections/collectionFields'

const cellar = useCellarStore()
const analysis = useAnalysisStore()
const router = useRouter()

const query = ref('')
const searched = ref('')

onMounted(() => {
  void cellar.loadWines()
  void analysis.loadQuota()
})

async function search(q: string): Promise<void> {
  searched.value = q
  await cellar.loadWines({ q: q || undefined })
}

const state = computed<ViewState>(() => {
  if (cellar.winesLoading && !cellar.wines.length) return 'loading'
  return cellar.wines.length ? 'ready' : 'empty'
})

const fields = computed(() =>
  drinkFields({
    items: cellar.wines,
    total: cellar.winesTotal,
    countLabel: 'Bottles',
    noun: 'wine',
    to: (w) => ({ name: 'cellar-wine', params: { wineId: w.id } }),
  }),
)

const showCreate = ref(false)
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

function openCreate(): void {
  Object.assign(form, {
    name: '',
    producer_name: '',
    vintage: null,
    wine_type: '',
    region_name: '',
    country: '',
    rating: null,
    notes: '',
  })
  showCreate.value = true
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
    await router.push({ name: 'cellar-wine', params: { wineId: created.id } })
  }
}

function badge(status?: string): string | null {
  if (status === 'pending') return 'Analysing'
  if (status === 'failed') return 'Analysis failed'
  return null
}
</script>

<template>
  <IndexTemplate :state="searched && state === 'empty' ? 'ready' : state">
    <template #stage>
      <NxStage
        size="compact"
        eyebrow="Cellar"
        title="Wine"
        accent="journal"
        lede="Every bottle you open — label photos, tastings and AI notes on structure and pairings."
      >
        <template #actions>
          <Button rounded severity="contrast" label="Add wine" @click="openCreate">
            <template #icon="{ class: iconClass }">
              <NxIcon name="plus" :size="16" :class="iconClass" />
            </template>
          </Button>
        </template>
      </NxStage>
    </template>

    <template v-if="cellar.wines.length || state === 'loading'" #fields>
      <CollectionFields section="cellar" :fields="fields" />
    </template>

    <template #toolbar>
      <NxSearchField
        v-model="query"
        placeholder="Search wines, producers, regions…"
        :debounce="350"
        @search="search"
      />
      <span class="grow" />
      <NexusQuotaBadge :quota="analysis.quota" />
    </template>

    <template #empty>
      <NxEmptyState
        title="Your cellar is empty"
        body="Add the bottle you are drinking tonight. A label photo lets AI write the tasting notes for you."
        icon="wine"
      >
        <Button rounded label="Add your first wine" @click="openCreate" />
      </NxEmptyState>
    </template>

    <NxEmptyState
      v-if="!cellar.wines.length"
      :title="`Nothing matches “${searched}”`"
      body="Try a producer, a region or part of the name."
      icon="search"
    />
    <NxCoverGrid v-else :class="{ dim: cellar.winesLoading }">
      <NxCoverCard
        v-for="w in cellar.wines"
        :key="w.id"
        :to="{ name: 'cellar-wine', params: { wineId: w.id } }"
        :title="w.name"
        :sub="w.producer_name"
        :meta="[w.vintage, w.region_name || w.country].filter(Boolean).join(' · ')"
        :media="w.media"
        :src="w.image_url"
        :rating="w.rating"
        :badge="badge(w.analysis_status)"
        icon="wine"
      />
    </NxCoverGrid>
  </IndexTemplate>

  <Dialog v-model:visible="showCreate" modal header="Add a wine" style="width: min(500px, 94vw)">
    <form class="nx-form" @submit.prevent="submitCreate">
      <label class="f">
        <span>Name</span>
        <InputText v-model="form.name" autofocus placeholder="Winemakers Selection Cape Blend" />
      </label>
      <label class="f">
        <span>Producer</span>
        <InputText v-model="form.producer_name" />
      </label>
      <div class="row">
        <label class="f">
          <span>Vintage</span>
          <InputNumber v-model="form.vintage" :use-grouping="false" :min="1800" :max="2100" />
        </label>
        <label class="f">
          <span>Style</span>
          <InputText v-model="form.wine_type" placeholder="Red, white, rosé…" />
        </label>
      </div>
      <div class="row">
        <label class="f">
          <span>Region</span>
          <InputText v-model="form.region_name" />
        </label>
        <label class="f">
          <span>Country</span>
          <InputText v-model="form.country" />
        </label>
      </div>
      <div class="f">
        <span>Rating</span>
        <NexusRatingInput v-model="form.rating" />
      </div>
      <label class="f">
        <span>Notes</span>
        <Textarea v-model="form.notes" rows="3" auto-resize />
      </label>
    </form>
    <template #footer>
      <Button label="Cancel" text severity="secondary" @click="showCreate = false" />
      <Button
        label="Save wine"
        rounded
        :loading="cellar.saving"
        :disabled="!form.name.trim()"
        @click="submitCreate"
      />
    </template>
  </Dialog>
</template>

<style scoped>
.grow {
  flex: 1;
}

.dim {
  opacity: 0.55;
  transition: opacity 0.2s;
}
</style>
