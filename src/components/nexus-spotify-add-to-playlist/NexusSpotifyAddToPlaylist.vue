<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useSpotifyStore } from '@stores/spotify/spotify.store'

const spotify = useSpotifyStore()

const visible = computed({
  get: () => spotify.addToPlaylistUri != null,
  set: (value: boolean) => {
    if (!value) spotify.closeAddToPlaylist()
  },
})

const creating = ref(false)
const newName = ref('')
const busyId = ref<string | null>(null)
const membershipLoading = ref(false)
const containingIds = ref<Set<string>>(new Set())

const uri = computed(() => spotify.addToPlaylistUri)
const playlists = computed(() => spotify.playlists)

async function refreshMembership(): Promise<void> {
  if (!uri.value) {
    containingIds.value = new Set()
    return
  }
  membershipLoading.value = true
  const ids = await spotify.playlistsContainingUri(uri.value)
  containingIds.value = new Set(ids)
  membershipLoading.value = false
}

watch(visible, (open) => {
  if (open) {
    newName.value = ''
    creating.value = false
    if (spotify.playlists.length === 0) {
      void spotify.loadHub()
    }
    void refreshMembership()
  } else {
    containingIds.value = new Set()
  }
})

async function addTo(playlistId: string): Promise<void> {
  if (!uri.value) return
  busyId.value = playlistId
  const ok = await spotify.addTracksToPlaylist(playlistId, [uri.value], {
    close: false,
  })
  if (ok) {
    containingIds.value = new Set([...containingIds.value, playlistId])
  }
  busyId.value = null
}

async function removeFrom(playlistId: string): Promise<void> {
  if (!uri.value) return
  busyId.value = playlistId
  const ok = await spotify.removeTrackFromPlaylist(playlistId, uri.value)
  if (ok) {
    const next = new Set(containingIds.value)
    next.delete(playlistId)
    containingIds.value = next
  }
  busyId.value = null
}

async function onPlaylistClick(playlistId: string): Promise<void> {
  if (containingIds.value.has(playlistId)) {
    await removeFrom(playlistId)
  } else {
    await addTo(playlistId)
  }
}

async function createAndAdd(): Promise<void> {
  if (!uri.value || !newName.value.trim()) return
  busyId.value = 'new'
  const playlist = await spotify.createPlaylist({
    name: newName.value.trim(),
  })
  if (playlist) {
    const ok = await spotify.addTracksToPlaylist(playlist.id, [uri.value], {
      close: false,
    })
    if (ok) {
      containingIds.value = new Set([...containingIds.value, playlist.id])
    }
  }
  busyId.value = null
  creating.value = false
  newName.value = ''
}
</script>

<template>
  <Dialog
    v-model:visible="visible"
    modal
    header="Add to playlist"
    :style="{ width: 'min(26rem, 92vw)' }"
  >
    <div class="add-panel">
      <Button
        v-if="!creating"
        label="New playlist"
        icon="pi pi-plus"
        text
        size="small"
        class="new-btn"
        @click="creating = true"
      />
      <div v-else class="create-row">
        <InputText
          v-model="newName"
          placeholder="Playlist name"
          class="w-full"
          autofocus
          @keyup.enter="createAndAdd"
        />
        <Button
          label="Create & add"
          size="small"
          :loading="busyId === 'new'"
          :disabled="!newName.trim()"
          @click="createAndAdd"
        />
      </div>

      <p v-if="playlists.length === 0" class="empty">
        No playlists yet. Create one above or sync after connecting.
      </p>
      <div v-else class="list">
        <p v-if="membershipLoading" class="membership-hint">
          Checking which playlists already have this track…
        </p>
        <button
          v-for="playlist in playlists"
          :key="playlist.id"
          type="button"
          class="playlist-row"
          :class="{ belongs: containingIds.has(playlist.id) }"
          :disabled="busyId === playlist.id"
          @click="onPlaylistClick(playlist.id)"
        >
          <div class="art">
            <img
              v-if="playlist.image_url"
              :src="playlist.image_url"
              :alt="playlist.name"
            />
            <span v-else class="pi pi-list" />
          </div>
          <span class="name">{{ playlist.name }}</span>
          <ProgressSpinner
            v-if="busyId === playlist.id"
            style="width: 1.25rem; height: 1.25rem"
            stroke-width="5"
          />
          <template v-else-if="containingIds.has(playlist.id)">
            <span class="action-label">Remove</span>
            <span class="pi pi-minus" />
          </template>
          <span v-else class="pi pi-plus" />
        </button>
      </div>
    </div>
  </Dialog>
</template>

<style scoped>
.add-panel {
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
}

.new-btn {
  align-self: flex-start;
}

.create-row {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.list {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  max-height: 18rem;
  overflow: auto;
}

.membership-hint {
  margin: 0 0 0.25rem;
  font-size: 0.75rem;
  color: color-mix(in srgb, var(--lavender-blush) 50%, transparent);
}

.playlist-row {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  width: 100%;
  padding: 0.5rem;
  border: 0;
  border-radius: 0.65rem;
  background: transparent;
  color: inherit;
  cursor: pointer;
  text-align: left;
}

.playlist-row:hover {
  background: color-mix(in srgb, var(--lavender-blush) 8%, transparent);
}

.playlist-row.belongs {
  background: color-mix(in srgb, var(--light-green) 10%, transparent);
}

.playlist-row.belongs:hover {
  background: color-mix(in srgb, var(--light-green) 16%, transparent);
}

.playlist-row.belongs .pi-minus,
.playlist-row.belongs .action-label {
  color: var(--light-green);
}

.art {
  width: 2.25rem;
  height: 2.25rem;
  border-radius: 0.35rem;
  overflow: hidden;
  display: grid;
  place-items: center;
  background: color-mix(in srgb, var(--lavender-blush) 8%, transparent);
  flex-shrink: 0;
}

.art img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.name {
  flex: 1;
  min-width: 0;
  font-weight: 600;
  color: var(--lavender-blush);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.action-label {
  font-size: 0.75rem;
  font-weight: 600;
}

.empty {
  margin: 0;
  font-size: 0.85rem;
  color: color-mix(in srgb, var(--lavender-blush) 55%, transparent);
}
</style>
