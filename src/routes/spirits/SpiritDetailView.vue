<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useSpiritsStore } from '@stores/food-drink/spirits.store'
import DrinkDetail from '@routes/collections/DrinkDetail.vue'
import { useDrinkDetail } from '@routes/collections/useDrinkDetail'
import type { MediaImage } from '@/types/media/media'

const spirits = useSpiritsStore()
const route = useRoute()
const router = useRouter()

const spiritId = computed(() => Number(route.params.spiritId))

const { state, onAnalyse, quota } = useDrinkDetail({
  id: () => spiritId.value,
  item: () => spirits.spirit,
  loading: () => spirits.spiritLoading,
  load: spirits.loadSpirit,
  analyse: spirits.analyseSpirit,
})

const item = computed(() => (state.value === 'ready' ? spirits.spirit : null))

const lede = computed(() => {
  const s = item.value
  if (!s) return undefined
  return (
    [s.producer, s.region || s.country, s.abv != null ? `${s.abv}% ABV` : null]
      .filter(Boolean)
      .join(' · ') || undefined
  )
})

const facts = computed(() => {
  const s = item.value
  if (!s) return []
  return [
    { label: 'Distillery', value: s.producer },
    { label: 'Category', value: s.category },
    { label: 'Age', value: s.age_statement },
    { label: 'ABV', value: s.abv != null ? `${s.abv}%` : null },
    { label: 'Region', value: s.region },
    { label: 'Country', value: s.country },
  ]
})

async function remove(): Promise<void> {
  if (await spirits.removeSpirit(spiritId.value)) {
    await router.push({ name: 'spirits' })
  }
}

function onImage(image: MediaImage): void {
  if (!spirits.spirit) return
  spirits.spirit.media = image
  spirits.spirit.image_url = image.url
}
</script>

<template>
  <DrinkDetail
    :state="state"
    :back-to="{ name: 'spirits' }"
    back-label="Spirits"
    noun="spirit"
    :eyebrow="item?.category || 'Spirit'"
    :title="item?.name"
    :accent="item?.age_statement ?? undefined"
    :lede="lede"
    :media="item?.media"
    :image-url="item?.image_url"
    :rating="item?.rating"
    :facts="facts"
    :notes="item?.notes"
    :status="item?.analysis_status"
    :analysis="item?.ai_analysis"
    :analysis-error="item?.analysis_error"
    :analysing="spirits.analysing"
    :quota="quota"
    upload-collection="spirits"
    :attach-to="item ? { type: 'spirit_spirit', id: item.id } : null"
    @analyse="onAnalyse"
    @remove="remove"
    @image="onImage"
  />
</template>
