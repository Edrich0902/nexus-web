<script setup lang="ts">
import { computed } from 'vue'
import NexusSpotifyTrackRow from '@components/nexus-spotify-track-row/NexusSpotifyTrackRow.vue'
import NxSectionHeader from '@design/components/NxSectionHeader.vue'
import NxSkeletonRows from '@design/components/skeletons/NxSkeletonRows.vue'
import { useSpotifyStore } from '@stores/spotify/spotify.store'

const spotify = useSpotifyStore()

const items = computed(() => spotify.similarRecommendations.slice(0, 6))
const currentSeed = computed(() => {
  const item = spotify.player?.item
  if (!item || item.type === 'episode') return null
  return item.id ?? null
})
// A new seed keeps the list loading until that seed's results land.
const loading = computed(() => {
  if (spotify.similarLoading) return true
  return currentSeed.value !== null && spotify.similarReadySeed !== currentSeed.value
})

const autoQueue = computed({
  get: () => spotify.listeningSettings?.auto_queue_enabled === true,
  set: (value: boolean) => void spotify.setAutoQueueEnabled(value),
})
</script>

<template>
  <section class="recs" aria-label="More like this" :aria-busy="loading">
    <NxSectionHeader title="More like this">
      <template #action>
        <label class="auto">
          <span>Auto-queue</span>
          <ToggleSwitch v-model="autoQueue" aria-label="Auto-queue similar tracks" />
        </label>
      </template>
    </NxSectionHeader>

    <NxSkeletonRows v-if="loading" :rows="5" />
    <p v-else-if="!items.length" class="empty">
      {{
        currentSeed
          ? 'No close matches for this track yet. Try another song in the same lane.'
          : 'Play something and similar tracks will line up here.'
      }}
    </p>
    <div v-else>
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
.auto {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 12.5px;
  color: var(--ink-3);
  cursor: pointer;
}

.empty {
  margin: 0;
  font-size: 14px;
  color: var(--ink-3);
}
</style>
