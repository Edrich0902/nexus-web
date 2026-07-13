<script setup lang="ts">
import { computed, watch } from 'vue'
import { useSpotifyStore } from '@stores/spotify/spotify.store'
import NexusSkeletonList from '@components/nexus-skeleton-list/NexusSkeletonList.vue'
import type { SpotifyPlayerItem } from '@/types/spotify/spotify'

const spotify = useSpotifyStore()

const visible = computed({
  get: () => spotify.queueOpen,
  set: (value: boolean) => {
    if (value) spotify.openQueuePanel()
    else spotify.closeQueuePanel()
  },
})

const currentlyPlaying = computed(() => spotify.queue?.currently_playing ?? null)
const upcoming = computed(() => spotify.queue?.queue ?? [])

watch(visible, (open) => {
  if (open) void spotify.fetchQueue(true)
})

function artistLabel(item: SpotifyPlayerItem | null): string {
  if (!item?.artists?.length) return 'Unknown artist'
  return item.artists.map((a) => a.name).filter(Boolean).join(', ') || 'Unknown artist'
}

function artUrl(item: SpotifyPlayerItem | null): string | null {
  return item?.album?.images?.[0]?.url ?? null
}

function queueUri(item: SpotifyPlayerItem): string | null {
  return item.uri ?? null
}
</script>

<template>
  <Drawer
    v-model:visible="visible"
    position="right"
    header="Queue"
    class="queue-drawer"
    :style="{ width: 'min(24rem, 92vw)' }"
  >
    <div class="queue-panel">
      <NexusSkeletonList
        v-if="spotify.queueLoading && !spotify.queue"
        :rows="6"
        variant="track"
      />

      <template v-else>
        <section class="section">
          <h4>Now playing</h4>
          <div v-if="currentlyPlaying" class="row current">
            <div class="art">
              <img
                v-if="artUrl(currentlyPlaying)"
                :src="artUrl(currentlyPlaying)!"
                :alt="currentlyPlaying.name ?? 'Now playing'"
              />
              <span v-else class="pi pi-microphone" />
            </div>
            <div class="meta">
              <span class="title">{{ currentlyPlaying.name ?? 'Unknown' }}</span>
              <span class="artists">{{ artistLabel(currentlyPlaying) }}</span>
            </div>
          </div>
          <p v-else class="empty">Nothing playing right now.</p>
        </section>

        <section class="section">
          <h4>Next up</h4>
          <p v-if="upcoming.length === 0" class="empty">
            Queue is empty. Add tracks from search or any track menu.
          </p>
          <div v-else class="list">
            <div v-for="(item, index) in upcoming" :key="`${item.uri}-${index}`" class="row">
              <div class="art">
                <img
                  v-if="artUrl(item)"
                  :src="artUrl(item)!"
                  :alt="item.name ?? 'Queued track'"
                />
                <span v-else class="pi pi-microphone" />
              </div>
              <div class="meta">
                <span class="title">{{ item.name ?? 'Unknown' }}</span>
                <span class="artists">{{ artistLabel(item) }}</span>
              </div>
              <button
                v-if="queueUri(item)"
                v-tooltip.top="'Add to playlist'"
                type="button"
                class="icon-btn"
                @click="spotify.openAddToPlaylist(queueUri(item)!)"
              >
                <span class="pi pi-plus" />
              </button>
            </div>
          </div>
        </section>
      </template>
    </div>
  </Drawer>
</template>

<style scoped>
.queue-panel {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.section h4 {
  margin: 0 0 0.65rem;
  font-size: 0.8rem;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: color-mix(in srgb, var(--lavender-blush) 55%, transparent);
}

.row {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.45rem 0;
}

.row.current {
  padding: 0.65rem;
  border-radius: 0.75rem;
  background: color-mix(in srgb, var(--spotify-green, #1db954) 12%, transparent);
}

.art {
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 0.4rem;
  overflow: hidden;
  flex-shrink: 0;
  display: grid;
  place-items: center;
  background: color-mix(in srgb, var(--lavender-blush) 8%, transparent);
}

.art img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.meta {
  min-width: 0;
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
}

.title {
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--lavender-blush);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.artists {
  font-size: 0.75rem;
  color: color-mix(in srgb, var(--lavender-blush) 55%, transparent);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.empty {
  margin: 0;
  font-size: 0.85rem;
  color: color-mix(in srgb, var(--lavender-blush) 50%, transparent);
}

.icon-btn {
  width: 2rem;
  height: 2rem;
  border: 0;
  border-radius: 999px;
  background: transparent;
  color: color-mix(in srgb, var(--lavender-blush) 55%, transparent);
  cursor: pointer;
}

.icon-btn:hover {
  background: color-mix(in srgb, var(--lavender-blush) 10%, transparent);
  color: var(--lavender-blush);
}
</style>
