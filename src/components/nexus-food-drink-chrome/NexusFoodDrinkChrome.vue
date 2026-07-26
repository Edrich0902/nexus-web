<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()

const links = [
  {
    name: 'food-drink',
    label: 'Overview',
    match: (n: string) => n === 'food-drink',
  },
  {
    name: 'food-drink-pairings',
    label: 'Pairings',
    match: (n: string) => n === 'food-drink-pairings',
  },
] as const

function go(name: string): void {
  void router.push({ name })
}
</script>

<template>
  <nav class="chrome" aria-label="Food and drink">
    <button
      v-for="link in links"
      :key="link.name"
      type="button"
      class="tab"
      :class="{ active: link.match(String(route.name ?? '')) }"
      @click="go(link.name)"
    >
      {{ link.label }}
    </button>
  </nav>
</template>

<style scoped>
.chrome {
  display: flex;
  gap: 0.35rem;
  margin-bottom: 1rem;
  flex-wrap: wrap;
}

.tab {
  border: 0;
  background: transparent;
  color: color-mix(in srgb, var(--lavender-blush) 70%, transparent);
  padding: 0.45rem 0.85rem;
  border-radius: 999px;
  cursor: pointer;
  font-size: 0.9rem;
}

.tab.active {
  background: color-mix(in srgb, var(--food-drink-accent) 22%, transparent);
  color: var(--lavender-blush);
}
</style>
