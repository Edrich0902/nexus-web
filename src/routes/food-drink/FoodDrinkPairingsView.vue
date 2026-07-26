<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import NexusPageWrapper from '@components/nexus-page-wrapper/NexusPageWrapper.vue'
import NexusFoodDrinkChrome from '@components/nexus-food-drink-chrome/NexusFoodDrinkChrome.vue'
import NexusPairingPicker from '@components/nexus-pairing-picker/NexusPairingPicker.vue'
import { useFoodDrinkStore } from '@stores/food-drink/food-drink.store'
import { useCellarStore } from '@stores/food-drink/cellar.store'
import { useBeerStore } from '@stores/food-drink/beer.store'
import { useKitchenStore } from '@stores/food-drink/kitchen.store'
import type { PairingVerdict } from '@/types/food-drink/food-drink'

const store = useFoodDrinkStore()
const cellar = useCellarStore()
const beer = useBeerStore()
const kitchen = useKitchenStore()
const showPicker = ref(false)

onMounted(async () => {
  await Promise.all([
    store.loadPairings(),
    store.loadSuggestions(),
    cellar.loadWines(),
    beer.loadBeers(),
    kitchen.loadRecipes(),
  ])
})

const wineOptions = computed(() =>
  cellar.wines.map((w) => ({ id: w.id, name: w.name })),
)
const beerOptions = computed(() =>
  beer.beers.map((b) => ({ id: b.id, name: b.name })),
)
const recipeOptions = computed(() =>
  kitchen.recipes.map((r) => ({
    id: r.id,
    name: r.meal?.name ?? `Recipe #${r.id}`,
  })),
)

async function onSave(payload: {
  drinkable_type: 'wine' | 'beer'
  drinkable_id: number
  kitchen_recipe_id: number
  verdict: PairingVerdict
  notes: string | null
}): Promise<void> {
  await store.createPairing(payload)
  showPicker.value = false
  await store.loadSuggestions()
}
</script>

<template>
  <NexusPageWrapper show-toolbar title="Pairings">
    <template #toolbar>
      <Button label="Add pairing" icon="pi pi-plus" @click="showPicker = true" />
    </template>

    <NexusFoodDrinkChrome />

    <section class="panel">
      <h3>Your pairings</h3>
      <ul v-if="store.pairings.length">
        <li v-for="p in store.pairings" :key="p.id">
          <div>
            <strong>{{ p.drinkable_name }}</strong> × {{ p.recipe_name }}
            <Tag :value="p.verdict" rounded class="ml" />
          </div>
          <Button
            icon="pi pi-trash"
            text
            severity="danger"
            @click="store.removePairing(p.id)"
          />
        </li>
      </ul>
      <p v-else class="empty">No pairings yet — link a drink to a recipe.</p>
    </section>

    <section class="panel">
      <h3>Suggestions</h3>
      <ul v-if="store.suggestions.length">
        <li v-for="(s, i) in store.suggestions" :key="i" class="suggestion">
          <strong>{{ s.drink_name }}</strong> × {{ s.recipe_name }}
          <small>{{ s.reasons.join(' · ') }}</small>
        </li>
      </ul>
      <p v-else class="empty">Suggestions appear once you have drinks and recipes saved.</p>
    </section>

    <NexusPairingPicker
      v-model:visible="showPicker"
      :wines="wineOptions"
      :beers="beerOptions"
      :recipes="recipeOptions"
      @save="onSave"
    />
  </NexusPageWrapper>
</template>

<style scoped>
.panel {
  padding: 1rem;
  border-radius: 0.85rem;
  background: color-mix(in srgb, var(--coffee-bean-panel) 90%, transparent);
  margin-bottom: 1rem;
}
.panel h3 { margin: 0 0 0.55rem; }
.panel ul { list-style: none; margin: 0; padding: 0; }
.panel li {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.5rem;
  padding: 0.45rem 0;
  border-bottom: 1px solid color-mix(in srgb, var(--lavender-blush) 8%, transparent);
}
.suggestion { display: block !important; }
.suggestion small { display: block; opacity: 0.65; font-size: 0.8rem; }
.empty { opacity: 0.65; margin: 0; }
.ml { margin-left: 0.4rem; }
</style>
