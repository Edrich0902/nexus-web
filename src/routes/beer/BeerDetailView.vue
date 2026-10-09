<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useBeerStore } from '@stores/food-drink/beer.store'
import DrinkDetail from '@routes/collections/DrinkDetail.vue'
import { useDrinkDetail } from '@routes/collections/useDrinkDetail'
import type { MediaImage } from '@/types/media/media'

const beer = useBeerStore()
const route = useRoute()
const router = useRouter()

const beerId = computed(() => Number(route.params.beerId))

const { state, onAnalyse, quota } = useDrinkDetail({
  id: () => beerId.value,
  item: () => beer.beer,
  loading: () => beer.beerLoading,
  load: beer.loadBeer,
  analyse: beer.analyseBeer,
})

const item = computed(() => (state.value === 'ready' ? beer.beer : null))

const lede = computed(() => {
  const b = item.value
  if (!b) return undefined
  const parts = [
    b.abv != null ? `${b.abv}% ABV` : null,
    b.ibu != null ? `${b.ibu} IBU` : null,
    b.format ? b.format.charAt(0).toUpperCase() + b.format.slice(1) : null,
  ]
  return parts.filter(Boolean).join(' · ') || undefined
})

const facts = computed(() => {
  const b = item.value
  if (!b) return []
  return [
    { label: 'Style', value: b.style?.name },
    { label: 'Family', value: b.style?.family },
    { label: 'ABV', value: b.abv != null ? `${b.abv}%` : null },
    { label: 'IBU', value: b.ibu },
    { label: 'Format', value: b.format },
    { label: 'Origin', value: [b.brewery?.city, b.brewery?.country].filter(Boolean).join(', ') },
  ]
})

async function remove(): Promise<void> {
  if (await beer.removeBeer(beerId.value)) {
    await router.push({ name: 'beer' })
  }
}

function onImage(image: MediaImage): void {
  if (!beer.beer) return
  beer.beer.media = image
  beer.beer.image_url = image.url
}
</script>

<template>
  <DrinkDetail
    :state="state"
    :back-to="{ name: 'beer' }"
    back-label="Beer"
    noun="beer"
    :eyebrow="item?.style?.name || 'Beer'"
    :title="item?.name"
    :media="item?.media"
    :image-url="item?.image_url"
    :rating="item?.rating"
    :facts="facts"
    :notes="item?.notes"
    :status="item?.analysis_status"
    :analysis="item?.ai_analysis"
    :analysis-error="item?.analysis_error"
    :analysing="beer.analysing"
    :quota="quota"
    upload-collection="beer"
    :attach-to="item ? { type: 'beer_beer', id: item.id } : null"
    @analyse="onAnalyse"
    @remove="remove"
    @image="onImage"
  >
    <template v-if="item" #lede>
      <RouterLink
        v-if="item.brewery"
        class="brewery"
        :to="{ name: 'beer-brewery', params: { breweryId: item.brewery.id } }"
      >
        {{ item.brewery.name }}
      </RouterLink>
      <template v-if="item.brewery && lede"> · </template>{{ lede }}
    </template>
  </DrinkDetail>
</template>

<style scoped>
.brewery {
  color: var(--ink);
  text-decoration: underline;
  text-decoration-color: var(--line-strong);
  text-underline-offset: 4px;
}

.brewery:hover {
  text-decoration-color: var(--acc);
}
</style>
