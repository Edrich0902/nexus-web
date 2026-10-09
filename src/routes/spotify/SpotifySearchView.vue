<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import IndexTemplate from '@design/templates/IndexTemplate.vue'
import NxStage from '@design/components/NxStage.vue'
import NxSearchField from '@design/components/NxSearchField.vue'
import NxPillGroup from '@design/components/NxPillGroup.vue'
import NxCoverGrid from '@design/components/NxCoverGrid.vue'
import NxCoverCard from '@design/components/NxCoverCard.vue'
import NxEmptyState from '@design/components/NxEmptyState.vue'
import NxSkeletonRows from '@design/components/skeletons/NxSkeletonRows.vue'
import NexusSpotifyTrackRow from '@components/nexus-spotify-track-row/NexusSpotifyTrackRow.vue'
import { useSpotifyStore } from '@stores/spotify/spotify.store'
import * as spotifyService from '@services/spotify.service'
import type { SpotifySearchResponse } from '@/types/spotify/spotify'
import ListeningNav from './ListeningNav.vue'
import { artistNames, capitalise, releaseYear } from './listening'

type Tab = 'tracks' | 'artists' | 'albums' | 'playlists'

const spotify = useSpotifyStore()
const route = useRoute()
const router = useRouter()

const query = ref(typeof route.query.q === 'string' ? route.query.q : '')
const tab = ref<Tab>('tracks')
const loading = ref(false)
const results = ref<SpotifySearchResponse | null>(null)
const failed = ref(false)
let requestId = 0

onMounted(() => {
  void spotify.loadHub()
  if (query.value.trim()) void runSearch(query.value.trim())
})

onUnmounted(() => {
  requestId++
})

watch(
  () => results.value?.tracks.map((t) => t.uri) ?? [],
  (uris) => void spotify.refreshLikedUris(uris),
)

const tabs = computed(() =>
  (
    [
      ['tracks', 'Tracks'],
      ['artists', 'Artists'],
      ['albums', 'Albums'],
      ['playlists', 'Playlists'],
    ] as const
  ).map(([value, label]) => {
    const n = results.value?.[value].length
    return { value, label: n ? `${label} · ${n}` : label }
  }),
)

const empty = computed(() => {
  const r = results.value
  return Boolean(r) && !r!.tracks.length && !r!.artists.length && !r!.albums.length && !r!.playlists.length
})

async function runSearch(q: string): Promise<void> {
  void router.replace({ query: q ? { q } : {} })
  const current = ++requestId
  if (!q) {
    results.value = null
    loading.value = false
    failed.value = false
    return
  }
  loading.value = true
  failed.value = false
  try {
    const data = await spotifyService.search(q)
    if (current !== requestId) return
    results.value = data
    if (!data[tab.value].length) {
      const firstWithResults = (['tracks', 'artists', 'albums', 'playlists'] as const).find((k) => data[k].length)
      if (firstWithResults) tab.value = firstWithResults
    }
  } catch {
    if (current !== requestId) return
    failed.value = true
    results.value = null
  } finally {
    if (current === requestId) loading.value = false
  }
}
</script>

<template>
  <IndexTemplate>
    <template #stage>
      <NxStage
        size="compact"
        eyebrow="Listening"
        title="Find"
        accent="something new"
        lede="Tracks, artists, albums and playlists from Spotify. Play anything straight to your active device."
      />
    </template>

    <template #toolbar>
      <ListeningNav />
    </template>

    <div class="search">
      <div class="controls">
        <NxSearchField
          v-model="query"
          class="field"
          placeholder="Artists, songs, albums…"
          label="Search Spotify"
          :debounce="350"
          autofocus
          @search="runSearch"
        />
        <NxPillGroup v-if="results && !empty" v-model="tab" :options="tabs" label="Result type" size="sm" />
      </div>

      <NxSkeletonRows v-if="loading && !results" :rows="8" />
      <NxEmptyState
        v-else-if="failed"
        tone="error"
        icon="close"
        title="Search failed"
        body="Spotify did not answer. Try again in a moment."
      />
      <NxEmptyState
        v-else-if="!results"
        icon="search"
        title="What are you in the mood for?"
        body="Start typing. Up to ten results come back for each kind."
      />
      <NxEmptyState
        v-else-if="empty"
        icon="search"
        title="Nothing found"
        body="Try a different spelling, or search for the artist instead."
      />

      <div v-else :class="{ dim: loading }">
        <div v-if="tab === 'tracks'">
          <NexusSpotifyTrackRow
            v-for="track in results.tracks"
            :key="track.id"
            :track="track"
            @play="spotify.playTrackUri(track.uri)"
          />
        </div>

        <NxCoverGrid v-else-if="tab === 'artists'" :min="160">
          <NxCoverCard
            v-for="a in results.artists"
            :key="a.id"
            :to="{ name: 'spotify-artist', params: { artistId: a.id } }"
            :title="a.name"
            :sub="a.genres[0] ? capitalise(a.genres[0]) : 'Artist'"
            :src="a.images[0]?.url"
            aspect="circle"
            icon="profile"
          />
        </NxCoverGrid>

        <NxCoverGrid v-else-if="tab === 'albums'" :min="160">
          <NxCoverCard
            v-for="al in results.albums"
            :key="al.id"
            :to="{ name: 'spotify-album', params: { albumId: al.id } }"
            :title="al.name"
            :sub="artistNames(al.artists)"
            :meta="[releaseYear(al.release_date), capitalise(al.album_type)].filter(Boolean).join(' · ')"
            :src="al.image_url"
            aspect="square"
            icon="music"
          />
        </NxCoverGrid>

        <NxCoverGrid v-else :min="160">
          <NxCoverCard
            v-for="p in results.playlists"
            :key="p.id"
            :to="{ name: 'spotify-playlist', params: { playlistId: p.id } }"
            :title="p.name"
            :sub="p.owner_name ?? 'Playlist'"
            :meta="`${p.item_count} tracks`"
            :src="p.image_url"
            aspect="square"
            icon="queue"
          />
        </NxCoverGrid>
      </div>
    </div>
  </IndexTemplate>
</template>

<style scoped>
.search {
  display: flex;
  flex-direction: column;
  gap: 28px;
}

.controls {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px 16px;
}

.field.nx-search {
  max-width: 560px;
  height: 50px;
}

.dim {
  opacity: 0.55;
  transition: opacity 0.2s;
}
</style>
