<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import NexusImage from '@components/nexus-image/NexusImage.vue'
import NexusSpotifyPlayingIndicator from '@components/nexus-spotify-playing-indicator/NexusSpotifyPlayingIndicator.vue'
import NxIcon from '@design/components/NxIcon.vue'
import NxIconButton from '@design/components/NxIconButton.vue'
import { useSpotifyKeyboardShortcuts } from '@/composables/useSpotifyKeyboardShortcuts'
import { useSpotifyProgress } from '@/composables/useSpotifyProgress'
import { useSpotifyStore } from '@stores/spotify/spotify.store'

const spotify = useSpotifyStore()
const router = useRouter()

useSpotifyKeyboardShortcuts()

const { progressMs, durationMs, progressLabel, durationLabel, onSeekInput, onSeekCommit } =
  useSpotifyProgress()

const panelEl = ref<HTMLElement | null>(null)
const volumePreview = ref<number | null>(null)
const deviceMenu = ref<{ toggle: (event: Event) => void; hide: () => void } | null>(null)
const volumeMenu = ref<{ toggle: (event: Event) => void } | null>(null)

const item = computed(() => spotify.player?.item ?? null)
const device = computed(() => spotify.player?.device ?? null)
const isPlaying = computed(() => spotify.player?.is_playing === true)
const artUrl = computed(() => item.value?.album?.images?.[0]?.url ?? null)
const trackName = computed(() => item.value?.name ?? 'Unknown track')
const artistLinks = computed(() =>
  (item.value?.artists ?? []).filter(
    (a): a is { id: string; name: string } => typeof a.id === 'string' && Boolean(a.name),
  ),
)
const artistNames = computed(
  () => (item.value?.artists ?? []).map((a) => a.name).filter(Boolean).join(', ') || 'Unknown artist',
)

const open = computed(() => spotify.dockExpanded && spotify.hasActiveTrack)

const volumePercent = computed(() => volumePreview.value ?? device.value?.volume_percent ?? 50)
const volumeIcon = computed(() => {
  if (volumePercent.value === 0) return 'volume-off' as const
  return volumePercent.value < 50 ? ('volume-low' as const) : ('volume' as const)
})
const repeatState = computed(() => spotify.player?.repeat_state ?? 'off')

function close(): void {
  spotify.setDockExpanded(false)
}

function onDocumentPointerDown(event: PointerEvent): void {
  if (!open.value) return
  const target = event.target
  if (!(target instanceof Element)) return
  if (panelEl.value?.contains(target)) return
  if (target.closest('[data-player-toggle], .p-popover')) return
  close()
}

function onDocumentKeydown(event: KeyboardEvent): void {
  if (event.key === 'Escape' && open.value) close()
}

function openDeviceMenu(event: Event): void {
  void spotify.refreshDevices()
  deviceMenu.value?.toggle(event)
}

async function onDeviceSelect(deviceId: string): Promise<void> {
  deviceMenu.value?.hide()
  await spotify.transfer(deviceId, true)
}

async function onVolumeCommit(value: number): Promise<void> {
  volumePreview.value = value
  await spotify.setVolume(value)
  volumePreview.value = null
}

function cycleRepeat(): void {
  const next =
    repeatState.value === 'off' ? 'context' : repeatState.value === 'context' ? 'track' : 'off'
  void spotify.setRepeat(next)
}

function openHub(): void {
  close()
  void router.push({ name: 'spotify' })
}

function openArtist(artistId: string): void {
  close()
  void router.push({ name: 'spotify-artist', params: { artistId } })
}

watch(
  () => spotify.hasActiveTrack,
  (active) => {
    if (!active) close()
  },
)

onMounted(() => {
  spotify.startPlayerPolling()
  document.addEventListener('pointerdown', onDocumentPointerDown)
  document.addEventListener('keydown', onDocumentKeydown)
})

onUnmounted(() => {
  spotify.stopPlayerPolling()
  document.removeEventListener('pointerdown', onDocumentPointerDown)
  document.removeEventListener('keydown', onDocumentKeydown)
})

const sliderDt = {
  track: { size: '3px', background: 'var(--line-strong)' },
  range: { background: 'var(--ink)' },
  handle: {
    width: '12px',
    height: '12px',
    background: 'var(--ink)',
    hoverBackground: 'var(--ink)',
    content: { width: '8px', height: '8px', background: 'var(--ink)', hoverBackground: 'var(--ink)', shadow: 'none' },
  },
} as const
</script>

<template>
  <Teleport to="body">
    <Transition name="panel-pop">
      <section
        v-if="open"
        ref="panelEl"
        class="np-panel"
        role="region"
        aria-label="Spotify player"
      >
        <div v-if="artUrl" class="bloom" :style="{ backgroundImage: `url('${artUrl}')` }" aria-hidden="true" />
        <div class="veil" aria-hidden="true" />

        <div class="np-body">
          <div class="np-head">
            <div class="np-art">
              <NexusImage v-if="artUrl" :src="artUrl" :alt="`${trackName} album art`" size="fill" fit="cover" />
              <NxIcon v-else name="headphones" :size="22" />
            </div>
            <div class="np-meta">
              <span class="np-badge">
                <NexusSpotifyPlayingIndicator :active="isPlaying" />
                {{ isPlaying ? 'Now playing' : 'Paused' }}
              </span>
              <span class="np-title">{{ trackName }}</span>
              <span class="np-artists">
                <template v-if="artistLinks.length">
                  <template v-for="(artist, index) in artistLinks" :key="artist.id">
                    <button type="button" class="artist-link" @click="openArtist(artist.id)">
                      {{ artist.name }}</button
                    ><span v-if="index < artistLinks.length - 1">, </span>
                  </template>
                </template>
                <template v-else>{{ artistNames }}</template>
              </span>
            </div>
            <NxIconButton icon="chevron-down" label="Close player" size="sm" @click="close" />
          </div>

          <div class="np-seek">
            <Slider
              :model-value="progressMs"
              :min="0"
              :max="Math.max(durationMs, 1)"
              :disabled="!item || spotify.controlBusy"
              :dt="sliderDt"
              aria-label="Seek"
              @update:model-value="onSeekInput($event as number)"
              @slideend="onSeekCommit(($event as { value: number }).value)"
            />
            <div class="np-times nx-mono">
              <span>{{ progressLabel }}</span>
              <span>{{ durationLabel }}</span>
            </div>
          </div>

          <div class="np-transport">
            <NxIconButton
              icon="heart"
              :label="spotify.isLiked ? 'Remove from Liked Songs' : 'Add to Liked Songs'"
              size="sm"
              :active="spotify.isLiked"
              :disabled="!item || spotify.controlBusy"
              @click="spotify.toggleLike()"
            />
            <NxIconButton
              icon="previous"
              label="Previous"
              :disabled="spotify.controlBusy || !item"
              @click="spotify.previous()"
            />
            <NxIconButton
              :icon="isPlaying ? 'pause' : 'play'"
              :label="isPlaying ? 'Pause' : 'Play'"
              variant="ink"
              size="lg"
              :disabled="spotify.controlBusy"
              @click="spotify.togglePlayPause()"
            />
            <NxIconButton
              icon="next"
              label="Next"
              :disabled="spotify.controlBusy || !item"
              @click="spotify.next()"
            />
            <NxIconButton
              icon="shuffle"
              label="Shuffle"
              size="sm"
              :active="Boolean(spotify.player?.shuffle_state)"
              :disabled="spotify.controlBusy"
              @click="spotify.setShuffle(!spotify.player?.shuffle_state)"
            />
          </div>

          <div class="np-foot">
            <button type="button" class="np-device" @click="openDeviceMenu">
              <NxIcon name="monitor" :size="15" />
              <span>{{ device?.name ?? 'No device' }}</span>
            </button>
            <span class="spacer" />
            <NxIconButton
              :icon="repeatState === 'track' ? 'repeat-one' : 'repeat'"
              :label="`Repeat: ${repeatState}`"
              size="sm"
              :active="repeatState !== 'off'"
              :disabled="spotify.controlBusy"
              @click="cycleRepeat()"
            />
            <NxIconButton
              :icon="volumeIcon"
              :label="`Volume ${volumePercent}%`"
              size="sm"
              :disabled="!device || spotify.controlBusy"
              @click="volumeMenu?.toggle($event)"
            />
            <NxIconButton icon="external-link" label="Open Listening" size="sm" @click="openHub" />
          </div>
        </div>
      </section>
    </Transition>

    <Popover ref="volumeMenu">
      <div class="volume-pop">
        <NxIcon :name="volumeIcon" />
        <Slider
          :model-value="volumePercent"
          :min="0"
          :max="100"
          :disabled="!device || spotify.controlBusy"
          :dt="sliderDt"
          class="volume-slider"
          aria-label="Volume"
          @update:model-value="volumePreview = $event as number"
          @slideend="onVolumeCommit(($event as { value: number }).value)"
        />
        <span class="volume-label num">{{ volumePercent }}%</span>
      </div>
    </Popover>

    <Popover ref="deviceMenu">
      <div class="device-menu">
        <p class="nx-label device-menu-title">Play on</p>
        <p v-if="spotify.devices.length === 0" class="device-empty">
          No devices found. Open Spotify on a phone or computer.
        </p>
        <button
          v-for="d in spotify.devices"
          :key="d.id"
          type="button"
          class="device-item"
          :class="{ active: d.is_active }"
          @click="onDeviceSelect(d.id)"
        >
          <NxIcon :name="d.type === 'Smartphone' ? 'smartphone' : 'monitor'" />
          <span class="device-item-text">
            <span class="device-item-name">{{ d.name }}</span>
            <span class="device-item-type">{{ d.type }}</span>
          </span>
          <NxIcon v-if="d.is_active" name="check" />
        </button>
      </div>
    </Popover>
  </Teleport>
</template>

<style scoped>
.np-panel {
  position: fixed;
  left: 50%;
  bottom: 96px;
  z-index: 70;
  width: 360px;
  transform: translateX(-50%);
  border-radius: var(--r-xxl);
  overflow: hidden;
  background: var(--overlay);
  border: 1px solid var(--line);
  box-shadow: 0 30px 70px rgba(0, 0, 0, 0.5);
}

.bloom {
  position: absolute;
  inset: -35%;
  background-size: cover;
  background-position: center;
  filter: blur(40px) saturate(1.8);
  opacity: 0.45;
  pointer-events: none;
}

.veil {
  position: absolute;
  inset: 0;
  pointer-events: none;
  background: linear-gradient(
    160deg,
    color-mix(in srgb, var(--amb) 55%, transparent),
    color-mix(in srgb, var(--amb) 88%, transparent)
  );
}

.np-body {
  position: relative;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.np-head {
  display: grid;
  grid-template-columns: 72px 1fr auto;
  gap: 14px;
  align-items: center;
}

.np-art {
  width: 72px;
  height: 72px;
  border-radius: 12px;
  overflow: hidden;
  display: grid;
  place-items: center;
  background: var(--tint-2);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.35);
}

.np-art :deep(.nexus-image) {
  width: 100%;
  height: 100%;
}

.np-meta {
  display: flex;
  flex-direction: column;
  gap: 3px;
  min-width: 0;
}

.np-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 11.5px;
  font-weight: 600;
  color: var(--acc);
}

.np-badge :deep(.eq) {
  color: var(--acc);
}

.np-title {
  font-family: var(--font-serif);
  font-size: 24px;
  line-height: 1.1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.np-artists {
  font-size: 13px;
  color: var(--ink-2);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.artist-link {
  border: 0;
  padding: 0;
  background: transparent;
  color: inherit;
  font: inherit;
  cursor: pointer;
}

.artist-link:hover {
  color: var(--ink);
  text-decoration: underline;
}

.np-times {
  display: flex;
  justify-content: space-between;
  margin-top: 6px;
  font-size: 11.5px;
  color: var(--ink-3);
}

.np-transport {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.np-foot {
  display: flex;
  align-items: center;
  gap: 2px;
}

.np-device {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  max-width: 150px;
  padding: 6px 10px;
  border: 0;
  border-radius: 999px;
  background: var(--tint);
  color: var(--ink-2);
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
}

.np-device span {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.np-device:hover {
  background: var(--tint-2);
  color: var(--ink);
}

.spacer {
  flex: 1;
}

.volume-pop {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 13rem;
  color: var(--ink-2);
}

.volume-slider {
  flex: 1;
}

.volume-label {
  font-size: 12px;
  min-width: 2.4rem;
  text-align: right;
}

.device-menu {
  min-width: 14rem;
  max-width: 18rem;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.device-menu-title {
  margin: 0 0 6px;
  font-size: 11.5px;
}

.device-empty {
  margin: 0;
  font-size: 13px;
  color: var(--ink-3);
}

.device-item {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 8px;
  border: 0;
  border-radius: var(--r-sm);
  background: transparent;
  color: var(--ink);
  text-align: left;
  cursor: pointer;
}

.device-item.active,
.device-item:hover {
  background: var(--tint-2);
}

.device-item-text {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-width: 0;
}

.device-item-name {
  font-size: 14px;
  font-weight: 600;
}

.device-item-type {
  font-size: 12px;
  color: var(--ink-3);
}

.panel-pop-enter-active {
  transition:
    opacity 0.25s ease,
    transform 0.35s var(--ease);
}

.panel-pop-leave-active {
  transition:
    opacity 0.18s ease,
    transform 0.2s ease;
}

.panel-pop-enter-from,
.panel-pop-leave-to {
  opacity: 0;
  transform: translate(-50%, 12px) scale(0.96);
}

@media (max-width: 640px) {
  .np-panel {
    left: 10px;
    right: 10px;
    width: auto;
    transform: none;
    bottom: calc(118px + env(safe-area-inset-bottom));
  }

  .panel-pop-enter-from,
  .panel-pop-leave-to {
    transform: translateY(12px);
  }
}
</style>
