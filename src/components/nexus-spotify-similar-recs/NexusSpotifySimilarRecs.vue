<script setup lang="ts">
import { computed } from 'vue'
import NexusSkeletonList from '@components/nexus-skeleton-list/NexusSkeletonList.vue'
import NexusSpotifyTrackRow from '@components/nexus-spotify-track-row/NexusSpotifyTrackRow.vue'
import { useSpotifyStore } from '@stores/spotify/spotify.store'

const spotify = useSpotifyStore()

const items = computed(() => spotify.similarRecommendations.slice(0, 8))
const currentSeed = computed(() => {
  const item = spotify.player?.item
  if (!item || item.type === 'episode') return null
  return item.id ?? null
})
const loading = computed(() => {
  if (spotify.similarLoading) return true
  const seed = currentSeed.value
  if (!seed) return false
  // Track changed / first load — keep the panel in loading until this seed finishes.
  return spotify.similarReadySeed !== seed
})
const showEmpty = computed(
  () => !loading.value && items.value.length === 0,
)
</script>

<template>
  <section
    class="recs-panel"
    aria-label="Similar recommendations"
    :aria-busy="loading"
  >
    <div class="recs-head">
      <div>
        <h3>More like this</h3>
        <p class="sub">Ranked for this sitting — seeds, skips, and acoustic fit</p>
      </div>
    </div>

    <NexusSkeletonList v-if="loading" :rows="5" variant="track" />

    <p v-else-if="showEmpty" class="empty">
      <template v-if="!currentSeed">
        Play a track to get similar recommendations.
      </template>
      <template v-else>
        No close matches for this track yet — try another song in the same lane.
      </template>
    </p>

    <div v-else class="recs-list">
      <NexusSpotifyTrackRow
        v-for="item in items"
        :key="item.track.id"
        :track="item.track"
        :subtitle="item.reason"
        @play="spotify.playTrackUri(item.track.uri)"
      />
    </div>
  </section>
</template>

<style scoped>
.recs-panel {
  background: var(--spotify-card-surface);
  border: 1px solid color-mix(in srgb, var(--lavender-blush) 12%, transparent);
  border-radius: 1rem;
  padding: 1rem 1.15rem 1.15rem;
}

.recs-head {
  margin-bottom: 0.85rem;
}

.recs-head h3 {
  margin: 0;
  font-size: 0.95rem;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--light-green);
}

.sub {
  margin: 0.25rem 0 0;
  font-size: 0.85rem;
  color: color-mix(in srgb, var(--lavender-blush) 60%, transparent);
}

.recs-list {
  display: grid;
  gap: 0.35rem;
}

.empty {
  margin: 0;
  font-size: 0.9rem;
  line-height: 1.45;
  color: color-mix(in srgb, var(--lavender-blush) 55%, transparent);
}
</style>
