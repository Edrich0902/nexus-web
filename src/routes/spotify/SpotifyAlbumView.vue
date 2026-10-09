<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import DetailTemplate from '@design/templates/DetailTemplate.vue'
import type { ViewState } from '@design/templates/types'
import NxStage from '@design/components/NxStage.vue'
import NxIcon from '@design/components/NxIcon.vue'
import NxEmptyState from '@design/components/NxEmptyState.vue'
import { usePaletteAmbient } from '@design/usePaletteAmbient'
import NexusSpotifyTrackRow from '@components/nexus-spotify-track-row/NexusSpotifyTrackRow.vue'
import { useSpotifyStore } from '@stores/spotify/spotify.store'
import * as spotifyService from '@services/spotify.service'
import type { SpotifyAlbumDetail, SpotifyTrack } from '@/types/spotify/spotify'
import { releaseYear, splitTitle, totalDuration } from './listening'

const spotify = useSpotifyStore()
const route = useRoute()

const state = ref<ViewState>('loading')
const album = ref<SpotifyAlbumDetail | null>(null)
let requestId = 0

const albumId = computed(() => String(route.params.albumId ?? ''))

usePaletteAmbient(() => album.value?.image_url)

const tracks = computed<Array<SpotifyTrack & { track_number?: number }>>(() =>
  (album.value?.tracks ?? []).map((t) => ({
    ...t,
    album_name: album.value?.name ?? null,
    album_image_url: album.value?.image_url ?? null,
    album_id: album.value?.id ?? null,
    artists: t.artists ?? [],
    external_url: t.external_url ?? null,
  })),
)

watch(albumId, () => void load(), { immediate: true })
watch(tracks, (list) => void spotify.refreshLikedUris(list.map((t) => t.uri)))

async function load(): Promise<void> {
  if (!albumId.value) return
  const current = ++requestId
  state.value = 'loading'
  try {
    const data = await spotifyService.getAlbum(albumId.value)
    if (current !== requestId) return
    album.value = data
    state.value = 'ready'
  } catch {
    if (current === requestId) state.value = 'error'
  }
}

const heading = computed(() => splitTitle(album.value?.name ?? 'Album'))

const eyebrow = computed(() =>
  ['Album', releaseYear(album.value?.release_date)].filter(Boolean).join(' · '),
)

const meta = computed(() => {
  const n = album.value?.total_tracks ?? tracks.value.length
  return [`${n} ${n === 1 ? 'track' : 'tracks'}`, tracks.value.length ? totalDuration(tracks.value) : null]
    .filter(Boolean)
    .join(' · ')
})

function playAt(index: number): void {
  if (!album.value?.uri) return
  void spotify.playPlaylist(album.value.uri, index)
}
</script>

<template>
  <DetailTemplate :state="state" :back-to="{ name: 'spotify' }" back-label="Listening" error-title="Could not load this album">
    <template #stage>
      <NxStage :eyebrow="eyebrow" :title="heading.title" :accent="heading.accent">
        <template #visual>
          <img v-if="album?.image_url" :src="album.image_url" alt="" />
          <NxIcon v-else name="music" :size="48" />
        </template>
        <template #lede>
          <template v-for="(a, i) in album?.artists ?? []" :key="a.id">
            <RouterLink :to="{ name: 'spotify-artist', params: { artistId: a.id } }" class="artist">{{
              a.name
            }}</RouterLink
            ><template v-if="i < (album?.artists?.length ?? 0) - 1">, </template>
          </template>
          <span class="meta"> · {{ meta }}</span>
        </template>
        <template #actions>
          <Button
            rounded
            severity="contrast"
            label="Play album"
            :disabled="!album?.uri || spotify.controlBusy"
            @click="playAt(0)"
          >
            <template #icon="{ class: iconClass }">
              <NxIcon name="play" :size="16" :class="iconClass" />
            </template>
          </Button>
          <Button
            v-if="album?.external_url"
            as="a"
            :href="album.external_url"
            target="_blank"
            rel="noopener"
            rounded
            severity="secondary"
            label="Open in Spotify"
          >
            <template #icon="{ class: iconClass }">
              <NxIcon name="external-link" :size="16" :class="iconClass" />
            </template>
          </Button>
        </template>
      </NxStage>
    </template>

    <NxEmptyState
      v-if="!album?.available"
      icon="music"
      title="Album unavailable"
      :body="album?.message ?? 'Spotify does not expose this album to Nexus.'"
    />
    <template v-else>
      <Message v-if="album.message" severity="info" :closable="false">{{ album.message }}</Message>
      <p v-if="!tracks.length" class="empty">No tracks listed for this album.</p>
      <div v-else>
        <NexusSpotifyTrackRow
          v-for="(track, i) in tracks"
          :key="track.id"
          :track="track"
          :index="track.track_number ?? i + 1"
          :art="false"
          @play="playAt(i)"
        />
      </div>
    </template>
  </DetailTemplate>
</template>

<style scoped>
.artist {
  color: var(--ink);
}

.artist:hover {
  text-decoration: underline;
}

.meta {
  color: var(--ink-3);
}

.empty {
  margin: 0;
  font-size: 14px;
  color: var(--ink-3);
}
</style>
