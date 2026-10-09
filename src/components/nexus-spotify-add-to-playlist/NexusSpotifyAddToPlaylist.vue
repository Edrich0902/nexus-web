<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useSpotifyStore } from '@stores/spotify/spotify.store'
import NxIcon from '@design/components/NxIcon.vue'

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
const playlists = computed(() => spotify.playlists.filter((p) => p.is_owner || p.collaborative))

async function refreshMembership(): Promise<void> {
  if (!uri.value) {
    containingIds.value = new Set()
    return
  }
  membershipLoading.value = true
  containingIds.value = new Set(await spotify.playlistsContainingUri(uri.value))
  membershipLoading.value = false
}

watch(visible, (open) => {
  if (open) {
    newName.value = ''
    creating.value = false
    if (spotify.playlists.length === 0) void spotify.loadHub()
    void refreshMembership()
  } else {
    containingIds.value = new Set()
  }
})

async function toggle(playlistId: string): Promise<void> {
  if (!uri.value) return
  busyId.value = playlistId
  const next = new Set(containingIds.value)
  if (next.has(playlistId)) {
    if (await spotify.removeTrackFromPlaylist(playlistId, uri.value)) next.delete(playlistId)
  } else if (await spotify.addTracksToPlaylist(playlistId, [uri.value], { close: false })) {
    next.add(playlistId)
  }
  containingIds.value = next
  busyId.value = null
}

async function createAndAdd(): Promise<void> {
  if (!uri.value || !newName.value.trim()) return
  busyId.value = 'new'
  const playlist = await spotify.createPlaylist({ name: newName.value.trim() })
  if (playlist && (await spotify.addTracksToPlaylist(playlist.id, [uri.value], { close: false }))) {
    containingIds.value = new Set([...containingIds.value, playlist.id])
  }
  busyId.value = null
  creating.value = false
  newName.value = ''
}
</script>

<template>
  <Dialog v-model:visible="visible" modal header="Add to playlist" :style="{ width: 'min(28rem, 94vw)' }">
    <div class="add">
      <form v-if="creating" class="create" @submit.prevent="createAndAdd">
        <InputText v-model="newName" placeholder="Playlist name" aria-label="Playlist name" autofocus fluid />
        <Button type="submit" rounded label="Create" :loading="busyId === 'new'" :disabled="!newName.trim()" />
      </form>
      <button v-else type="button" class="row new" @click="creating = true">
        <span class="art"><NxIcon name="plus" :size="18" /></span>
        <span class="name">New playlist</span>
      </button>

      <p v-if="playlists.length === 0" class="empty">No playlists of yours yet. Create one above.</p>
      <div v-else class="list" :aria-busy="membershipLoading">
        <button
          v-for="p in playlists"
          :key="p.id"
          type="button"
          class="row"
          :class="{ in: containingIds.has(p.id) }"
          :disabled="busyId === p.id || membershipLoading"
          :aria-pressed="containingIds.has(p.id)"
          @click="toggle(p.id)"
        >
          <span class="art">
            <img v-if="p.image_url" :src="p.image_url" alt="" loading="lazy" />
            <NxIcon v-else name="queue" :size="16" />
          </span>
          <span class="name">{{ p.name }}</span>
          <span class="state">
            <ProgressSpinner v-if="busyId === p.id" style="width: 18px; height: 18px" stroke-width="5" />
            <NxIcon v-else :name="containingIds.has(p.id) ? 'check' : 'plus'" :size="16" />
          </span>
        </button>
      </div>
    </div>
  </Dialog>
</template>

<style scoped>
.add {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.create {
  display: flex;
  gap: 8px;
}

.list {
  display: flex;
  flex-direction: column;
  max-height: 22rem;
  overflow: auto;
}

.list[aria-busy='true'] {
  opacity: 0.6;
}

.row {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  padding: 8px;
  border: 0;
  border-radius: var(--r-md);
  background: transparent;
  color: var(--ink);
  font: inherit;
  text-align: left;
  cursor: pointer;
}

.row:hover:not(:disabled) {
  background: var(--tint);
}

.row:disabled {
  cursor: progress;
}

.art {
  flex: 0 0 40px;
  height: 40px;
  border-radius: var(--r-xs);
  overflow: hidden;
  display: grid;
  place-items: center;
  color: var(--ink-3);
  background: var(--tint-2);
}

.new .art {
  color: var(--acc);
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
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.state {
  display: grid;
  place-items: center;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  color: var(--ink-3);
}

.row.in .state {
  color: var(--acc-ink);
  background: var(--acc);
}

.empty {
  margin: 0;
  font-size: 13.5px;
  color: var(--ink-3);
}
</style>
