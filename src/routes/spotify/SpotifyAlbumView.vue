<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import NexusPageWrapper from '@components/nexus-page-wrapper/NexusPageWrapper.vue'
import NexusSpotifyChrome from '@components/nexus-spotify-chrome/NexusSpotifyChrome.vue'
import NexusSpotifyTrackRow from '@components/nexus-spotify-track-row/NexusSpotifyTrackRow.vue'
import NexusSkeletonMedia from '@components/nexus-skeleton-media/NexusSkeletonMedia.vue'
import { useSpotifyStore } from '@stores/spotify/spotify.store'
import * as spotifyService from '@services/spotify.service'
import type { SpotifyAlbumDetail, SpotifyTrack } from '@/types/spotify/spotify'

const spotify = useSpotifyStore()
const route = useRoute()
const router = useRouter()

const loading = ref(true)
const album = ref<SpotifyAlbumDetail | null>(null)

const albumId = computed(() => String(route.params.albumId ?? ''))

const tracks = computed<SpotifyTrack[]>(() => {
  const list = album.value?.tracks ?? []
  return list.map((track) => ({
    id: track.id,
    name: track.name,
    uri: track.uri,
    duration_ms: track.duration_ms,
    explicit: track.explicit,
    album_name: album.value?.name ?? null,
    album_image_url: album.value?.image_url ?? null,
    album_id: album.value?.id ?? null,
    artists: track.artists ?? [],
    external_url: track.external_url ?? null,
  }))
})

onMounted(() => {
  spotify.startPlayerPolling()
  void load()
})

onUnmounted(() => {
  spotify.stopPlayerPolling()
})

watch(albumId, () => {
  void load()
})

watch(tracks, (list) => {
  void spotify.refreshLikedUris(list.map((t) => t.uri))
})

async function load(): Promise<void> {
  if (!albumId.value) return
  loading.value = true
  try {
    album.value = await spotifyService.getAlbum(albumId.value)
  } catch {
    album.value = {
      available: false,
      message: 'Unable to load album.',
    }
  } finally {
    loading.value = false
  }
}

async function playAlbum(): Promise<void> {
  if (!album.value?.uri) return
  await spotify.playPlaylist(album.value.uri)
}
</script>

<template>
  <NexusPageWrapper show-toolbar :title="album?.name ?? 'Album'">
    <NexusSpotifyChrome>
      <NexusSkeletonMedia v-if="loading" :rows="8" />
      <div v-else-if="!album?.available" class="empty-state">
        <Message severity="warn" :closable="false">
          {{ album?.message ?? 'Album unavailable from Spotify for this app.' }}
        </Message>
      </div>
      <div v-else class="album-page">
        <header class="hero">
          <div class="art">
            <img
              v-if="album.image_url"
              :src="album.image_url"
              :alt="album.name ?? 'Album'"
            />
            <span v-else class="pi pi-disc fallback" />
          </div>
          <div class="copy">
            <p class="eyebrow">Album</p>
            <h2>{{ album.name }}</h2>
            <p class="artists">
              <template v-for="(artist, index) in album.artists ?? []" :key="artist.id">
                <button
                  type="button"
                  class="artist-link"
                  @click="
                    router.push({
                      name: 'spotify-artist',
                      params: { artistId: artist.id },
                    })
                  "
                >
                  {{ artist.name }}
                </button>
                <span v-if="index < (album.artists?.length ?? 0) - 1">, </span>
              </template>
            </p>
            <p v-if="album.release_date" class="meta">
              {{ album.release_date }} · {{ album.total_tracks ?? tracks.length }} tracks
            </p>
            <Message
              v-if="album.message"
              severity="info"
              :closable="false"
              class="note"
            >
              {{ album.message }}
            </Message>
            <div class="actions">
              <Button
                label="Play album"
                icon="pi pi-play"
                :disabled="!album.uri || spotify.controlBusy"
                @click="playAlbum"
              />
            </div>
          </div>
        </header>

        <section class="band">
          <p v-if="tracks.length === 0" class="empty">No tracks on this album.</p>
          <div v-else class="list">
            <NexusSpotifyTrackRow
              v-for="track in tracks"
              :key="track.id"
              :track="track"
              @play="spotify.playTrackUri(track.uri)"
            />
          </div>
        </section>
      </div>
    </NexusSpotifyChrome>
  </NexusPageWrapper>
</template>

<style scoped>
.empty-state {
  display: grid;
  place-items: center;
  min-height: 10rem;
}

.album-page {
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
}

.copy h2 {
  margin: 0.2rem 0 0.45rem;
  color: var(--lavender-blush);
}

.eyebrow {
  margin: 0;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  font-size: 0.75rem;
  color: color-mix(in srgb, var(--lavender-blush) 55%, transparent);
}

.artists {
  margin: 0 0 0.35rem;
}

.artist-link {
  border: 0;
  background: transparent;
  color: color-mix(in srgb, var(--lavender-blush) 75%, transparent);
  cursor: pointer;
  padding: 0;
  font: inherit;
}

.artist-link:hover {
  color: var(--lavender-blush);
  text-decoration: underline;
}

.meta {
  margin: 0 0 0.75rem;
  font-size: 0.85rem;
  color: color-mix(in srgb, var(--lavender-blush) 55%, transparent);
}

.note {
  margin-bottom: 0.75rem;
}

.list {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
}

.empty {
  color: color-mix(in srgb, var(--lavender-blush) 55%, transparent);
}
</style>
