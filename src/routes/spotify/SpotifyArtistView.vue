<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import DetailTemplate from '@design/templates/DetailTemplate.vue'
import type { ViewState } from '@design/templates/types'
import NxStage from '@design/components/NxStage.vue'
import NxIcon from '@design/components/NxIcon.vue'
import NxSectionHeader from '@design/components/NxSectionHeader.vue'
import NxCoverGrid from '@design/components/NxCoverGrid.vue'
import NxCoverCard from '@design/components/NxCoverCard.vue'
import NxChips from '@design/components/NxChips.vue'
import { usePaletteAmbient } from '@design/usePaletteAmbient'
import NexusSpotifyTrackRow from '@components/nexus-spotify-track-row/NexusSpotifyTrackRow.vue'
import { useSpotifyStore } from '@stores/spotify/spotify.store'
import * as spotifyService from '@services/spotify.service'
import type { SpotifyAlbumSnippet, SpotifyArtistDetail, SpotifyTrack } from '@/types/spotify/spotify'
import { capitalise, releaseYear } from './listening'

const spotify = useSpotifyStore()
const route = useRoute()

const state = ref<ViewState>('loading')
const artist = ref<SpotifyArtistDetail | null>(null)
const topTracks = ref<SpotifyTrack[]>([])
const albums = ref<SpotifyAlbumSnippet[]>([])
const note = ref<string | null>(null)
let requestId = 0

const artistId = computed(() => String(route.params.artistId ?? ''))
const image = computed(() => artist.value?.images?.[0]?.url ?? null)

usePaletteAmbient(image)

watch(artistId, () => void load(), { immediate: true })
watch(topTracks, (list) => void spotify.refreshLikedUris(list.map((t) => t.uri)))

async function load(): Promise<void> {
  if (!artistId.value) return
  const current = ++requestId
  state.value = 'loading'
  try {
    const [detail, tops, albumPage] = await Promise.all([
      spotifyService.getArtist(artistId.value),
      spotifyService.getArtistTopTracks(artistId.value),
      spotifyService.getArtistAlbums(artistId.value),
    ])
    if (current !== requestId) return
    artist.value = detail
    topTracks.value = tops.tracks
    albums.value = albumPage.albums
    note.value = detail.message ?? tops.message ?? albumPage.message ?? null
    state.value = 'ready'
  } catch {
    if (current === requestId) state.value = 'error'
  }
}

const eyebrow = computed(() => {
  const followers = artist.value?.followers
  return followers ? `Artist · ${followers.toLocaleString()} followers` : 'Artist'
})

const genres = computed(() => (artist.value?.genres ?? []).slice(0, 6).map(capitalise))

const albumGroups = computed(() => {
  const main = albums.value.filter((a) => a.album_type !== 'single' && a.album_type !== 'compilation')
  const singles = albums.value.filter((a) => a.album_type === 'single')
  return [
    { key: 'albums', title: 'Albums', items: main },
    { key: 'singles', title: 'Singles & EPs', items: singles },
  ].filter((g) => g.items.length)
})

function playTop(): void {
  const first = topTracks.value[0]
  if (first) void spotify.playTrackUri(first.uri)
}
</script>

<template>
  <DetailTemplate
    :state="state"
    :back-to="{ name: 'spotify' }"
    back-label="Listening"
    error-title="Could not load this artist"
  >
    <template #stage>
      <NxStage :eyebrow="eyebrow" :title="artist?.name ?? 'Artist'">
        <template #visual>
          <div class="portrait">
            <img v-if="image" :src="image" alt="" />
            <NxIcon v-else name="profile" :size="48" />
          </div>
        </template>
        <template #lede>
          <NxChips v-if="genres.length" :items="genres" label="Genres" />
          <span v-else>{{ note ?? 'On Spotify' }}</span>
        </template>
        <template #actions>
          <Button
            rounded
            severity="contrast"
            label="Play top track"
            :disabled="!topTracks.length || spotify.controlBusy"
            @click="playTop"
          >
            <template #icon="{ class: iconClass }">
              <NxIcon name="play" :size="16" :class="iconClass" />
            </template>
          </Button>
          <Button
            v-if="artist?.external_url"
            as="a"
            :href="artist.external_url"
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

    <Message v-if="note && genres.length" severity="info" :closable="false">{{ note }}</Message>

    <section>
      <NxSectionHeader title="Popular" />
      <p v-if="!topTracks.length" class="empty">Spotify has no top tracks for this artist right now.</p>
      <div v-else>
        <NexusSpotifyTrackRow
          v-for="(track, i) in topTracks"
          :key="track.id"
          :track="track"
          :index="i + 1"
          @play="spotify.playTrackUri(track.uri)"
        />
      </div>
    </section>

    <section v-for="group in albumGroups" :key="group.key">
      <NxSectionHeader :title="group.title" />
      <NxCoverGrid :min="160">
        <NxCoverCard
          v-for="al in group.items"
          :key="al.id"
          :to="{ name: 'spotify-album', params: { albumId: al.id } }"
          :title="al.name"
          :sub="releaseYear(al.release_date)"
          :meta="al.total_tracks ? `${al.total_tracks} tracks` : null"
          :src="al.image_url"
          aspect="square"
          icon="music"
        />
      </NxCoverGrid>
    </section>
  </DetailTemplate>
</template>

<style scoped>
.portrait {
  width: 100%;
  height: 100%;
  display: grid;
  place-items: center;
  border-radius: 50%;
  overflow: hidden;
  background: var(--amb-2);
  color: var(--ink-3);
}

.portrait img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.nx-stage :deep(.visual) {
  border-radius: 50%;
}

.empty {
  margin: 0;
  font-size: 14px;
  color: var(--ink-3);
}
</style>
