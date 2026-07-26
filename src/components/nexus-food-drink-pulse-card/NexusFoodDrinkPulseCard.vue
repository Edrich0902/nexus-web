<script setup lang="ts">
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import NexusFoodDrinkIcon from '@components/nexus-food-drink-icon/NexusFoodDrinkIcon.vue'
import { useFoodDrinkStore } from '@stores/food-drink/food-drink.store'

const store = useFoodDrinkStore()
const router = useRouter()

onMounted(() => {
  void store.loadDashboard()
})
</script>

<template>
  <article class="pulse" @click="router.push({ name: 'food-drink' })">
    <div class="head">
      <NexusFoodDrinkIcon :size="18" />
      <strong>Food & Drink</strong>
    </div>
    <div v-if="store.dashboard" class="stats">
      <span>{{ store.dashboard.counts.wines }} wines</span>
      <span>{{ store.dashboard.counts.beers }} beers</span>
      <span>{{ store.dashboard.counts.recipes }} recipes</span>
    </div>
    <p v-else class="muted">Open your cellar hub</p>
  </article>
</template>

<style scoped>
.pulse {
  padding: 0.95rem 1rem;
  border-radius: 0.85rem;
  background: var(--food-drink-card-surface);
  cursor: pointer;
}
.head {
  display: flex;
  align-items: center;
  gap: 0.45rem;
  color: var(--food-drink-accent);
  margin-bottom: 0.55rem;
}
.stats {
  display: flex;
  flex-wrap: wrap;
  gap: 0.65rem;
  font-size: 0.85rem;
  opacity: 0.85;
}
.muted {
  margin: 0;
  opacity: 0.65;
  font-size: 0.85rem;
}
</style>
