<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useConfirm } from 'primevue/useconfirm'
import NexusPageWrapper from '@components/nexus-page-wrapper/NexusPageWrapper.vue'
import NexusSpotifyChrome from '@components/nexus-spotify-chrome/NexusSpotifyChrome.vue'
import NexusSpotifyTrackRow from '@components/nexus-spotify-track-row/NexusSpotifyTrackRow.vue'
import { useSpotifyStore } from '@stores/spotify/spotify.store'
import type { SpotifyPlaylist } from '@/types/spotify/spotify'
import { Status } from '@/types/status'

const spotify = useSpotifyStore()
const route = useRoute()
const router = useRouter()
const confirm = useConfirm()

const playlist = ref<SpotifyPlaylist | null>(null)
const status = ref<Status>(Status.LOADING)
const editOpen = ref(false)
const editName = ref('')
const editDescription = ref('')
const saving = ref(false)

const playlistId = computed(() => String(route.params.playlistId ?? ''))

async function load(refresh = false): Promise<void> {
  status.value = Status.LOADING
  const data = await spotify.fetchPlaylist(playlistId.value, refresh)
  playlist.value = data
  status.value = data ? Status.OK : Status.ERROR
  if (data) {
    editName.value = data.name
    editDescription.value = data.description ?? ''
  }
}

onMounted(() => {
  void load()
})

watch(playlistId, () => {
  void load()
})

const items = computed(() => playlist.value?.items ?? [])

watch(
  items,
  (list) => {
    const uris = list
      .map((item) => item.track?.uri)
      .filter((uri): uri is string => Boolean(uri))
    void spotify.refreshLikedUris(uris)
  },
  { deep: true },
)

async function saveEdits(): Promise<void> {
  if (!playlist.value) return
  saving.value = true
  const updated = await spotify.updatePlaylist(playlist.value.id, {
    name: editName.value.trim(),
    description: editDescription.value.trim(),
  })
  saving.value = false
  if (updated) {
    playlist.value = { ...playlist.value, ...updated }
    editOpen.value = false
  }
}

function confirmDelete(event: Event): void {
  confirm.require({
    target: event.currentTarget as HTMLElement,
    message: 'Unfollow this playlist from Spotify?',
    icon: 'pi pi-exclamation-triangle',
    rejectProps: {
      label: 'Cancel',
      severity: 'secondary',
      outlined: true,
    },
    acceptProps: {
      label: 'Remove',
      severity: 'danger',
    },
    accept: async () => {
      if (!playlist.value) return
      const ok = await spotify.deletePlaylist(playlist.value.id)
      if (ok) await router.push({ name: 'spotify' })
    },
  })
}

async function removeTrack(uri: string, position: number): Promise<void> {
  if (!playlist.value) return
  const ok = await spotify.removePlaylistTrack(playlist.value.id, uri, position)
  if (ok) await load()
}
</script>

<template>
  <NexusPageWrapper show-toolbar :title="playlist?.name ?? 'Playlist'">
    <template #toolbar>
      <div class="toolbar-actions">
        <Button
          label="Back"
          icon="pi pi-arrow-left"
          severity="secondary"
          text
          @click="router.push({ name: 'spotify' })"
        />
        <Button
          v-if="playlist"
          label="Refresh"
          icon="pi pi-refresh"
          severity="secondary"
          text
          @click="load(true)"
        />
      </div>
    </template>

    <NexusSpotifyChrome>
    <div class="playlist-page">
      <div v-if="status === Status.LOADING" class="loading-block">
        <ProgressSpinner style="width: 2.5rem; height: 2.5rem" stroke-width="4" />
        <span>Loading playlist…</span>
      </div>

      <p v-else-if="!playlist" class="empty">Playlist not found.</p>

      <template v-else>
        <header class="hero">
          <div class="art">
            <img
              v-if="playlist.image_url"
              :src="playlist.image_url"
              :alt="playlist.name"
            />
            <span v-else class="pi pi-list text-3xl" />
          </div>
          <div class="hero-copy">
            <p class="eyebrow">Playlist</p>
            <h2>{{ playlist.name }}</h2>
            <p v-if="playlist.description" class="description">
              {{ playlist.description }}
            </p>
            <p class="meta">{{ playlist.item_count }} tracks</p>
            <div class="hero-actions">
              <Button
                label="Play"
                icon="pi pi-play"
                :loading="spotify.controlBusy"
                @click="spotify.playPlaylist(playlist.uri)"
              />
              <Button
                v-if="playlist.is_owner"
                label="Edit"
                icon="pi pi-pencil"
                severity="secondary"
                text
                @click="editOpen = true"
              />
              <Button
                label="Unfollow"
                icon="pi pi-trash"
                severity="danger"
                text
                @click="confirmDelete"
              />
            </div>
          </div>
        </header>

        <section class="tracks">
          <p v-if="items.length === 0" class="empty">
            This playlist has no tracks yet.
          </p>
          <div v-else class="track-list">
            <div
              v-for="item in items"
              :key="`${item.position}-${item.track?.id ?? item.position}`"
              class="track-line"
            >
              <span class="pos">{{ item.position + 1 }}</span>
              <NexusSpotifyTrackRow
                v-if="item.track"
                :track="item.track"
                class="track-grow"
                @play="
                  spotify.playPlaylist(playlist.uri, item.position)
                "
              />
              <span v-else class="missing">Unavailable track</span>
              <button
                v-if="item.track && playlist.is_owner"
                v-tooltip.left="'Remove'"
                type="button"
                class="remove"
                @click="removeTrack(item.track.uri, item.position)"
              >
                <span class="pi pi-times" />
              </button>
            </div>
          </div>
        </section>
      </template>
    </div>
    </NexusSpotifyChrome>

    <Dialog
      v-model:visible="editOpen"
      modal
      header="Edit playlist"
      :style="{ width: 'min(28rem, 92vw)' }"
    >
      <div class="edit-form">
        <label class="field">
          <span>Name</span>
          <InputText v-model="editName" class="w-full" />
        </label>
        <label class="field">
          <span>Description</span>
          <Textarea v-model="editDescription" rows="3" class="w-full" auto-resize />
        </label>
      </div>
      <template #footer>
        <Button
          label="Cancel"
          severity="secondary"
          text
          @click="editOpen = false"
        />
        <Button
          label="Save"
          :loading="saving"
          :disabled="!editName.trim()"
          @click="saveEdits"
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

.playlist-page {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  padding-top: 0.5rem;
  padding-bottom: 2rem;
}

.loading-block {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  color: color-mix(in srgb, var(--lavender-blush) 55%, transparent);
}

.empty {
  margin: 0;
  color: color-mix(in srgb, var(--lavender-blush) 50%, transparent);
}

.hero {
  display: grid;
  grid-template-columns: 10rem 1fr;
  gap: 1.25rem;
  padding: 1rem;
  border-radius: 1rem;
  background: var(--spotify-card-surface);
  border: 1px solid color-mix(in srgb, var(--lavender-blush) 10%, transparent);
}

@media (max-width: 700px) {
  .hero {
    grid-template-columns: 1fr;
  }
}

.art {
  width: 10rem;
  height: 10rem;
  border-radius: 0.85rem;
  overflow: hidden;
  background: color-mix(in srgb, var(--lavender-blush) 8%, transparent);
  display: grid;
  place-items: center;
  color: color-mix(in srgb, var(--lavender-blush) 40%, transparent);
}

.art img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.hero-copy {
  min-width: 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 0.35rem;
}

.eyebrow {
  margin: 0;
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--meadow-green);
}

.hero-copy h2 {
  margin: 0;
  font-size: clamp(1.4rem, 2.5vw, 1.9rem);
  line-height: 1.15;
}

.description {
  margin: 0;
  color: color-mix(in srgb, var(--lavender-blush) 62%, transparent);
  line-height: 1.4;
}

.meta {
  margin: 0;
  font-size: 0.85rem;
  color: color-mix(in srgb, var(--lavender-blush) 48%, transparent);
}

.hero-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
  margin-top: 0.5rem;
}

.track-list {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
}

.track-line {
  display: grid;
  grid-template-columns: 2rem 1fr auto;
  align-items: center;
  gap: 0.25rem;
}

.pos {
  text-align: right;
  font-size: 0.8rem;
  font-variant-numeric: tabular-nums;
  color: color-mix(in srgb, var(--lavender-blush) 40%, transparent);
}

.track-grow {
  min-width: 0;
}

.missing {
  padding: 0.75rem;
  color: color-mix(in srgb, var(--lavender-blush) 45%, transparent);
}

.remove {
  width: 2rem;
  height: 2rem;
  border: 0;
  border-radius: 0.5rem;
  background: transparent;
  color: color-mix(in srgb, var(--lavender-blush) 45%, transparent);
  cursor: pointer;
}

.remove:hover {
  color: var(--meadow-green);
  background: color-mix(in srgb, var(--meadow-green) 12%, transparent);
}

.edit-form {
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
