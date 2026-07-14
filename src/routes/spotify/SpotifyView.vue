<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useConfirm } from 'primevue/useconfirm'
import NexusPageWrapper from '@components/nexus-page-wrapper/NexusPageWrapper.vue'
import NexusSpotifyChrome from '@components/nexus-spotify-chrome/NexusSpotifyChrome.vue'
import NexusSpotifyIcon from '@components/nexus-spotify-icon/NexusSpotifyIcon.vue'
import NexusSpotifyPlayer from '@components/nexus-spotify-player/NexusSpotifyPlayer.vue'
import NexusSpotifyTrackMetrics from '@components/nexus-spotify-track-metrics/NexusSpotifyTrackMetrics.vue'
import NexusSpotifySimilarRecs from '@components/nexus-spotify-similar-recs/NexusSpotifySimilarRecs.vue'
import NexusSpotifyTrackRow from '@components/nexus-spotify-track-row/NexusSpotifyTrackRow.vue'
import NexusSkeletonList from '@components/nexus-skeleton-list/NexusSkeletonList.vue'
import NexusSkeletonCards from '@components/nexus-skeleton-cards/NexusSkeletonCards.vue'
import { useSpotifyStore } from '@stores/spotify/spotify.store'

const spotify = useSpotifyStore()
const route = useRoute()
const router = useRouter()
const confirm = useConfirm()

const createOpen = ref(false)
const newPlaylistName = ref('')
const newPlaylistDescription = ref('')
const creating = ref(false)

onMounted(async () => {
  const connected = typeof route.query.connected === 'string' ? route.query.connected : null
  const error = typeof route.query.error === 'string' ? route.query.error : null

  if (connected !== null) {
    await spotify.handleOAuthReturn(connected, error)
    await router.replace({ name: 'spotify', query: {} })
    return
  }

  await spotify.loadHub()
})

watch(
  () => spotify.connected,
  (isConnected) => {
    if (isConnected) void spotify.loadHub()
  },
)

const genres = computed(() => spotify.taste?.genres?.slice(0, 10) ?? [])
const suggestionTracks = computed(() => spotify.suggestions.slice(0, 8))
const onRepeat = computed(() => spotify.taste?.on_repeat?.slice(0, 8) ?? [])
const peakListening = computed(() => spotify.taste?.time_of_day?.peak_bucket ?? null)

watch(
  () => [
    ...spotify.recentlyPlayed.map((r) => r.track?.uri).filter(Boolean),
    ...spotify.suggestions.map((s) => s.track.uri),
    ...onRepeat.value.map((r) => r.track.uri),
  ],
  (uris) => {
    void spotify.refreshLikedUris(uris as string[])
  },
)

function disconnectConfirm(event: Event): void {
  confirm.require({
    target: event.currentTarget as HTMLElement,
    message: 'Disconnect Spotify from Nexus?',
    icon: 'pi pi-exclamation-triangle',
    rejectProps: {
      label: 'Cancel',
      severity: 'secondary',
      outlined: true,
    },
    acceptProps: {
      label: 'Disconnect',
      severity: 'danger',
    },
    accept: () => {
      void spotify.disconnect()
    },
  })
}

async function submitCreatePlaylist(): Promise<void> {
  if (!newPlaylistName.value.trim()) return
  creating.value = true
  const playlist = await spotify.createPlaylist({
    name: newPlaylistName.value.trim(),
    description: newPlaylistDescription.value.trim() || undefined,
  })
  creating.value = false
  if (playlist) {
    createOpen.value = false
    newPlaylistName.value = ''
    newPlaylistDescription.value = ''
    await router.push({
      name: 'spotify-playlist',
      params: { playlistId: playlist.id },
    })
  }
}
</script>

<template>
  <NexusPageWrapper show-toolbar title="Spotify">
    <template #toolbar>
      <div class="toolbar-actions">
        <template v-if="spotify.connected">
          <Button
            label="Sync"
            icon="pi pi-sync"
            severity="secondary"
            text
            :loading="spotify.syncPending"
            @click="spotify.syncNow()"
          />
          <Button
            label="Disconnect"
            icon="pi pi-times"
            severity="danger"
            text
            @click="disconnectConfirm"
          />
        </template>
      </div>
    </template>

    <div class="spotify-page">
      <NexusSpotifyChrome>
      <Message
        v-if="spotify.needsReauth"
        severity="warn"
        :closable="false"
        class="reauth-banner"
      >
        Spotify needs re-authorization
        <span v-if="spotify.status?.missing_scopes?.length">
          (missing: {{ spotify.status.missing_scopes.join(', ') }})
        </span>.
        <Button
          label="Reconnect"
          size="small"
          class="ml-2"
          @click="spotify.connect()"
        />
      </Message>

      <section v-if="!spotify.connected && !spotify.statusLoading" class="connect-hero">
        <div class="connect-mark">
          <NexusSpotifyIcon :size="36" />
        </div>
        <div class="connect-copy">
          <h2>Link Spotify</h2>
          <p>
            Control playback on your devices, browse recent listens, and manage
            playlists from Nexus — audio stays on Spotify.
          </p>
          <Button
            label="Connect Spotify"
            icon="pi pi-link"
            @click="spotify.connect()"
          />
        </div>
      </section>

      <div v-else-if="spotify.statusLoading" class="loading-block">
        <Skeleton width="100%" height="4.5rem" border-radius="1rem" />
        <div class="loading-bands">
          <Skeleton width="9rem" height="1.05rem" class="mb-3" />
          <NexusSkeletonList :rows="4" variant="track" />
        </div>
      </div>

      <template v-else>
        <div class="player-metrics-row">
          <NexusSpotifyPlayer />
          <NexusSpotifyTrackMetrics />
        </div>

        <NexusSpotifySimilarRecs />

        <section class="band">
          <div class="band-head">
            <h3>Recently played</h3>
          </div>
          <NexusSkeletonList
            v-if="spotify.recentlyLoading"
            :rows="6"
            variant="track"
          />
          <p v-else-if="spotify.recentlyPlayed.length === 0" class="empty">
            No recent plays yet. Hit Sync after listening on Spotify.
          </p>
          <div v-else class="recent-grid">
            <NexusSpotifyTrackRow
              v-for="row in spotify.recentlyPlayed.slice(0, 12)"
              :key="`${row.played_at}-${row.track?.id}`"
              v-show="row.track"
              :track="row.track!"
              @play="row.track?.uri && spotify.playTrackUri(row.track.uri)"
            />
          </div>
        </section>

        <section v-if="onRepeat.length" class="band">
          <div class="band-head">
            <h3>On repeat</h3>
            <span v-if="peakListening" class="peak-note">
              Peak listening: {{ peakListening }}
            </span>
          </div>
          <div class="suggestion-list">
            <NexusSpotifyTrackRow
              v-for="item in onRepeat"
              :key="item.track.id"
              :track="item.track"
              :subtitle="`${item.play_count} plays · last ${item.window_days}d`"
              @play="spotify.playTrackUri(item.track.uri)"
            />
          </div>
        </section>
        <section class="band">
          <div class="band-head">
            <h3>Playlists</h3>
            <div class="band-actions">
              <Button
                label="New playlist"
                icon="pi pi-plus"
                size="small"
                text
                @click="createOpen = true"
              />
            </div>
          </div>
          <NexusSkeletonCards
            v-if="spotify.playlistsLoading"
            :cards="6"
          />
          <p v-else-if="spotify.playlists.length === 0" class="empty">
            No playlists synced yet.
          </p>
          <div v-else class="playlist-row">
            <article
              v-for="playlist in spotify.playlists"
              :key="playlist.id"
              class="playlist-card"
            >
              <router-link
                :to="{
                  name: 'spotify-playlist',
                  params: { playlistId: playlist.id },
                }"
                class="playlist-link"
              >
                <div class="playlist-art">
                  <img
                    v-if="playlist.image_url"
                    :src="playlist.image_url"
                    :alt="playlist.name"
                  />
                  <span v-else class="pi pi-list" />
                </div>
                <div class="playlist-meta">
                  <span class="playlist-name">{{ playlist.name }}</span>
                  <span class="playlist-count">
                    {{ playlist.item_count }} tracks
                  </span>
                </div>
              </router-link>
              <button
                v-tooltip.top="'Play playlist'"
                type="button"
                class="playlist-play"
                :disabled="spotify.controlBusy"
                @click="spotify.playPlaylist(playlist.uri)"
              >
                <span class="pi pi-play" />
              </button>
            </article>
          </div>
        </section>

        <section class="band taste-band">
          <div class="band-head">
            <h3>Taste & suggestions</h3>
          </div>
          <div v-if="spotify.tasteLoading" class="taste-skel">
            <div class="genre-skel">
              <Skeleton
                v-for="n in 5"
                :key="n"
                width="5.5rem"
                height="1.75rem"
                border-radius="999px"
              />
            </div>
            <NexusSkeletonList :rows="4" variant="track" />
          </div>
          <template v-else>
            <div v-if="genres.length" class="genre-chips">
              <span v-for="g in genres" :key="g.genre" class="genre-chip">
                {{ g.genre }}
                <em>{{ g.count }}</em>
              </span>
            </div>
            <p v-else class="empty subtle">
              Genre profile fills in after top artists sync.
            </p>

            <div v-if="suggestionTracks.length" class="suggestion-list">
              <NexusSpotifyTrackRow
                v-for="item in suggestionTracks"
                :key="item.track.id"
                :track="item.track"
                :subtitle="item.reason"
                @play="spotify.playTrackUri(item.track.uri)"
              />
            </div>
            <p v-else class="empty subtle">
              Suggestions appear once recent and top tracks are available.
            </p>
          </template>
        </section>
      </template>
      </NexusSpotifyChrome>
    </div>

    <Dialog
      v-model:visible="createOpen"
      modal
      header="New playlist"
      :style="{ width: 'min(28rem, 92vw)' }"
    >
      <div class="create-form">
        <label class="field">
          <span>Name</span>
          <InputText v-model="newPlaylistName" autofocus class="w-full" />
        </label>
        <label class="field">
          <span>Description</span>
          <Textarea
            v-model="newPlaylistDescription"
            rows="3"
            class="w-full"
            auto-resize
          />
        </label>
      </div>
      <template #footer>
        <Button
          label="Cancel"
          severity="secondary"
          text
          @click="createOpen = false"
        />
        <Button
          label="Create"
          :loading="creating"
          :disabled="!newPlaylistName.trim()"
          @click="submitCreatePlaylist"
        />
      </template>
    </Dialog>
  </NexusPageWrapper>
</template>

<style scoped>
.toolbar-actions {
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.spotify-page {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  padding-top: 0.5rem;
  padding-bottom: 2rem;
}

.player-metrics-row {
  display: grid;
  grid-template-columns: minmax(0, 1.4fr) minmax(16rem, 0.85fr);
  gap: 1rem;
  align-items: stretch;
}

@media (max-width: 980px) {
  .player-metrics-row {
    grid-template-columns: 1fr;
  }
}

.reauth-banner {
  align-items: center;
}

.connect-hero {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 1.25rem;
  align-items: center;
  padding: 1.5rem;
  border-radius: 1rem;
  background: var(--spotify-card-surface);
  border: 1px solid color-mix(in srgb, var(--lavender-blush) 10%, transparent);
}

@media (max-width: 640px) {
  .connect-hero {
    grid-template-columns: 1fr;
  }
}

.connect-mark {
  width: 4.5rem;
  height: 4.5rem;
  border-radius: 1rem;
  display: grid;
  place-items: center;
  color: var(--spotify-green);
  background: color-mix(in srgb, var(--spotify-green) 14%, transparent);
  border: 1px solid color-mix(in srgb, var(--spotify-green) 35%, transparent);
}

.connect-copy h2 {
  margin: 0 0 0.35rem;
  font-size: 1.45rem;
}

.connect-copy p {
  margin: 0 0 1rem;
  max-width: 36rem;
  color: color-mix(in srgb, var(--lavender-blush) 65%, transparent);
  line-height: 1.45;
}

.loading-block {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.loading-bands {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.taste-skel {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.genre-skel {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.band {
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
}

.band-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}

.band-head h3 {
  margin: 0;
  font-size: 1.05rem;
  font-weight: 700;
  letter-spacing: 0.02em;
}

.empty {
  margin: 0;
  color: color-mix(in srgb, var(--lavender-blush) 50%, transparent);
  font-size: 0.9rem;
}

.empty.subtle {
  font-size: 0.85rem;
}

.recent-grid {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
}

.peak-note {
  font-size: 0.8rem;
  color: color-mix(in srgb, var(--lavender-blush) 50%, transparent);
  text-transform: capitalize;
}

.recent-card {
  display: none;
}

.recent-card:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.recent-art {
  position: relative;
  aspect-ratio: 1;
  border-radius: 0.75rem;
  overflow: hidden;
  background: color-mix(in srgb, var(--lavender-blush) 8%, transparent);
  display: grid;
  place-items: center;
  color: color-mix(in srgb, var(--lavender-blush) 40%, transparent);
}

.recent-art img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.recent-play {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  background: color-mix(in srgb, var(--coffee-bean) 50%, transparent);
  opacity: 0;
  transition: opacity 0.15s ease;
  color: var(--lavender-blush);
}

.recent-card:hover .recent-play {
  opacity: 1;
}

.recent-title,
.recent-artist {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.recent-title {
  font-size: 0.85rem;
  font-weight: 600;
}

.recent-artist {
  font-size: 0.75rem;
  color: color-mix(in srgb, var(--lavender-blush) 50%, transparent);
}

.playlist-row {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(16rem, 1fr));
  gap: 0.75rem;
}

.playlist-card {
  position: relative;
  border-radius: 0.85rem;
  overflow: hidden;
  background: var(--spotify-card-surface);
  border: 1px solid color-mix(in srgb, var(--lavender-blush) 10%, transparent);
}

.playlist-link {
  display: grid;
  grid-template-columns: 4.5rem 1fr;
  gap: 0.75rem;
  padding: 0.65rem;
  align-items: center;
  min-height: 5.5rem;
}

.playlist-art {
  width: 4.5rem;
  height: 4.5rem;
  border-radius: 0.55rem;
  overflow: hidden;
  background: color-mix(in srgb, var(--lavender-blush) 8%, transparent);
  display: grid;
  place-items: center;
  color: color-mix(in srgb, var(--lavender-blush) 40%, transparent);
}

.playlist-art img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.playlist-meta {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  padding-right: 2.5rem;
}

.playlist-name {
  font-weight: 650;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.playlist-count {
  font-size: 0.78rem;
  color: color-mix(in srgb, var(--lavender-blush) 50%, transparent);
}

.playlist-play {
  position: absolute;
  right: 0.7rem;
  bottom: 0.7rem;
  width: 2.25rem;
  height: 2.25rem;
  border: 0;
  border-radius: 999px;
  background: var(--meadow-green);
  color: var(--coffee-bean);
  display: grid;
  place-items: center;
  cursor: pointer;
  transition: transform 0.15s ease;
}

.playlist-play:hover:not(:disabled) {
  transform: scale(1.06);
}

.playlist-play:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.taste-band {
  padding: 1rem;
  border-radius: 1rem;
  background: var(--spotify-card-surface);
  border: 1px solid color-mix(in srgb, var(--lavender-blush) 8%, transparent);
}

.genre-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 0.45rem;
}

.genre-chip {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.35rem 0.7rem;
  border-radius: 999px;
  font-size: 0.8rem;
  background: color-mix(in srgb, var(--coffee-bean) 45%, transparent);
  border: 1px solid color-mix(in srgb, var(--lavender-blush) 12%, transparent);
}

.genre-chip em {
  font-style: normal;
  color: var(--meadow-green);
  font-weight: 700;
}

.suggestion-list {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
  margin-top: 0.35rem;
}

.create-form {
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  font-size: 0.85rem;
  color: color-mix(in srgb, var(--lavender-blush) 70%, transparent);
}
</style>
