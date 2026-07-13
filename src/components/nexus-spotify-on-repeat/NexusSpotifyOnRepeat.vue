<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useSpotifyStore } from '@stores/spotify/spotify.store'
import NexusSpotifyTrackRow from '@components/nexus-spotify-track-row/NexusSpotifyTrackRow.vue'
import NexusSpotifyAddToPlaylist from '@components/nexus-spotify-add-to-playlist/NexusSpotifyAddToPlaylist.vue'
import NexusSpotifyQueuePanel from '@components/nexus-spotify-queue-panel/NexusSpotifyQueuePanel.vue'
import NexusSkeletonList from '@components/nexus-skeleton-list/NexusSkeletonList.vue'

const spotify = useSpotifyStore()
const router = useRouter()

onMounted(() => {
  void spotify.loadHub()
})

const items = computed(() => spotify.taste?.on_repeat?.slice(0, 5) ?? [])

const showLoading = computed(
  () => spotify.statusLoading || (spotify.connected && spotify.tasteLoading),
)

const showList = computed(
  () => spotify.connected && items.value.length > 0 && !showLoading.value,
)

const showEmpty = computed(
  () =>
    spotify.connected &&
    !showLoading.value &&
    items.value.length === 0 &&
    !!spotify.taste,
)
</script>

<template>
  <section
    v-if="showLoading || showList || showEmpty || !spotify.connected"
    class="on-repeat"
  >
    <div class="head">
      <h3>On repeat</h3>
      <Button
        v-if="spotify.connected && !showLoading"
        label="Open Spotify"
        text
        size="small"
        @click="router.push({ name: 'spotify' })"
      />
      <Skeleton v-else-if="showLoading" width="5.5rem" height="1.5rem" />
    </div>

    <NexusSkeletonList v-if="showLoading" :rows="5" variant="track" />

    <template v-else-if="showList">
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
    </template>

    <p v-else-if="showEmpty" class="empty">
      Your most-played tracks will show up here after sync.
    </p>
    <p v-else class="empty">
      Connect Spotify to see what’s on repeat.
    </p>
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

.empty {
  margin: 0;
  font-size: 0.9rem;
  color: color-mix(in srgb, var(--lavender-blush) 55%, transparent);
  line-height: 1.4;
}
</style>
