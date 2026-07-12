<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import type { MenuItem } from 'primevue/menuitem'
import type { SpotifyTrack } from '@/types/spotify/spotify'
import { useSpotifyStore } from '@stores/spotify/spotify.store'

const props = withDefaults(
  defineProps<{
    track: SpotifyTrack
    subtitle?: string
    playing?: boolean
    showActions?: boolean
  }>(),
  {
    showActions: true,
  },
)

const emit = defineEmits<{
  play: []
}>()

const spotify = useSpotifyStore()
const router = useRouter()
const menu = ref<{ toggle: (event: Event) => void } | null>(null)

const liked = computed(() => spotify.isUriLiked(props.track.uri))
const busy = computed(() => spotify.controlBusy)
const showQuickActions = computed(() => props.showActions)

const menuItems = computed<MenuItem[]>(() => [
  ...(props.track.artists[0]?.id
    ? [
        {
          label: 'Open artist',
          icon: 'pi pi-user',
          command: () => {
            void router.push({
              name: 'spotify-artist',
              params: { artistId: props.track.artists[0]!.id },
            })
          },
        } satisfies MenuItem,
      ]
    : []),
  ...(props.track.album_id
    ? [
        {
          label: 'Open album',
          icon: 'pi pi-disc',
          command: () => {
            void router.push({
              name: 'spotify-album',
              params: { albumId: props.track.album_id! },
            })
          },
        } satisfies MenuItem,
      ]
    : []),
])

const hasMore = computed(() => menuItems.value.length > 0)

function formatDuration(ms: number): string {
  const total = Math.floor(ms / 1000)
  const m = Math.floor(total / 60)
  const s = total % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

function openMenu(event: Event): void {
  event.preventDefault()
  event.stopPropagation()
  menu.value?.toggle(event)
}

function onLike(): void {
  void spotify.toggleLikeUri(props.track.uri)
}

function onQueue(): void {
  void spotify.queueTrack(props.track.uri)
}

function onAddToPlaylist(): void {
  spotify.openAddToPlaylist(props.track.uri)
}
</script>

<template>
  <div
    class="track-row"
    :class="{ playing, 'has-more': showQuickActions && hasMore }"
  >    <button type="button" class="play-hit" @click="emit('play')">
      <div class="art">
        <img
          v-if="track.album_image_url"
          :src="track.album_image_url"
          :alt="track.album_name ?? track.name"
        />
        <span v-else class="pi pi-microphone art-fallback" />
        <span class="play-overlay">
          <span class="pi" :class="playing ? 'pi-pause' : 'pi-play'" />
        </span>
      </div>
      <div class="meta">
        <span class="title">{{ track.name }}</span>
        <span class="artists">
          {{
            subtitle ??
            (track.artists.map((a) => a.name).join(', ') || 'Unknown artist')
          }}
        </span>
      </div>
    </button>

    <div v-if="showQuickActions" class="actions" @click.stop>
      <Button
        v-tooltip.top="liked ? 'Remove from Liked Songs' : 'Add to Liked Songs'"
        type="button"
        text
        rounded
        severity="secondary"
        class="action-btn"
        :class="{ liked }"
        :icon="liked ? 'pi pi-heart-fill' : 'pi pi-heart'"
        :disabled="busy || !track.uri"
        aria-label="Toggle like"
        @click="onLike"
      />
      <Button
        v-tooltip.top="'Add to queue'"
        type="button"
        text
        rounded
        severity="secondary"
        class="action-btn"
        icon="pi pi-list"
        :disabled="busy || !track.uri"
        aria-label="Add to queue"
        @click="onQueue"
      />
      <Button
        v-tooltip.top="'Add to playlist'"
        type="button"
        text
        rounded
        severity="secondary"
        class="action-btn"
        icon="pi pi-plus"
        :disabled="busy || !track.uri"
        aria-label="Add to playlist"
        @click="onAddToPlaylist"
      />
    </div>

    <span class="duration">{{ formatDuration(track.duration_ms) }}</span>

    <div v-if="showQuickActions && hasMore" class="more-wrap" @click.stop>
      <Button
        v-tooltip.top="'More'"
        type="button"
        text
        rounded
        severity="secondary"
        class="action-btn"
        icon="pi pi-ellipsis-v"
        aria-label="More actions"
        @click="openMenu"
      />
      <Menu ref="menu" :model="menuItems" popup />
    </div>
  </div>
</template>

<style scoped>
.track-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto auto;
  align-items: center;
  gap: 0.2rem;
  width: 100%;
  padding: 0.35rem 0.35rem 0.35rem 0.35rem;
  border-radius: 0.75rem;
  transition: background-color 0.15s ease;
}

.track-row.has-more {
  grid-template-columns: minmax(0, 1fr) auto auto auto;
}

.track-row:hover {
  background: color-mix(in srgb, var(--lavender-blush) 6%, transparent);
}

.track-row.playing {
  background: color-mix(in srgb, var(--light-green) 8%, transparent);
}

.track-row.playing .title {
  color: var(--light-green);
}

.play-hit {
  display: flex;
  align-items: center;
  gap: 0.85rem;
  min-width: 0;
  padding: 0.2rem;
  border: 0;
  border-radius: 0.65rem;
  background: transparent;
  color: inherit;
  text-align: left;
  cursor: pointer;
}

.art {
  position: relative;
  width: 3rem;
  height: 3rem;
  border-radius: 0.5rem;
  overflow: hidden;
  flex-shrink: 0;
  background: color-mix(in srgb, var(--lavender-blush) 8%, transparent);
  display: grid;
  place-items: center;
}

.art img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.art-fallback {
  color: color-mix(in srgb, var(--lavender-blush) 45%, transparent);
}

.play-overlay {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  background: color-mix(in srgb, var(--coffee-bean) 55%, transparent);
  opacity: 0;
  transition: opacity 0.15s ease;
  color: var(--lavender-blush);
}

.track-row:hover .play-overlay {
  opacity: 1;
}

.meta {
  min-width: 0;
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
}

.title {
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--lavender-blush);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.artists {
  font-size: 0.8rem;
  color: color-mix(in srgb, var(--lavender-blush) 55%, transparent);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.actions,
.more-wrap {
  display: flex;
  align-items: center;
  flex-shrink: 0;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.12s ease;
}

.actions {
  gap: 0;
}

.track-row:hover .actions,
.track-row:hover .more-wrap,
.track-row:focus-within .actions,
.track-row:focus-within .more-wrap {
  opacity: 1;
  pointer-events: auto;
}

.action-btn {
  width: 2rem !important;
  height: 2rem !important;
  min-width: 2rem !important;
  padding: 0 !important;
  color: color-mix(in srgb, var(--lavender-blush) 70%, transparent) !important;
  background: transparent !important;
  border: 0 !important;
  box-shadow: none !important;
}

.action-btn:hover:not(:disabled) {
  color: var(--lavender-blush) !important;
  background: transparent !important;
}

.action-btn.liked,
.action-btn.liked:hover:not(:disabled) {
  color: var(--light-green) !important;
}

.duration {
  font-size: 0.75rem;
  color: color-mix(in srgb, var(--lavender-blush) 45%, transparent);
  font-variant-numeric: tabular-nums;
  flex-shrink: 0;
  min-width: 2.5rem;
  text-align: right;
  padding-right: 0.1rem;
}

@media (max-width: 640px) {
  .actions,
  .more-wrap {
    opacity: 1;
    pointer-events: auto;
  }

  .track-row {
    grid-template-columns: minmax(0, 1fr) auto auto;
    grid-template-areas:
      'play duration more'
      'play actions actions';
    gap: 0.2rem 0.35rem;
  }

  .play-hit {
    grid-area: play;
  }

  .actions {
    grid-area: actions;
    justify-self: end;
  }

  .duration {
    grid-area: duration;
  }

  .more-wrap {
    grid-area: more;
  }
}
</style>
