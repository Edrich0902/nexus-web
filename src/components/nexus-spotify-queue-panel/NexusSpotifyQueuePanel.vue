<script setup lang="ts">
import { computed, watch } from 'vue'
import { useSpotifyStore } from '@stores/spotify/spotify.store'
import NxIcon from '@design/components/NxIcon.vue'
import NxIconButton from '@design/components/NxIconButton.vue'
import NxSkeletonRows from '@design/components/skeletons/NxSkeletonRows.vue'
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
  return item?.artists?.map((a) => a.name).filter(Boolean).join(', ') || 'Unknown artist'
}

function artUrl(item: SpotifyPlayerItem | null): string | null {
  return item?.album?.images?.at(-1)?.url ?? item?.album?.images?.[0]?.url ?? null
}
</script>

<template>
  <Drawer v-model:visible="visible" position="right" header="Queue" :style="{ width: 'min(26rem, 94vw)' }">
    <NxSkeletonRows v-if="spotify.queueLoading && !spotify.queue" :rows="7" />

    <div v-else class="queue">
      <section>
        <h3 class="nx-label">Now playing</h3>
        <div v-if="currentlyPlaying" class="row current">
          <span class="art">
            <img v-if="artUrl(currentlyPlaying)" :src="artUrl(currentlyPlaying)!" alt="" />
            <NxIcon v-else name="music" :size="16" />
          </span>
          <span class="txt">
            <span class="t">{{ currentlyPlaying.name ?? 'Unknown' }}</span>
            <span class="a">{{ artistLabel(currentlyPlaying) }}</span>
          </span>
        </div>
        <p v-else class="empty">Nothing is playing right now.</p>
      </section>

      <section>
        <h3 class="nx-label">Next up</h3>
        <p v-if="upcoming.length === 0" class="empty">
          The queue is empty. Add tracks from any track's menu.
        </p>
        <ol v-else class="list">
          <li v-for="(item, index) in upcoming" :key="`${item.uri}-${index}`" class="row">
            <span class="ix num">{{ index + 1 }}</span>
            <span class="art">
              <img v-if="artUrl(item)" :src="artUrl(item)!" alt="" loading="lazy" />
              <NxIcon v-else name="music" :size="16" />
            </span>
            <span class="txt">
              <span class="t">{{ item.name ?? 'Unknown' }}</span>
              <span class="a">{{ artistLabel(item) }}</span>
            </span>
            <NxIconButton
              v-if="item.uri"
              icon="plus"
              label="Add to playlist"
              size="sm"
              @click="spotify.openAddToPlaylist(item.uri)"
            />
          </li>
        </ol>
      </section>
    </div>
  </Drawer>
</template>

<style scoped>
.queue {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

h3 {
  margin: 0 0 10px;
}

.list {
  list-style: none;
  margin: 0;
  padding: 0;
}

.row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 0;
  border-bottom: 1px solid var(--line);
}

.row:last-child {
  border-bottom: 0;
}

.row.current {
  padding: 10px;
  border: 0;
  border-radius: var(--r-md);
  background: var(--tint-2);
}

.row.current .t {
  color: var(--acc);
}

.ix {
  flex: 0 0 18px;
  font-size: 11.5px;
  color: var(--ink-4);
  text-align: right;
}

.art {
  flex: 0 0 40px;
  height: 40px;
  border-radius: var(--r-xs);
  overflow: hidden;
  display: grid;
  place-items: center;
  color: var(--ink-3);
  background: var(--amb-2);
}

.art img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.txt {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
}

.t,
.a {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.t {
  font-weight: 600;
  font-size: 14px;
}

.a {
  font-size: 12.5px;
  color: var(--ink-3);
}

.empty {
  margin: 0;
  font-size: 13.5px;
  color: var(--ink-3);
}
</style>
