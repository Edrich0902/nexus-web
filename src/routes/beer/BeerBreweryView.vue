<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import DetailTemplate from '@design/templates/DetailTemplate.vue'
import type { ViewState } from '@design/templates/types'
import NxStage from '@design/components/NxStage.vue'
import NxSectionHeader from '@design/components/NxSectionHeader.vue'
import NxEmptyState from '@design/components/NxEmptyState.vue'
import NxIcon from '@design/components/NxIcon.vue'
import { useBeerStore } from '@stores/food-drink/beer.store'
import CollectionPrints from '@routes/collections/CollectionPrints.vue'
import { beerPrint } from '@routes/collections/prints'

const beer = useBeerStore()
const route = useRoute()
const breweryId = computed(() => Number(route.params.breweryId))
const attempted = ref(false)

async function load(): Promise<void> {
  attempted.value = false
  if (Number.isFinite(breweryId.value)) {
    await Promise.all([beer.loadBrewery(breweryId.value), beer.beers.length ? null : beer.loadBeers()])
  }
  attempted.value = true
}

onMounted(load)
watch(breweryId, load)

const brewery = computed(() => (beer.brewery?.id === breweryId.value ? beer.brewery : null))

const state = computed<ViewState>(() => {
  if (brewery.value) return 'ready'
  return attempted.value ? 'error' : 'loading'
})

const place = computed(() =>
  [brewery.value?.city, brewery.value?.state_province, brewery.value?.country].filter(Boolean).join(', '),
)

const beers = computed(() => beer.beers.filter((b) => b.brewery?.id === breweryId.value))
const prints = computed(() => beers.value.map(beerPrint))

const sourceLabel = computed(() =>
  brewery.value?.source === 'openbrewerydb' ? 'Open Brewery DB' : 'Added by you',
)
</script>

<template>
  <DetailTemplate :state="state" :back-to="{ name: 'beer' }" back-label="Beer" error-title="Brewery not found">
    <template #stage>
      <NxStage
        size="compact"
        :eyebrow="[brewery?.brewery_type, sourceLabel].filter(Boolean).join(' · ')"
        :title="brewery?.name"
        :lede="place || undefined"
      >
        <template v-if="brewery?.website_url" #actions>
          <Button
            as="a"
            :href="brewery.website_url"
            target="_blank"
            rel="noopener noreferrer"
            rounded
            severity="secondary"
            label="Website"
          >
            <template #icon="{ class: iconClass }">
              <NxIcon name="external-link" :size="16" :class="iconClass" />
            </template>
          </Button>
        </template>
      </NxStage>
    </template>

    <section aria-labelledby="brewery-beers">
      <NxSectionHeader id="brewery-beers" :title="`Your beers from ${brewery?.name ?? 'here'}`" />
      <CollectionPrints v-if="beers.length" :prints="prints" />
      <NxEmptyState v-else title="None logged yet" body="Beers you link to this brewery appear here." icon="beer" />
    </section>
  </DetailTemplate>
</template>
