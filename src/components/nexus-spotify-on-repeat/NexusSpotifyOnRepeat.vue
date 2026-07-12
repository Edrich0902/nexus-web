<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useSpotifyStore } from '@stores/spotify/spotify.store'
import NexusSpotifyTrackRow from '@components/nexus-spotify-track-row/NexusSpotifyTrackRow.vue'
import NexusSpotifyAddToPlaylist from '@components/nexus-spotify-add-to-playlist/NexusSpotifyAddToPlaylist.vue'
import NexusSpotifyQueuePanel from '@components/nexus-spotify-queue-panel/NexusSpotifyQueuePanel.vue'

const spotify = useSpotifyStore()
const router = useRouter()

onMounted(() => {
  void spotify.loadHub()
})

const items = computed(() => spotify.taste?.on_repeat?.slice(0, 5) ?? [])
</script>

<template>
  <section v-if="spotify.connected && items.length" class="on-repeat">
    <div class="head">
      <h3>On repeat</h3>
      <Button
        label="Open Spotify"
        text
        size="small"
        @click="router.push({ name: 'spotify' })"
      />
    </div>
    <div class="list">
      <NexusSpotifyTrackRow
        v-for="item in items"
        :key="item.track.id"
        :track="item.track"
        :subtitle="`${item.play_count} plays`"
        @play="spotify.playTrackUri(item.track.uri)"
      />
    </div>
    <NexusSpotifyAddToPlaylist />
    <NexusSpotifyQueuePanel />
  </section>
</template>

<style scoped>
.on-repeat {
  padding: 1rem;
  border-radius: 1rem;
  background: var(--spotify-card-surface);
  border: 1px solid color-mix(in srgb, var(--light-green) 14%, transparent);
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
}

.head h3 {
  margin: 0;
  font-size: 1rem;
  color: var(--lavender-blush);
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
}

.head h3::before {
  content: '';
  width: 0.45rem;
  height: 0.45rem;
  flex-shrink: 0;
  border-radius: 50%;
  background: var(--light-green);
}

.list {
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
}
</style>
