<script setup lang="ts">
import NxPillNav, { type PillNavItem } from '@design/components/NxPillNav.vue'

const items: PillNavItem[] = [
  { key: 'home', label: 'Overview', to: { name: 'github' } },
  { key: 'pulls', label: 'Pull requests', to: { name: 'github-pulls' } },
  { key: 'search', label: 'Search', to: { name: 'github-search' } },
  { key: 'stats', label: 'Stats', to: { name: 'github-stats' } },
]
</script>

<template>
  <NxPillNav :items="items" label="Code" />
  <slot />
</template>
