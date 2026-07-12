<script setup lang="ts">
import { useRoute } from 'vue-router'
import { useSpotifyStore } from '@stores/spotify/spotify.store'
import { useSpotifyKeyboardShortcuts } from '@/composables/useSpotifyKeyboardShortcuts'
import NexusSpotifyQueuePanel from '@components/nexus-spotify-queue-panel/NexusSpotifyQueuePanel.vue'
import NexusSpotifyAddToPlaylist from '@components/nexus-spotify-add-to-playlist/NexusSpotifyAddToPlaylist.vue'

const spotify = useSpotifyStore()
const route = useRoute()

useSpotifyKeyboardShortcuts()

const links = [
  { name: 'spotify', label: 'Home', match: (n: string) => n === 'spotify' },
  {
    name: 'spotify-search',
    label: 'Search',
    match: (n: string) => n === 'spotify-search',
  },
  {
    name: 'spotify-library',
    label: 'Library',
    match: (n: string) => n === 'spotify-library',
  },
] as const
</script>

<template>
  <div class="spotify-chrome">
    <nav v-if="spotify.connected" class="spotify-nav" aria-label="Spotify">
      <router-link
        v-for="link in links"
        :key="link.name"
        :to="{ name: link.name }"
        class="nav-link"
        :class="{ active: link.match(String(route.name ?? '')) }"
      >
        {{ link.label }}
      </router-link>
      <button
        type="button"
        class="nav-link queue-btn"
        @click="spotify.openQueuePanel()"
      >
        Queue
      </button>
    </nav>
    <slot />
    <NexusSpotifyQueuePanel />
    <NexusSpotifyAddToPlaylist />
  </div>
</template>

<style scoped>
.spotify-chrome {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.spotify-nav {
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
  padding: 0.35rem;
  border-radius: 0.85rem;
  background: color-mix(in srgb, var(--lavender-blush) 5%, transparent);
  border: 1px solid color-mix(in srgb, var(--lavender-blush) 10%, transparent);
}

.nav-link {
  padding: 0.45rem 0.85rem;
  border-radius: 0.65rem;
  text-decoration: none;
  color: color-mix(in srgb, var(--lavender-blush) 70%, transparent);
  font-size: 0.9rem;
  font-weight: 600;
  border: 0;
  background: transparent;
  cursor: pointer;
}

.nav-link:hover,
.nav-link.active {
  background: color-mix(in srgb, var(--light-green) 14%, transparent);
  color: var(--light-green);
}

.queue-btn {
  margin-left: auto;
}
</style>
