<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import NexusPageWrapper from '@components/nexus-page-wrapper/NexusPageWrapper.vue'
import NexusSpotifyChrome from '@components/nexus-spotify-chrome/NexusSpotifyChrome.vue'
import NexusSpotifyTrackRow from '@components/nexus-spotify-track-row/NexusSpotifyTrackRow.vue'
import NexusSkeletonList from '@components/nexus-skeleton-list/NexusSkeletonList.vue'
import NexusSkeletonCards from '@components/nexus-skeleton-cards/NexusSkeletonCards.vue'
import { useSpotifyStore } from '@stores/spotify/spotify.store'
import * as spotifyService from '@services/spotify.service'
import type {
  SpotifyAlbumSnippet,
  SpotifyArtist,
  SpotifyTrack,
} from '@/types/spotify/spotify'

const spotify = useSpotifyStore()
const router = useRouter()

const tab = ref<'tracks' | 'albums' | 'artists'>('tracks')
const loading = ref(false)
const errorMessage = ref<string | null>(null)

const tracks = ref<SpotifyTrack[]>([])
const albums = ref<SpotifyAlbumSnippet[]>([])
const artists = ref<SpotifyArtist[]>([])
const tracksOffset = ref(0)
const albumsOffset = ref(0)
const tracksTotal = ref(0)
const albumsTotal = ref(0)
const artistsCursor = ref<string | undefined>(undefined)
const artistsHasNext = ref(false)

const missingFollowScope = computed(() =>
  (spotify.status?.missing_scopes ?? []).includes('user-follow-read'),
)

onMounted(async () => {
  await spotify.loadHub()
  spotify.startPlayerPolling()
  await loadTab(true)
})

onUnmounted(() => {
  spotify.stopPlayerPolling()
})

watch(tab, () => {
  void loadTab(true)
})

watch(
  tracks,
  (list) => {
    void spotify.refreshLikedUris(list.map((t) => t.uri))
  },
  { deep: true },
)

async function loadTab(reset: boolean): Promise<void> {
  loading.value = true
  errorMessage.value = null
  try {
    if (tab.value === 'tracks') {
      if (reset) {
        tracksOffset.value = 0
        tracks.value = []
      }
      const data = await spotifyService.listLibraryTracks(20, tracksOffset.value)
      tracks.value = reset
        ? data.items.map((i) => i.track)
        : [...tracks.value, ...data.items.map((i) => i.track)]
      tracksTotal.value = data.total
      tracksOffset.value = data.offset + data.items.length
    } else if (tab.value === 'albums') {
      if (reset) {
        albumsOffset.value = 0
        albums.value = []
      }
      const data = await spotifyService.listLibraryAlbums(20, albumsOffset.value)
      albums.value = reset
        ? data.items.map((i) => i.album)
        : [...albums.value, ...data.items.map((i) => i.album)]
      albumsTotal.value = data.total
      albumsOffset.value = data.offset + data.items.length
    } else {
      if (missingFollowScope.value) {
        artists.value = []
        return
      }
      if (reset) {
        artistsCursor.value = undefined
        artists.value = []
      }
      const data = await spotifyService.listLibraryArtists(
        20,
        artistsCursor.value,
      )
      artists.value = reset ? data.artists : [...artists.value, ...data.artists]
      artistsHasNext.value = data.next
      artistsCursor.value = data.cursors?.after
    }
  } catch {
    errorMessage.value = 'Unable to load library. Try reconnecting Spotify.'
  } finally {
    loading.value = false
  }
}

const canLoadMore = computed(() => {
  if (tab.value === 'tracks') return tracks.value.length < tracksTotal.value
  if (tab.value === 'albums') return albums.value.length < albumsTotal.value
  return artistsHasNext.value
})
</script>

<template>
  <NexusPageWrapper show-toolbar title="Library">
    <NexusSpotifyChrome>
      <div class="library-page">
        <Message
          v-if="spotify.needsReauth"
          severity="warn"
          :closable="false"
          class="mb-3"
        >
          Reconnect Spotify to unlock full library scopes.
          <Button label="Reconnect" size="small" class="ml-2" @click="spotify.connect()" />
        </Message>

        <div class="tabs">
          <button
            v-for="item in [
              ['tracks', 'Liked songs'],
              ['albums', 'Albums'],
              ['artists', 'Artists'],
            ] as const"
            :key="item[0]"
            type="button"
            class="tab"
            :class="{ active: tab === item[0] }"
            @click="tab = item[0]"
          >
            {{ item[1] }}
          </button>
        </div>

        <div
          v-if="loading && !tracks.length && !albums.length && !artists.length"
          class="loading"
        >
          <NexusSkeletonList
            v-if="tab === 'tracks'"
            :rows="8"
            variant="track"
          />
          <NexusSkeletonCards v-else :cards="8" />
        </div>
        <Message v-else-if="errorMessage" severity="error" :closable="false">
          {{ errorMessage }}
        </Message>

        <template v-else-if="tab === 'tracks'">
          <p v-if="tracks.length === 0" class="empty">No liked songs yet.</p>
          <div v-else class="list">
            <NexusSpotifyTrackRow
              v-for="track in tracks"
              :key="track.id"
              :track="track"
              @play="spotify.playTrackUri(track.uri)"
            />
          </div>
        </template>

        <template v-else-if="tab === 'albums'">
          <p v-if="albums.length === 0" class="empty">No saved albums yet.</p>
          <div v-else class="grid">
            <button
              v-for="album in albums"
              :key="album.id"
              type="button"
              class="card"
              @click="
                router.push({
                  name: 'spotify-album',
                  params: { albumId: album.id },
                })
              "
            >
              <img v-if="album.image_url" :src="album.image_url" :alt="album.name" />
              <span v-else class="pi pi-disc fallback" />
              <span class="name">{{ album.name }}</span>
            </button>
          </div>
        </template>

        <template v-else>
          <Message
            v-if="missingFollowScope"
            severity="warn"
            :closable="false"
          >
            Followed artists need the <code>user-follow-read</code> scope.
            <Button label="Reconnect" size="small" class="ml-2" @click="spotify.connect()" />
          </Message>
          <p v-else-if="artists.length === 0" class="empty">No followed artists yet.</p>
          <div v-else class="grid">
            <button
              v-for="artist in artists"
              :key="artist.id"
              type="button"
              class="card"
              @click="
                router.push({
                  name: 'spotify-artist',
                  params: { artistId: artist.id },
                })
              "
            >
              <img
                v-if="artist.images[0]?.url"
                :src="artist.images[0].url"
                :alt="artist.name"
              />
              <span v-else class="pi pi-user fallback" />
              <span class="name">{{ artist.name }}</span>
            </button>
          </div>
        </template>

        <Button
          v-if="canLoadMore && !missingFollowScope"
          label="Load more"
          text
          :loading="loading"
          class="mt-2"
          @click="loadTab(false)"
        />
      </div>
    </NexusSpotifyChrome>
  </NexusPageWrapper>
</template>

<style scoped>
.library-page {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
}

.tab {
  border: 0;
  border-radius: 999px;
  padding: 0.4rem 0.9rem;
  background: color-mix(in srgb, var(--lavender-blush) 8%, transparent);
  color: color-mix(in srgb, var(--lavender-blush) 70%, transparent);
  cursor: pointer;
  font-weight: 600;
}

.tab.active {
  background: color-mix(in srgb, var(--spotify-green, #1db954) 22%, transparent);
  color: var(--lavender-blush);
}

.loading {
  min-height: 6rem;
}

.empty {
  display: grid;
  place-items: center;
  min-height: 6rem;
  color: color-mix(in srgb, var(--lavender-blush) 55%, transparent);
}

.list {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
}

.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(9rem, 1fr));
  gap: 0.85rem;
}

.card {
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
  padding: 0.65rem;
  border: 0;
  border-radius: 0.85rem;
  background: var(--spotify-card-surface);
  color: inherit;
  text-align: left;
  cursor: pointer;
}

.card img,
.fallback {
  width: 100%;
  aspect-ratio: 1;
  object-fit: cover;
  border-radius: 0.55rem;
  background: color-mix(in srgb, var(--lavender-blush) 8%, transparent);
}

.fallback {
  display: grid;
  place-items: center;
  font-size: 1.5rem;
}

.name {
  font-weight: 600;
  color: var(--lavender-blush);
}
</style>
