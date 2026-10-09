<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import NxSectionHeader from '@design/components/NxSectionHeader.vue'
import NxIcon from '@design/components/NxIcon.vue'
import type { Ambient } from '@design/tokens'
import NexusRatingInput from '@components/nexus-rating-input/NexusRatingInput.vue'
import NexusTastingTimeline from '@components/nexus-tasting-timeline/NexusTastingTimeline.vue'
import { useCellarStore } from '@stores/food-drink/cellar.store'
import DrinkDetail from '@routes/collections/DrinkDetail.vue'
import { useDrinkDetail } from '@routes/collections/useDrinkDetail'
import type { MediaImage } from '@/types/media/media'

const cellar = useCellarStore()
const route = useRoute()
const router = useRouter()

const wineId = computed(() => Number(route.params.wineId))

const { state, onAnalyse, quota } = useDrinkDetail({
  id: () => wineId.value,
  item: () => cellar.wine,
  loading: () => cellar.wineLoading,
  load: cellar.loadWine,
  analyse: cellar.analyseWine,
})

const wine = computed(() => (state.value === 'ready' ? cellar.wine : null))

/** Until the label palette arrives, tint by style rather than always red. */
const STYLE_AMBIENTS: [RegExp, Partial<Ambient>][] = [
  [/sparkl|champ|cap class|cava|prosecco/i, { amb: '#17150c', amb2: '#262213', acc: '#ecd58a', ink: '#fbf7e6' }],
  [/ros[eé]|blush/i, { amb: '#1f0d12', amb2: '#33161e', acc: '#f2a0b0', ink: '#fdeef1' }],
  [/white|blanc|chard|chenin|riesling|sauv/i, { amb: '#18170c', amb2: '#28261a', acc: '#e3cf7f', ink: '#fbf7e8' }],
  [/dessert|fortified|port|sherry|noble/i, { amb: '#1d0f07', amb2: '#2f1a0c', acc: '#eaa35a', ink: '#fcf0e3' }],
]

const styleAmbient = computed(() => {
  const type = wine.value?.wine_type
  if (!type) return null
  return STYLE_AMBIENTS.find(([re]) => re.test(type))?.[1] ?? null
})

const lede = computed(() => {
  const w = wine.value
  if (!w) return undefined
  return [w.wine_type, w.region_name, w.country].filter(Boolean).join(' · ') || undefined
})

const facts = computed(() => {
  const w = wine.value
  if (!w) return []
  return [
    { label: 'Producer', value: w.producer_name },
    { label: 'Vintage', value: w.vintage },
    { label: 'Style', value: w.wine_type },
    { label: 'Region', value: w.region_name },
    { label: 'Country', value: w.country },
    { label: 'Tastings', value: w.tastings?.length ?? w.tastings_count },
  ]
})

const showTasting = ref(false)
const tastingForm = reactive({
  tasted_on: new Date().toISOString().slice(0, 10),
  rating: null as number | null,
  notes: '',
  occasion: '',
  location: '',
})

function openTasting(): void {
  tastingForm.tasted_on = new Date().toISOString().slice(0, 10)
  tastingForm.rating = null
  tastingForm.notes = ''
  tastingForm.occasion = ''
  tastingForm.location = ''
  showTasting.value = true
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

function onImage(image: MediaImage): void {
  if (!cellar.wine) return
  cellar.wine.media = image
  cellar.wine.image_url = image.url
}
</script>

<template>
  <DrinkDetail
    :state="state"
    :back-to="{ name: 'cellar' }"
    back-label="Wine"
    noun="wine"
    :eyebrow="wine?.producer_name || 'Wine'"
    :title="wine?.name"
    :accent="wine?.vintage ? String(wine.vintage) : undefined"
    :lede="lede"
    :media="wine?.media"
    :image-url="wine?.image_url"
    :rating="wine?.rating"
    :facts="facts"
    :notes="wine?.notes"
    :status="wine?.analysis_status"
    :analysis="wine?.ai_analysis"
    :analysis-error="wine?.analysis_error"
    :analysing="cellar.analysing"
    :quota="quota"
    upload-collection="cellar"
    :attach-to="wine ? { type: 'cellar_wine', id: wine.id } : null"
    :fallback-ambient="styleAmbient"
    @analyse="onAnalyse"
    @remove="removeWine"
    @image="onImage"
  >
    <template #actions>
      <Button rounded severity="contrast" label="Log tasting" @click="openTasting">
        <template #icon="{ class: iconClass }">
          <NxIcon name="edit" :size="16" :class="iconClass" />
        </template>
      </Button>
    </template>

    <section aria-labelledby="tastings-title">
      <NxSectionHeader id="tastings-title" title="Tasting history" />
      <NexusTastingTimeline
        :tastings="wine?.tastings ?? []"
        @remove="(id) => cellar.removeTasting(id, wineId)"
      />
    </section>
  </DrinkDetail>

  <Dialog v-model:visible="showTasting" modal header="Log a tasting" style="width: min(440px, 94vw)">
    <form class="nx-form" @submit.prevent="saveTasting">
      <div class="row">
        <label class="f">
          <span>Date</span>
          <InputText v-model="tastingForm.tasted_on" type="date" />
        </label>
        <div class="f">
          <span>Rating</span>
          <NexusRatingInput v-model="tastingForm.rating" />
        </div>
      </div>
      <label class="f">
        <span>Occasion</span>
        <InputText v-model="tastingForm.occasion" placeholder="Sunday braai, anniversary…" />
      </label>
      <label class="f">
        <span>Where</span>
        <InputText v-model="tastingForm.location" />
      </label>
      <label class="f">
        <span>How it showed</span>
        <Textarea v-model="tastingForm.notes" rows="3" auto-resize />
      </label>
    </form>
    <template #footer>
      <Button label="Cancel" text severity="secondary" @click="showTasting = false" />
      <Button label="Save tasting" rounded :loading="cellar.saving" @click="saveTasting" />
    </template>
  </Dialog>
</template>
