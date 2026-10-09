<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import IndexTemplate from '@design/templates/IndexTemplate.vue'
import NxStage from '@design/components/NxStage.vue'
import NxPillGroup from '@design/components/NxPillGroup.vue'
import NxCoverGrid from '@design/components/NxCoverGrid.vue'
import NxCoverCard from '@design/components/NxCoverCard.vue'
import NxEmptyState from '@design/components/NxEmptyState.vue'
import NxSkeletonRows from '@design/components/skeletons/NxSkeletonRows.vue'
import NexusSpotifyTrackRow from '@components/nexus-spotify-track-row/NexusSpotifyTrackRow.vue'
import { useSpotifyStore } from '@stores/spotify/spotify.store'
import * as spotifyService from '@services/spotify.service'
import type { SpotifyAlbumSnippet, SpotifyArtist, SpotifyTrack } from '@/types/spotify/spotify'
import ListeningNav from './ListeningNav.vue'
import { artistNames, capitalise, releaseYear } from './listening'

type Tab = 'tracks' | 'albums' | 'artists'

const spotify = useSpotifyStore()

const tab = ref<Tab>('tracks')
const loading = ref(false)
const failed = ref(false)

const tracks = ref<SpotifyTrack[]>([])
const albums = ref<SpotifyAlbumSnippet[]>([])
const artists = ref<SpotifyArtist[]>([])
const tracksTotal = ref<number | null>(null)
const albumsTotal = ref<number | null>(null)
const artistsCursor = ref<string | undefined>(undefined)
const artistsHasNext = ref(false)
let requestId = 0

const missingFollowScope = computed(() => (spotify.status?.missing_scopes ?? []).includes('user-follow-read'))

onMounted(async () => {
  await spotify.loadHub()
  await loadTab(true)
})

watch(tab, () => void loadTab(true))

watch(tracks, (list) => void spotify.refreshLikedUris(list.map((t) => t.uri)))

async function loadTab(reset: boolean): Promise<void> {
  const current = ++requestId
  const which = tab.value
  loading.value = true
  failed.value = false
  try {
    if (which === 'tracks') {
      const data = await spotifyService.listLibraryTracks(30, reset ? 0 : tracks.value.length)
      if (current !== requestId) return
      const page = data.items.map((i) => i.track)
      tracks.value = reset ? page : [...tracks.value, ...page]
      tracksTotal.value = data.total
    } else if (which === 'albums') {
      const data = await spotifyService.listLibraryAlbums(30, reset ? 0 : albums.value.length)
      if (current !== requestId) return
      const page = data.items.map((i) => i.album)
      albums.value = reset ? page : [...albums.value, ...page]
      albumsTotal.value = data.total
    } else if (!missingFollowScope.value) {
      const data = await spotifyService.listLibraryArtists(30, reset ? undefined : artistsCursor.value)
      if (current !== requestId) return
      artists.value = reset ? data.artists : [...artists.value, ...data.artists]
      artistsHasNext.value = data.next
      artistsCursor.value = data.cursors?.after
    }
  } catch {
    if (current === requestId) failed.value = true
  } finally {
    if (current === requestId) loading.value = false
  }
}

const tabs = computed(() => [
  { value: 'tracks' as const, label: tracksTotal.value != null ? `Liked songs · ${tracksTotal.value}` : 'Liked songs' },
  { value: 'albums' as const, label: albumsTotal.value != null ? `Albums · ${albumsTotal.value}` : 'Albums' },
  { value: 'artists' as const, label: 'Artists' },
])

const count = computed(() =>
  tab.value === 'tracks' ? tracks.value.length : tab.value === 'albums' ? albums.value.length : artists.value.length,
)

const canLoadMore = computed(() => {
  if (tab.value === 'tracks') return tracks.value.length < (tracksTotal.value ?? 0)
  if (tab.value === 'albums') return albums.value.length < (albumsTotal.value ?? 0)
  return artistsHasNext.value && !missingFollowScope.value
})

const lede = computed(() =>
  tracksTotal.value != null
    ? `${tracksTotal.value.toLocaleString()} liked songs, the albums you saved and the artists you follow.`
    : 'Liked songs, the albums you saved and the artists you follow.',
)
</script>

<template>
  <IndexTemplate>
    <template #stage>
      <NxStage size="compact" eyebrow="Listening" title="Your" accent="library" :lede="lede" />
    </template>

    <template #toolbar>
      <ListeningNav />
    </template>

    <div class="library">
      <NxPillGroup v-model="tab" :options="tabs" label="Library section" size="sm" />

      <Message v-if="spotify.needsReauth" severity="warn" :closable="false">
        Reconnect Spotify to unlock your full library.
        <Button size="small" rounded label="Reconnect" class="ml" @click="spotify.connect()" />
      </Message>

      <NxSkeletonRows v-if="loading && count === 0" :rows="8" :thumb="true" />
      <NxEmptyState
        v-else-if="failed"
        tone="error"
        icon="close"
        title="Could not load your library"
        body="Try again, or reconnect Spotify if this keeps happening."
      />

      <template v-else-if="tab === 'tracks'">
        <NxEmptyState v-if="!tracks.length" icon="heart" title="No liked songs yet" body="Tap the heart on any track to save it here." />
        <div v-else>
          <NexusSpotifyTrackRow
            v-for="(track, i) in tracks"
            :key="track.id"
            :track="track"
            :index="i + 1"
            @play="spotify.playTrackUri(track.uri)"
          />
        </div>
      </template>

      <template v-else-if="tab === 'albums'">
        <NxEmptyState v-if="!albums.length" icon="music" title="No saved albums" body="Albums you save on Spotify show up here." />
        <NxCoverGrid v-else :min="160">
          <NxCoverCard
            v-for="al in albums"
            :key="al.id"
            :to="{ name: 'spotify-album', params: { albumId: al.id } }"
            :title="al.name"
            :sub="artistNames(al.artists)"
            :meta="releaseYear(al.release_date)"
            :src="al.image_url"
            aspect="square"
            icon="music"
          />
        </NxCoverGrid>
      </template>

      <template v-else>
        <NxEmptyState
          v-if="missingFollowScope"
          icon="profile"
          title="Followed artists need permission"
          body="Reconnect Spotify so Nexus can read who you follow."
        >
          <Button rounded label="Reconnect" @click="spotify.connect()" />
        </NxEmptyState>
        <NxEmptyState v-else-if="!artists.length" icon="profile" title="Not following anyone yet" />
        <NxCoverGrid v-else :min="150">
          <NxCoverCard
            v-for="a in artists"
            :key="a.id"
            :to="{ name: 'spotify-artist', params: { artistId: a.id } }"
            :title="a.name"
            :sub="a.genres[0] ? capitalise(a.genres[0]) : 'Artist'"
            :src="a.images[0]?.url"
            aspect="circle"
            icon="profile"
          />
        </NxCoverGrid>
      </template>

      <Button
        v-if="canLoadMore && !failed && count > 0"
        class="more"
        rounded
        severity="secondary"
        label="Load more"
        :loading="loading"
        @click="loadTab(false)"
      />
    </div>
  </IndexTemplate>
</template>

<style scoped>
.library {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.library > .nx-pills {
  align-self: flex-start;
}

.more {
  align-self: center;
}

.ml {
  margin-left: 10px;
}
</style>
