<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import NexusPageWrapper from '@components/nexus-page-wrapper/NexusPageWrapper.vue'
import NexusSpotifyChrome from '@components/nexus-spotify-chrome/NexusSpotifyChrome.vue'
import NexusSpotifyTrackRow from '@components/nexus-spotify-track-row/NexusSpotifyTrackRow.vue'
import NexusSkeletonMedia from '@components/nexus-skeleton-media/NexusSkeletonMedia.vue'
import NexusSkeletonCards from '@components/nexus-skeleton-cards/NexusSkeletonCards.vue'
import { useSpotifyStore } from '@stores/spotify/spotify.store'
import * as spotifyService from '@services/spotify.service'
import type {
  SpotifyAlbumSnippet,
  SpotifyArtistDetail,
  SpotifyTrack,
} from '@/types/spotify/spotify'

const spotify = useSpotifyStore()
const route = useRoute()

const loading = ref(true)
const artist = ref<SpotifyArtistDetail | null>(null)
const topTracks = ref<SpotifyTrack[]>([])
const albums = ref<SpotifyAlbumSnippet[]>([])
const catalogNote = ref<string | null>(null)

const artistId = computed(() => String(route.params.artistId ?? ''))

const imageUrl = computed(
  () => artist.value?.images?.[0]?.url ?? null,
)

onMounted(() => {
  spotify.startPlayerPolling()
  void load()
})

onUnmounted(() => {
  spotify.stopPlayerPolling()
})

watch(artistId, () => {
  void load()
})

watch(topTracks, (list) => {
  void spotify.refreshLikedUris(list.map((t) => t.uri))
})

async function load(): Promise<void> {
  if (!artistId.value) return
  loading.value = true
  catalogNote.value = null
  try {
    const [detail, tops, albumPage] = await Promise.all([
      spotifyService.getArtist(artistId.value),
      spotifyService.getArtistTopTracks(artistId.value),
      spotifyService.getArtistAlbums(artistId.value),
    ])
    artist.value = detail
    topTracks.value = tops.tracks
    albums.value = albumPage.albums
    catalogNote.value =
      detail.message ??
      tops.message ??
      albumPage.message ??
      null
  } catch {
    artist.value = {
      available: false,
      id: artistId.value,
      name: 'Artist unavailable',
      genres: [],
      images: [],
      external_url: null,
      message: 'Unable to load artist details.',
    }
    topTracks.value = []
    albums.value = []
  } finally {
    loading.value = false
  }
}

async function playTop(): Promise<void> {
  const first = topTracks.value[0]
  if (first) await spotify.playTrackUri(first.uri)
}
</script>

<template>
  <NexusPageWrapper show-toolbar :title="artist?.name ?? 'Artist'">
    <NexusSpotifyChrome>
      <div v-if="loading" class="loading">
        <NexusSkeletonMedia :rows="5" />
        <div class="albums-skel">
          <Skeleton width="5rem" height="1rem" class="mb-2" />
          <NexusSkeletonCards :cards="4" />
        </div>
      </div>
      <div v-else class="artist-page">
        <header class="hero">
          <div class="art">
            <img v-if="imageUrl" :src="imageUrl" :alt="artist?.name ?? 'Artist'" />
            <span v-else class="pi pi-user fallback" />
          </div>
          <div class="copy">
            <p class="eyebrow">Artist</p>
            <h2>{{ artist?.name ?? 'Unknown' }}</h2>
            <p v-if="artist?.genres?.length" class="genres">
              {{ artist.genres.slice(0, 6).join(' · ') }}
            </p>
            <Message
              v-if="catalogNote"
              severity="info"
              :closable="false"
              class="note"
            >
              {{ catalogNote }}
            </Message>
            <div class="actions">
              <Button
                label="Play top track"
                icon="pi pi-play"
                :disabled="!topTracks.length || spotify.controlBusy"
                @click="playTop"
              />
            </div>
          </div>
        </header>

        <section class="band">
          <h3>Popular</h3>
          <p v-if="topTracks.length === 0" class="empty">
            No top tracks available.
          </p>
          <div v-else class="list">
            <NexusSpotifyTrackRow
              v-for="track in topTracks"
              :key="track.id"
              :track="track"
              @play="spotify.playTrackUri(track.uri)"
            />
          </div>
        </section>

        <section class="band">
          <h3>Albums</h3>
          <p v-if="albums.length === 0" class="empty">No albums available.</p>
          <div v-else class="grid">
            <router-link
              v-for="album in albums"
              :key="album.id"
              :to="{ name: 'spotify-album', params: { albumId: album.id } }"
              class="card"
            >
              <img v-if="album.image_url" :src="album.image_url" :alt="album.name" />
              <span v-else class="pi pi-disc fallback-sm" />
              <span class="name">{{ album.name }}</span>
            </router-link>
          </div>
        </section>
      </div>
    </NexusSpotifyChrome>
  </NexusPageWrapper>
</template>

<style scoped>
.loading {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.albums-skel {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.artist-page {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.hero {
  display: grid;
  grid-template-columns: minmax(8rem, 12rem) 1fr;
  gap: 1.25rem;
  padding: 1rem;
  border-radius: 1rem;
  background: var(--spotify-card-surface);
}

@media (max-width: 720px) {
  .hero {
    grid-template-columns: 1fr;
  }
}

.art {
  aspect-ratio: 1;
  border-radius: 0.85rem;
  overflow: hidden;
  background: color-mix(in srgb, var(--lavender-blush) 8%, transparent);
  display: grid;
  place-items: center;
}

.art img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.fallback {
  font-size: 2.5rem;
  color: color-mix(in srgb, var(--lavender-blush) 45%, transparent);
}

.copy h2 {
  margin: 0.2rem 0 0.5rem;
  color: var(--lavender-blush);
}

.eyebrow {
  margin: 0;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  font-size: 0.75rem;
  color: color-mix(in srgb, var(--lavender-blush) 55%, transparent);
}

.genres {
  margin: 0 0 0.75rem;
  color: color-mix(in srgb, var(--lavender-blush) 65%, transparent);
}

.note {
  margin-bottom: 0.75rem;
}

.actions {
  display: flex;
  gap: 0.5rem;
}

.band h3 {
  margin: 0 0 0.75rem;
  color: var(--lavender-blush);
}

.list {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
}

.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(8.5rem, 1fr));
  gap: 0.75rem;
}

.card {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  text-decoration: none;
  color: inherit;
}

.card img,
.fallback-sm {
  width: 100%;
  aspect-ratio: 1;
  border-radius: 0.55rem;
  object-fit: cover;
  background: color-mix(in srgb, var(--lavender-blush) 8%, transparent);
}

.fallback-sm {
  display: grid;
  place-items: center;
}

.name {
  font-weight: 600;
  color: var(--lavender-blush);
}

.empty {
  color: color-mix(in srgb, var(--lavender-blush) 55%, transparent);
}
</style>
