<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import NexusPageWrapper from '@components/nexus-page-wrapper/NexusPageWrapper.vue'
import NexusSpotifyChrome from '@components/nexus-spotify-chrome/NexusSpotifyChrome.vue'
import NexusSpotifyTrackRow from '@components/nexus-spotify-track-row/NexusSpotifyTrackRow.vue'
import { useSpotifyStore } from '@stores/spotify/spotify.store'
import * as spotifyService from '@services/spotify.service'
import type { SpotifySearchResponse } from '@/types/spotify/spotify'

const spotify = useSpotifyStore()
const router = useRouter()

const query = ref('')
const tab = ref<'tracks' | 'artists' | 'albums' | 'playlists'>('tracks')
const loading = ref(false)
const results = ref<SpotifySearchResponse | null>(null)
const errorMessage = ref<string | null>(null)

let debounceTimer: ReturnType<typeof setTimeout> | null = null
let abortController: AbortController | null = null
let requestId = 0

onMounted(() => {
  void spotify.loadHub()
  spotify.startPlayerPolling()
})

onUnmounted(() => {
  spotify.stopPlayerPolling()
  if (debounceTimer) clearTimeout(debounceTimer)
  abortController?.abort()
})

watch(query, (value) => {
  if (debounceTimer) clearTimeout(debounceTimer)
  const trimmed = value.trim()
  if (!trimmed) {
    results.value = null
    errorMessage.value = null
    loading.value = false
    abortController?.abort()
    return
  }
  debounceTimer = setTimeout(() => {
    void runSearch(trimmed)
  }, 350)
})

watch(
  () => results.value?.tracks.map((t) => t.uri) ?? [],
  (uris) => {
    void spotify.refreshLikedUris(uris)
  },
)

const empty = computed(() => {
  if (!results.value) return false
  return (
    results.value.tracks.length === 0 &&
    results.value.artists.length === 0 &&
    results.value.albums.length === 0 &&
    results.value.playlists.length === 0
  )
})

async function runSearch(q: string): Promise<void> {
  abortController?.abort()
  abortController = new AbortController()
  const currentId = ++requestId
  loading.value = true
  errorMessage.value = null
  try {
    const data = await spotifyService.search(q)
    if (currentId !== requestId) return
    results.value = data
  } catch (error) {
    if (currentId !== requestId) return
    errorMessage.value = 'Search failed. Try again in a moment.'
    results.value = null
    void error
  } finally {
    if (currentId === requestId) loading.value = false
  }
}
</script>

<template>
  <NexusPageWrapper show-toolbar title="Search">
    <NexusSpotifyChrome>
      <div class="search-page">
        <InputText
          v-model="query"
          placeholder="Search tracks, artists, albums, playlists"
          class="w-full search-input"
          autofocus
        />

        <div class="tabs">
          <button
            v-for="item in [
              ['tracks', 'Tracks'],
              ['artists', 'Artists'],
              ['albums', 'Albums'],
              ['playlists', 'Playlists'],
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

        <div v-if="loading" class="loading">
          <ProgressSpinner style="width: 2rem; height: 2rem" stroke-width="4" />
        </div>
        <Message v-else-if="errorMessage" severity="error" :closable="false">
          {{ errorMessage }}
        </Message>
        <p v-else-if="!query.trim()" class="empty">
          Type to search Spotify (max 10 results per type).
        </p>
        <p v-else-if="empty" class="empty">
          No results. Catalog search may be limited for some Spotify apps.
        </p>

        <template v-else-if="results">
          <div v-if="tab === 'tracks'" class="list">
            <NexusSpotifyTrackRow
              v-for="track in results.tracks"
              :key="track.id"
              :track="track"
              @play="spotify.playTrackUri(track.uri)"
            />
          </div>

          <div v-else-if="tab === 'artists'" class="grid">
            <button
              v-for="artist in results.artists"
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

          <div v-else-if="tab === 'albums'" class="grid">
            <button
              v-for="album in results.albums"
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
              <img
                v-if="album.image_url"
                :src="album.image_url"
                :alt="album.name"
              />
              <span v-else class="pi pi-disc fallback" />
              <span class="name">{{ album.name }}</span>
              <span class="sub">
                {{ album.artists.map((a) => a.name).join(', ') }}
              </span>
            </button>
          </div>

          <div v-else class="grid">
            <button
              v-for="playlist in results.playlists"
              :key="playlist.id"
              type="button"
              class="card"
              @click="
                router.push({
                  name: 'spotify-playlist',
                  params: { playlistId: playlist.id },
                })
              "
            >
              <img
                v-if="playlist.image_url"
                :src="playlist.image_url"
                :alt="playlist.name"
              />
              <span v-else class="pi pi-list fallback" />
              <span class="name">{{ playlist.name }}</span>
              <span class="sub">{{ playlist.item_count }} tracks</span>
            </button>
          </div>
        </template>
      </div>
    </NexusSpotifyChrome>
  </NexusPageWrapper>
</template>

<style scoped>
.search-page {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.search-input {
  font-size: 1rem;
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

.loading,
.empty {
  display: grid;
  place-items: center;
  min-height: 8rem;
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
  color: color-mix(in srgb, var(--lavender-blush) 45%, transparent);
}

.name {
  font-weight: 600;
  color: var(--lavender-blush);
}

.sub {
  font-size: 0.75rem;
  color: color-mix(in srgb, var(--lavender-blush) 55%, transparent);
}
</style>
