<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useConfirm } from 'primevue/useconfirm'
import DetailTemplate from '@design/templates/DetailTemplate.vue'
import type { ViewState } from '@design/templates/types'
import NxStage from '@design/components/NxStage.vue'
import NxIcon from '@design/components/NxIcon.vue'
import NxIconButton from '@design/components/NxIconButton.vue'
import NxEmptyState from '@design/components/NxEmptyState.vue'
import { usePaletteAmbient } from '@design/usePaletteAmbient'
import NexusSpotifyTrackRow from '@components/nexus-spotify-track-row/NexusSpotifyTrackRow.vue'
import { useSpotifyStore } from '@stores/spotify/spotify.store'
import type { SpotifyPlaylist } from '@/types/spotify/spotify'
import { plainText, relativeTime, totalDuration } from './listening'

const spotify = useSpotifyStore()
const route = useRoute()
const router = useRouter()
const confirm = useConfirm()

const playlist = ref<SpotifyPlaylist | null>(null)
const state = ref<ViewState>('loading')
const refreshing = ref(false)
const editOpen = ref(false)
const edit = ref({ name: '', description: '' })
const saving = ref(false)
let requestId = 0

const playlistId = computed(() => String(route.params.playlistId ?? ''))

usePaletteAmbient(() => playlist.value?.image_url)

async function load(refresh = false): Promise<void> {
  const current = ++requestId
  if (refresh) refreshing.value = true
  else state.value = 'loading'
  const data = await spotify.fetchPlaylist(playlistId.value, refresh)
  if (current !== requestId) return
  refreshing.value = false
  if (data) playlist.value = data
  if (!refresh) state.value = data ? 'ready' : 'error'
}

watch(playlistId, () => void load(), { immediate: true })

const items = computed(() => playlist.value?.items ?? [])
const tracks = computed(() => items.value.flatMap((i) => (i.track ? [i.track] : [])))

watch(tracks, (list) => void spotify.refreshLikedUris(list.map((t) => t.uri)))

const description = computed(() => plainText(playlist.value?.description))

const lede = computed(() => {
  const p = playlist.value
  if (!p) return ''
  const parts = [`${p.item_count} ${p.item_count === 1 ? 'track' : 'tracks'}`]
  if (tracks.value.length) parts.push(totalDuration(tracks.value))
  if (p.synced_at) parts.push(`synced ${relativeTime(p.synced_at)}`)
  return parts.join(' · ')
})

function openEdit(): void {
  if (!playlist.value) return
  edit.value = { name: playlist.value.name, description: description.value }
  editOpen.value = true
}

async function saveEdits(): Promise<void> {
  if (!playlist.value || !edit.value.name.trim()) return
  saving.value = true
  const updated = await spotify.updatePlaylist(playlist.value.id, {
    name: edit.value.name.trim(),
    description: edit.value.description.trim(),
  })
  saving.value = false
  if (updated) {
    playlist.value = { ...playlist.value, ...updated }
    editOpen.value = false
  }
}

function confirmUnfollow(event: Event): void {
  confirm.require({
    target: event.currentTarget as HTMLElement,
    message: playlist.value?.is_owner ? 'Delete this playlist from your Spotify?' : 'Unfollow this playlist?',
    rejectProps: { label: 'Cancel', severity: 'secondary', text: true },
    acceptProps: { label: playlist.value?.is_owner ? 'Delete' : 'Unfollow', severity: 'danger' },
    accept: async () => {
      if (!playlist.value) return
      if (await spotify.deletePlaylist(playlist.value.id)) await router.push({ name: 'spotify' })
    },
  })
}

async function removeTrack(uri: string, position: number): Promise<void> {
  if (!playlist.value) return
  if (await spotify.removePlaylistTrack(playlist.value.id, uri, position)) await load(true)
}
</script>

<template>
  <DetailTemplate
    :state="state"
    :back-to="{ name: 'spotify' }"
    back-label="Listening"
    error-title="Playlist not found"
    error-body="It may have been deleted, or Spotify could not be reached."
  >
    <template #stage>
      <NxStage :eyebrow="playlist?.is_owner ? 'Your playlist' : 'Playlist'" :title="playlist?.name ?? 'Playlist'">
        <template #visual>
          <img v-if="playlist?.image_url" :src="playlist.image_url" alt="" />
          <NxIcon v-else name="queue" :size="48" />
        </template>
        <template #lede>
          <p v-if="description" class="desc">{{ description }}</p>
          <span class="meta">{{ lede }}</span>
        </template>
        <template v-if="playlist" #actions>
          <Button
            rounded
            severity="contrast"
            label="Play"
            :disabled="spotify.controlBusy || !items.length"
            @click="spotify.playPlaylist(playlist.uri)"
          >
            <template #icon="{ class: iconClass }">
              <NxIcon name="play" :size="16" :class="iconClass" />
            </template>
          </Button>
          <Button
            rounded
            severity="secondary"
            label="Shuffle"
            :disabled="spotify.controlBusy || !items.length"
            @click="spotify.setShuffle(true).then(() => spotify.playPlaylist(playlist!.uri))"
          >
            <template #icon="{ class: iconClass }">
              <NxIcon name="shuffle" :size="16" :class="iconClass" />
            </template>
          </Button>
          <NxIconButton v-if="playlist.is_owner" icon="edit" variant="tint" label="Edit details" @click="openEdit" />
          <NxIconButton
            icon="refresh"
            variant="tint"
            label="Refresh from Spotify"
            :disabled="refreshing"
            @click="load(true)"
          />
          <NxIconButton
            icon="trash"
            variant="tint"
            :label="playlist.is_owner ? 'Delete playlist' : 'Unfollow playlist'"
            @click="confirmUnfollow"
          />
        </template>
      </NxStage>
    </template>

    <NxEmptyState
      v-if="!items.length"
      icon="queue"
      title="Nothing in here yet"
      body="Add tracks from search, the queue or any track's menu."
    />
    <div v-else :class="{ dim: refreshing }">
      <template v-for="item in items" :key="`${item.position}-${item.track?.id ?? 'gone'}`">
        <NexusSpotifyTrackRow
          v-if="item.track"
          :track="item.track"
          :index="item.position + 1"
          :meta="item.added_at ? relativeTime(item.added_at) : undefined"
          @play="spotify.playPlaylist(playlist!.uri, item.position)"
        >
          <template v-if="playlist?.is_owner" #trailing>
            <NxIconButton
              icon="minus"
              label="Remove from playlist"
              size="sm"
              @click="removeTrack(item.track.uri, item.position)"
            />
          </template>
        </NexusSpotifyTrackRow>
        <div v-else class="gone">
          <span class="num">{{ item.position + 1 }}</span>
          <span>Track no longer available</span>
        </div>
      </template>
    </div>
  </DetailTemplate>

  <Dialog v-model:visible="editOpen" modal header="Edit playlist" :style="{ width: 'min(30rem, 94vw)' }">
    <form id="edit-playlist" class="nx-form" @submit.prevent="saveEdits">
      <label class="f">
        <span>Name</span>
        <InputText v-model="edit.name" autofocus />
      </label>
      <label class="f">
        <span>Description</span>
        <Textarea v-model="edit.description" rows="3" auto-resize />
      </label>
    </form>
    <template #footer>
      <Button label="Cancel" text severity="secondary" @click="editOpen = false" />
      <Button
        type="submit"
        form="edit-playlist"
        rounded
        label="Save"
        :loading="saving"
        :disabled="!edit.name.trim()"
      />
    </template>
  </Dialog>
</template>

<style scoped>
.desc {
  margin: 0 0 6px;
}

.meta {
  font-size: 14px;
  color: var(--ink-3);
}

.gone {
  display: flex;
  gap: 14px;
  padding: 14px 6px;
  font-size: 13px;
  color: var(--ink-3);
  border-bottom: 1px solid var(--line);
}

.gone .num {
  width: 24px;
  text-align: center;
}

.dim {
  opacity: 0.55;
  transition: opacity 0.2s;
}
</style>
