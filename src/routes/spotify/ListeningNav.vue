<script setup lang="ts">
import NxPillNav, { type PillNavItem } from '@design/components/NxPillNav.vue'
import NxIcon from '@design/components/NxIcon.vue'
import { useSpotifyStore } from '@stores/spotify/spotify.store'

const spotify = useSpotifyStore()

const items: PillNavItem[] = [
  { key: 'home', label: 'Now', to: { name: 'spotify' } },
  { key: 'search', label: 'Search', to: { name: 'spotify-search' } },
  { key: 'library', label: 'Library', to: { name: 'spotify-library' } },
  { key: 'stats', label: 'Stats', to: { name: 'spotify-stats' } },
]
</script>

<template>
  <NxPillNav :items="items" label="Listening" />
  <Button rounded text severity="secondary" label="Queue" @click="spotify.openQueuePanel()">
    <template #icon="{ class: iconClass }">
      <NxIcon name="queue" :size="16" :class="iconClass" />
    </template>
  </Button>
  <slot />
</template>
