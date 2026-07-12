<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useSpotifyStore } from '@stores/spotify/spotify.store'

const spotify = useSpotifyStore()
const router = useRouter()
const seekPreview = ref<number | null>(null)
const volumePreview = ref<number | null>(null)
const localProgressMs = ref(0)
const deviceMenu = ref<{
  toggle: (event: Event) => void
  hide: () => void
} | null>(null)

let tickTimer: ReturnType<typeof setInterval> | null = null
let lastTickAt = 0

onMounted(() => {
  spotify.startPlayerPolling()
  void spotify.refreshDevices()
  startProgressTicker()
})

onUnmounted(() => {
  spotify.stopPlayerPolling()
  stopProgressTicker()
})

const item = computed(() => spotify.player?.item ?? null)
const device = computed(() => spotify.player?.device ?? null)
const isPlaying = computed(() => spotify.player?.is_playing === true)
const durationMs = computed(() => item.value?.duration_ms ?? 0)
const progressMs = computed(
  () => seekPreview.value ?? localProgressMs.value,
)

const artUrl = computed(() => {
  const images = item.value?.album?.images
  if (!images?.length) return null
  return images[0]?.url ?? null
})

const artistNames = computed(() => {
  const artists = item.value?.artists ?? []
  return artists.map((a) => a.name).filter(Boolean).join(', ') || 'Unknown artist'
})

const artistLinks = computed(() =>
  (item.value?.artists ?? []).filter(
    (a): a is { id: string; name: string } =>
      typeof a.id === 'string' && Boolean(a.name),
  ),
)

const progressLabel = computed(() => formatTime(progressMs.value))
const durationLabel = computed(() => formatTime(durationMs.value))

const volumePercent = computed(() => {
  if (volumePreview.value !== null) return volumePreview.value
  return spotify.player?.device?.volume_percent ?? 50
})

const volumeAvailable = computed(
  () => spotify.player?.device != null && !spotify.controlBusy,
)

/** Resync local clock whenever Spotify reports a new progress snapshot. */
watch(
  () => [
    spotify.player?.progress_ms,
    spotify.player?.item?.uri,
    spotify.player?.is_playing,
  ] as const,
  ([progress, , playing]) => {
    if (seekPreview.value !== null) return
    if (typeof progress === 'number') {
      localProgressMs.value = progress
      lastTickAt = performance.now()
    } else if (!playing) {
      localProgressMs.value = 0
    }
  },
  { immediate: true },
)

function startProgressTicker(): void {
  stopProgressTicker()
  lastTickAt = performance.now()
  tickTimer = setInterval(() => {
    if (seekPreview.value !== null) return
    if (!isPlaying.value) {
      lastTickAt = performance.now()
      return
    }

    const now = performance.now()
    const delta = now - lastTickAt
    lastTickAt = now
    const duration = durationMs.value
    const next = localProgressMs.value + delta
    localProgressMs.value =
      duration > 0 ? Math.min(next, duration) : Math.max(0, next)
  }, 250)
}

function stopProgressTicker(): void {
  if (tickTimer) {
    clearInterval(tickTimer)
    tickTimer = null
  }
}

function formatTime(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000))
  const m = Math.floor(total / 60)
  const s = total % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

function onSeekInput(value: number): void {
  seekPreview.value = value
}

async function onSeekCommit(value: number): Promise<void> {
  seekPreview.value = value
  localProgressMs.value = value
  lastTickAt = performance.now()
  await spotify.seek(value)
  seekPreview.value = null
}

function onVolumeInput(value: number): void {
  volumePreview.value = value
}

async function onVolumeCommit(value: number): Promise<void> {
  volumePreview.value = value
  await spotify.setVolume(value)
  volumePreview.value = null
}

async function onDeviceSelect(deviceId: string): Promise<void> {
  deviceMenu.value?.hide()
  await spotify.transfer(deviceId, true)
}

function openDeviceMenu(event: Event): void {
  void spotify.refreshDevices()
  deviceMenu.value?.toggle(event)
}

function cycleRepeat(): void {
  const current = spotify.player?.repeat_state ?? 'off'
  const next =
    current === 'off' ? 'context' : current === 'context' ? 'track' : 'off'
  void spotify.setRepeat(next)
}

/** PrimeVue design tokens — keep handle ring + inner disc proportional. */
const seekSliderDt = {
  track: {
    size: '4px',
  },
  range: {
    background: '{meadowGreen.500}',
  },
  handle: {
    width: '14px',
    height: '14px',
    background: '{meadowGreen.500}',
    hoverBackground: '{meadowGreen.400}',
    content: {
      width: '10px',
      height: '10px',
      background: '{lavenderBlush.50}',
      hoverBackground: '{lavenderBlush.50}',
      shadow: 'none',
    },
  },
} as const

const volumeSliderDt = {
  track: {
    size: '3px',
  },
  range: {
    background: '{meadowGreen.500}',
  },
  handle: {
    width: '12px',
    height: '12px',
    background: '{meadowGreen.500}',
    hoverBackground: '{meadowGreen.400}',
    content: {
      width: '8px',
      height: '8px',
      background: '{lavenderBlush.50}',
      hoverBackground: '{lavenderBlush.50}',
      shadow: 'none',
    },
  },
} as const
</script>

<template>
  <section class="player-card">
    <div class="art-plane">
      <img
        v-if="artUrl"
        :src="artUrl"
        :alt="item?.album?.name ?? item?.name ?? 'Album art'"
        class="art-image"
      />
      <div v-else class="art-empty">
        <span class="pi pi-headphones text-3xl" />
      </div>
      <div class="art-veil" />
    </div>

    <div class="player-body">
      <div class="status-row">
        <span class="now-badge">{{ isPlaying ? 'Now playing' : 'Ready' }}</span>
        <span v-if="device" class="device-label">
          <span class="pi pi-wifi" />
          Playing on {{ device.name }}
        </span>
        <span v-else class="device-label muted">
          {{ spotify.player?.message ?? 'No active device — open Spotify somewhere' }}
        </span>
      </div>

      <h2 class="track-title">
        {{ item?.name ?? 'Nothing playing' }}
      </h2>
      <p class="track-artist">
        <template v-if="item && artistLinks.length">
          <template v-for="(artist, index) in artistLinks" :key="artist.id">
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
            <span v-if="index < artistLinks.length - 1">, </span>
          </template>
        </template>
        <template v-else>
          {{ item ? artistNames : 'Start playback on a Spotify device' }}
        </template>
      </p>

      <div class="transport">
        <Button
          v-tooltip.top="'Previous'"
          type="button"
          icon="pi pi-step-backward"
          rounded
          text
          severity="secondary"
          class="ctrl-btn"
          :disabled="spotify.controlBusy || !item"
          aria-label="Previous"
          @click="spotify.previous()"
        />
        <Button
          v-tooltip.top="isPlaying ? 'Pause' : 'Play'"
          type="button"
          :icon="isPlaying ? 'pi pi-pause' : 'pi pi-play'"
          rounded
          class="ctrl-btn play-btn"
          :disabled="spotify.controlBusy"
          :aria-label="isPlaying ? 'Pause' : 'Play'"
          @click="spotify.togglePlayPause()"
        />
        <Button
          v-tooltip.top="'Next'"
          type="button"
          icon="pi pi-step-forward"
          rounded
          text
          severity="secondary"
          class="ctrl-btn"
          :disabled="spotify.controlBusy || !item"
          aria-label="Next"
          @click="spotify.next()"
        />

        <div class="seek-wrap">
          <Slider
            :model-value="progressMs"
            :min="0"
            :max="Math.max(durationMs, 1)"
            :disabled="!item || spotify.controlBusy"
            :dt="seekSliderDt"
            class="seek-slider"
            @update:model-value="onSeekInput($event as number)"
            @slideend="onSeekCommit(($event as { value: number }).value)"
          />
          <div class="times">
            <span>{{ progressLabel }}</span>
            <span>{{ durationLabel }}</span>
          </div>
        </div>
      </div>

      <div class="extras">
        <Button
          v-tooltip.top="spotify.isLiked ? 'Remove from Liked Songs' : 'Add to Liked Songs'"
          type="button"
          :icon="spotify.isLiked ? 'pi pi-heart-fill' : 'pi pi-heart'"
          rounded
          text
          :severity="spotify.isLiked ? 'success' : 'secondary'"
          class="extra-btn"
          :class="{ active: spotify.isLiked }"
          :disabled="!item || spotify.controlBusy"
          :aria-label="spotify.isLiked ? 'Unlike' : 'Like'"
          @click="spotify.toggleLike()"
        />
        <Button
          v-tooltip.top="'Add to playlist'"
          type="button"
          icon="pi pi-plus"
          rounded
          text
          severity="secondary"
          class="extra-btn"
          :disabled="!item?.uri || spotify.controlBusy"
          aria-label="Add to playlist"
          @click="item?.uri && spotify.openAddToPlaylist(item.uri)"
        />
        <Button
          v-tooltip.top="'Shuffle'"
          type="button"
          icon="pi pi-arrow-right-arrow-left"
          rounded
          text
          :severity="spotify.player?.shuffle_state ? 'success' : 'secondary'"
          class="extra-btn"
          :class="{ active: spotify.player?.shuffle_state }"
          :disabled="spotify.controlBusy"
          aria-label="Shuffle"
          @click="spotify.setShuffle(!spotify.player?.shuffle_state)"
        />
        <Button
          v-tooltip.top="`Repeat: ${spotify.player?.repeat_state ?? 'off'}`"
          type="button"
          icon="pi pi-replay"
          rounded
          text
          :severity="
            (spotify.player?.repeat_state ?? 'off') !== 'off'
              ? 'success'
              : 'secondary'
          "
          class="extra-btn"
          :class="{
            active: (spotify.player?.repeat_state ?? 'off') !== 'off',
          }"
          :disabled="spotify.controlBusy"
          aria-label="Repeat"
          @click="cycleRepeat()"
        />
        <Button
          v-tooltip.top="'Choose device'"
          type="button"
          icon="pi pi-desktop"
          :label="device?.name ?? 'No device'"
          rounded
          text
          severity="secondary"
          class="extra-btn device-btn"
          aria-label="Choose device"
          @click="openDeviceMenu"
        />

        <div class="volume-wrap" :class="{ disabled: !volumeAvailable }">
          <span
            class="pi"
            :class="
              volumePercent === 0
                ? 'pi-volume-off'
                : volumePercent < 50
                  ? 'pi-volume-down'
                  : 'pi-volume-up'
            "
          />
          <Slider
            :model-value="volumePercent"
            :min="0"
            :max="100"
            :disabled="!volumeAvailable"
            :dt="volumeSliderDt"
            class="volume-slider"
            @update:model-value="onVolumeInput($event as number)"
            @slideend="onVolumeCommit(($event as { value: number }).value)"
          />
          <span class="volume-label">{{ volumePercent }}%</span>
        </div>
      </div>
    </div>

    <Popover ref="deviceMenu">
      <div class="device-menu">
        <p class="device-menu-title">Playback devices</p>
        <p v-if="spotify.devices.length === 0" class="device-empty">
          No devices found. Open Spotify on a phone or desktop.
        </p>
        <Button
          v-for="d in spotify.devices"
          :key="d.id"
          type="button"
          text
          fluid
          class="device-item"
          :class="{ active: d.is_active }"
          @click="onDeviceSelect(d.id)"
        >
          <span
            class="pi"
            :class="d.type === 'Smartphone' ? 'pi-mobile' : 'pi-desktop'"
          />
          <span class="device-item-text">
            <span class="device-item-name">{{ d.name }}</span>
            <span class="device-item-type">{{ d.type }}</span>
          </span>
          <span v-if="d.is_active" class="pi pi-check" />
        </Button>
      </div>
    </Popover>
  </section>
</template>

<style scoped>
.player-card {
  display: grid;
  grid-template-columns: minmax(11rem, 16rem) 1fr;
  gap: 1.25rem;
  padding: 1rem;
  border-radius: 1rem;
  background: var(--spotify-card-surface);
  border: 1px solid color-mix(in srgb, var(--lavender-blush) 10%, transparent);
  overflow: hidden;
  min-height: 14rem;
}

@media (max-width: 820px) {
  .player-card {
    grid-template-columns: 1fr;
  }
}

.art-plane {
  position: relative;
  border-radius: 0.85rem;
  overflow: hidden;
  min-height: 12rem;
  background: color-mix(in srgb, var(--coffee-bean) 70%, transparent);
}

.art-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  animation: art-in 0.45s ease;
}

.art-empty {
  width: 100%;
  height: 100%;
  min-height: 12rem;
  display: grid;
  place-items: center;
  color: color-mix(in srgb, var(--lavender-blush) 35%, transparent);
}

.art-veil {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    to top,
    color-mix(in srgb, var(--coffee-bean) 35%, transparent),
    transparent 45%
  );
  pointer-events: none;
}

.player-body {
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 0.55rem;
  min-width: 0;
  padding: 0.25rem 0.35rem 0.25rem 0;
}

.status-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.65rem 1rem;
}

.now-badge {
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--light-green);
}

.device-label {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.8rem;
  color: color-mix(in srgb, var(--lavender-blush) 72%, transparent);
}

.device-label.muted {
  color: color-mix(in srgb, var(--lavender-blush) 48%, transparent);
}

.track-title {
  margin: 0;
  font-size: clamp(1.35rem, 2.4vw, 1.85rem);
  font-weight: 700;
  letter-spacing: -0.02em;
  color: var(--lavender-blush);
  line-height: 1.15;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.track-artist {
  margin: 0;
  font-size: 1rem;
  color: var(--meadow-green);
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
  text-decoration: underline;
}

.transport {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  margin-top: 0.35rem;
  margin-bottom: 0.85rem;
}

.ctrl-btn {
  flex-shrink: 0;
}

.play-btn {
  width: 3rem !important;
  height: 3rem !important;
}

.seek-wrap {
  flex: 1;
  min-width: 0;
  position: relative;
  display: flex;
  align-items: center;
  height: 3rem;
  padding-inline: 0.35rem;
}

.seek-slider {
  width: 100%;
}

.times {
  position: absolute;
  left: 0.35rem;
  right: 0.35rem;
  top: calc(100% - 0.15rem);
  display: flex;
  justify-content: space-between;
  font-size: 0.7rem;
  font-variant-numeric: tabular-nums;
  color: color-mix(in srgb, var(--lavender-blush) 45%, transparent);
  pointer-events: none;
}

.extras {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.15rem;
  margin-top: 0.25rem;
}

.extra-btn.active {
  background: color-mix(in srgb, var(--light-green) 12%, transparent) !important;
}

.device-btn :deep(.p-button-label) {
  font-size: 0.75rem;
  font-weight: 600;
  max-width: 9rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.volume-wrap {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  height: 2rem;
  padding: 0 0.7rem;
  margin-left: 0.25rem;
  border-radius: 999px;
  border: 1px solid color-mix(in srgb, var(--lavender-blush) 12%, transparent);
  background: color-mix(in srgb, var(--coffee-bean) 35%, transparent);
  color: color-mix(in srgb, var(--lavender-blush) 75%, transparent);
  min-width: 9.5rem;
}

.volume-wrap.disabled {
  opacity: 0.45;
}

.volume-slider {
  flex: 1;
  min-width: 4.5rem;
}

.volume-label {
  font-size: 0.7rem;
  font-variant-numeric: tabular-nums;
  min-width: 2.1rem;
  text-align: right;
}

.device-menu {
  min-width: 14rem;
  max-width: 18rem;
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.device-menu-title {
  margin: 0 0 0.25rem;
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: color-mix(in srgb, var(--lavender-blush) 55%, transparent);
}

.device-empty {
  margin: 0;
  font-size: 0.85rem;
  color: color-mix(in srgb, var(--lavender-blush) 55%, transparent);
}

.device-item {
  display: flex !important;
  justify-content: flex-start !important;
  gap: 0.65rem;
  width: 100%;
  padding: 0.55rem 0.45rem !important;
  text-align: left;
}

.device-item.active,
.device-item:hover {
  background: color-mix(in srgb, var(--light-green) 12%, transparent) !important;
}

.device-item-text {
  display: flex;
  flex-direction: column;
  min-width: 0;
  flex: 1;
  align-items: flex-start;
}

.device-item-name {
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--lavender-blush);
}

.device-item-type {
  font-size: 0.75rem;
  color: color-mix(in srgb, var(--lavender-blush) 50%, transparent);
  font-weight: 400;
}

@keyframes art-in {
  from {
    opacity: 0;
    transform: scale(1.04);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}
</style>
