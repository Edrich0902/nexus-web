<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import type { MenuItem } from 'primevue/menuitem'
import NxIcon from '@design/components/NxIcon.vue'
import NxIconButton from '@design/components/NxIconButton.vue'
import type { SpotifyTrack } from '@/types/spotify/spotify'
import { useSpotifyStore } from '@stores/spotify/spotify.store'

const props = withDefaults(
  defineProps<{
    track: SpotifyTrack
    /** Replaces the artist line (recommendation reason, play count). */
    subtitle?: string
    /** Quiet right-aligned note before the duration. */
    meta?: string
    /** Leading number (album track number, playlist position, rank). */
    index?: number
    /** Hide artwork when every row shares it (album pages). */
    art?: boolean
    showActions?: boolean
  }>(),
  { subtitle: undefined, meta: undefined, index: undefined, art: true, showActions: true },
)

const emit = defineEmits<{ play: [] }>()

const spotify = useSpotifyStore()
const router = useRouter()
const menu = ref<{ toggle: (event: Event) => void } | null>(null)

const liked = computed(() => spotify.isUriLiked(props.track.uri))
const playing = computed(() => Boolean(props.track.uri) && spotify.player?.item?.uri === props.track.uri)
const isPlaying = computed(() => playing.value && spotify.player?.is_playing === true)
const artists = computed(() => props.track.artists.filter((a) => a.id && a.name))
const artistLine = computed(() => props.track.artists.map((a) => a.name).join(', ') || 'Unknown artist')

const menuItems = computed<MenuItem[]>(() => [
  {
    label: liked.value ? 'Remove from Liked Songs' : 'Save to Liked Songs',
    disabled: !props.track.uri,
    command: () => void spotify.toggleLikeUri(props.track.uri),
  },
  { label: 'Add to queue', disabled: !props.track.uri, command: () => void spotify.queueTrack(props.track.uri) },
  { label: 'Add to playlist…', disabled: !props.track.uri, command: () => spotify.openAddToPlaylist(props.track.uri) },
  ...(props.track.album_id || artists.value.length ? [{ separator: true }] : []),
  ...(props.track.album_id
    ? [
        {
          label: 'Go to album',
          command: () => void router.push({ name: 'spotify-album', params: { albumId: props.track.album_id! } }),
        },
      ]
    : []),
  ...artists.value.slice(0, 3).map((a) => ({
    label: artists.value.length > 1 ? `Go to ${a.name}` : 'Go to artist',
    command: () => void router.push({ name: 'spotify-artist', params: { artistId: a.id } }),
  })),
])

function formatDuration(ms: number): string {
  const total = Math.floor(ms / 1000)
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`
}
</script>

<template>
  <div class="nx-track" :class="{ playing, 'no-art': !art }">
    <button
      v-if="index !== undefined && !art"
      type="button"
      class="ix num"
      :aria-label="`Play ${track.name}`"
      @click="emit('play')"
    >
      <span class="ix-n">{{ index }}</span>
      <NxIcon class="ix-play" :name="isPlaying ? 'pause' : 'play'" :size="14" />
    </button>
    <span v-else-if="index !== undefined" class="ix num">{{ index }}</span>

    <button v-if="art" type="button" class="art" :aria-label="`Play ${track.name}`" @click="emit('play')">
      <img v-if="track.album_image_url" :src="track.album_image_url" alt="" loading="lazy" />
      <NxIcon v-else name="music" :size="16" />
      <span class="overlay"><NxIcon :name="isPlaying ? 'pause' : 'play'" :size="16" /></span>
    </button>

    <div class="txt">
      <button type="button" class="title" tabindex="-1" @click="emit('play')">{{ track.name }}</button>
      <span class="sub">
        <template v-if="subtitle">{{ subtitle }}</template>
        <template v-else-if="artists.length">
          <template v-for="(a, i) in artists" :key="a.id">
            <RouterLink :to="{ name: 'spotify-artist', params: { artistId: a.id } }" class="artist">{{
              a.name
            }}</RouterLink
            ><template v-if="i < artists.length - 1">, </template>
          </template>
        </template>
        <template v-else>{{ artistLine }}</template>
      </span>
    </div>

    <div v-if="showActions" class="actions">
      <NxIconButton
        icon="heart"
        class="like"
        :class="{ liked }"
        :label="liked ? 'Remove from Liked Songs' : 'Save to Liked Songs'"
        size="sm"
        :disabled="spotify.controlBusy || !track.uri"
        @click="spotify.toggleLikeUri(track.uri)"
      />
      <NxIconButton
        icon="list-plus"
        class="hover-only"
        label="Add to queue"
        size="sm"
        :disabled="spotify.controlBusy || !track.uri"
        @click="spotify.queueTrack(track.uri)"
      />
      <NxIconButton
        icon="plus"
        class="hover-only"
        label="Add to playlist"
        size="sm"
        :disabled="!track.uri"
        @click="spotify.openAddToPlaylist(track.uri)"
      />
    </div>

    <span v-if="meta" class="meta">{{ meta }}</span>
    <span class="dur num">{{ formatDuration(track.duration_ms) }}</span>

    <span v-if="showActions || $slots.trailing" class="more">
      <slot name="trailing" />
      <template v-if="showActions">
        <NxIconButton icon="more" label="More" size="sm" :tooltip="false" @click="menu?.toggle($event)" />
        <Menu ref="menu" :model="menuItems" popup />
      </template>
    </span>
  </div>
</template>

<style scoped>
.nx-track {
  display: flex;
  align-items: center;
  gap: 14px;
  min-width: 0;
  padding: 8px 6px;
  border-bottom: 1px solid var(--line);
  border-radius: var(--r-sm);
  transition: background 0.2s;
}

.nx-track:last-child {
  border-bottom: 0;
}

.nx-track:hover {
  background: var(--tint);
}

.ix {
  position: relative;
  flex: 0 0 24px;
  height: 32px;
  display: grid;
  place-items: center;
  padding: 0;
  border: 0;
  background: none;
  font-size: 12px;
  color: var(--ink-3);
}

button.ix {
  cursor: pointer;
}

.ix-play {
  position: absolute;
  inset: 0;
  margin: auto;
  opacity: 0;
  color: var(--ink);
}

.nx-track:hover .ix-n,
.nx-track.playing .ix-n {
  opacity: 0;
}

.nx-track:hover .ix-play,
.nx-track.playing .ix-play {
  opacity: 1;
}

.nx-track.playing .ix-play {
  color: var(--acc);
}

.art {
  position: relative;
  flex: 0 0 40px;
  height: 40px;
  padding: 0;
  border: 0;
  border-radius: var(--r-xs);
  overflow: hidden;
  display: grid;
  place-items: center;
  color: var(--ink-3);
  background: var(--amb-2);
  cursor: pointer;
}

.art img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.overlay {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  color: #fff;
  background: rgb(0 0 0 / 0.5);
  opacity: 0;
  transition: opacity 0.15s;
}

.nx-track:hover .overlay,
.art:focus-visible .overlay {
  opacity: 1;
}

.txt {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.title {
  min-width: 0;
  padding: 0;
  border: 0;
  background: none;
  color: inherit;
  font: inherit;
  font-weight: 600;
  text-align: left;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  cursor: pointer;
}

.playing .title {
  color: var(--acc);
}

.sub {
  min-width: 0;
  font-size: 12.5px;
  color: var(--ink-3);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.artist:hover {
  color: var(--ink);
  text-decoration: underline;
}

.actions {
  display: flex;
  align-items: center;
  flex-shrink: 0;
}

.hover-only,
.like:not(.liked) {
  opacity: 0;
  transition: opacity 0.15s;
}

.nx-track:hover .hover-only,
.nx-track:hover .like,
.nx-track:focus-within .hover-only,
.nx-track:focus-within .like {
  opacity: 1;
}

.like.liked {
  color: var(--acc);
}

.like.liked :deep(svg) {
  fill: currentColor;
}

.meta {
  flex-shrink: 0;
  font-size: 12px;
  color: var(--ink-3);
  white-space: nowrap;
}

.dur {
  flex: 0 0 2.6rem;
  text-align: right;
  font-size: 12px;
  color: var(--ink-3);
}

.more {
  display: flex;
  align-items: center;
  flex-shrink: 0;
}

@media (hover: none), (max-width: 640px) {
  .actions,
  .meta {
    display: none;
  }
}

@media (max-width: 640px) {
  .nx-track {
    gap: 10px;
    padding-inline: 2px;
  }

  .nx-track:not(.no-art) .ix {
    display: none;
  }
}
</style>
