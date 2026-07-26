<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import NexusImage from '@components/nexus-image/NexusImage.vue'
import NexusSpotifyPlayingIndicator from '@components/nexus-spotify-playing-indicator/NexusSpotifyPlayingIndicator.vue'
import { useSpotifyKeyboardShortcuts } from '@/composables/useSpotifyKeyboardShortcuts'
import { useSpotifyProgress } from '@/composables/useSpotifyProgress'
import { useSpotifyStore } from '@stores/spotify/spotify.store'

/** How long the dock lingers after playback stops, so pausing never hides it. */
const KEEP_ALIVE_MS = 90_000

const spotify = useSpotifyStore()
const route = useRoute()
const router = useRouter()

useSpotifyKeyboardShortcuts()

const {
  progressMs,
  durationMs,
  progressLabel,
  durationLabel,
  onSeekInput,
  onSeekCommit,
} = useSpotifyProgress()

const hovered = ref(false)
const keepAlive = ref(false)
const titleOverflows = ref(false)
const dockEl = ref<HTMLElement | null>(null)
const titleViewport = ref<HTMLElement | null>(null)
const titleText = ref<HTMLElement | null>(null)
const volumePreview = ref<number | null>(null)
const deviceMenu = ref<{ toggle: (event: Event) => void; hide: () => void } | null>(
  null,
)
const volumeMenu = ref<{ toggle: (event: Event) => void } | null>(null)

let keepAliveTimer: ReturnType<typeof setTimeout> | null = null

const item = computed(() => spotify.player?.item ?? null)
const device = computed(() => spotify.player?.device ?? null)
const isPlaying = computed(() => spotify.player?.is_playing === true)

const artUrl = computed(() => item.value?.album?.images?.[0]?.url ?? null)

const trackName = computed(() => item.value?.name ?? 'Unknown track')

const artistNames = computed(() => {
  const names = (item.value?.artists ?? []).map((a) => a.name).filter(Boolean)
  return names.join(', ') || 'Unknown artist'
})

const artistLinks = computed(() =>
  (item.value?.artists ?? []).filter(
    (a): a is { id: string; name: string } =>
      typeof a.id === 'string' && Boolean(a.name),
  ),
)

const volumePercent = computed(
  () => volumePreview.value ?? device.value?.volume_percent ?? 50,
)

const volumeIcon = computed(() => {
  if (volumePercent.value === 0) return 'pi pi-volume-off'
  return volumePercent.value < 50 ? 'pi pi-volume-down' : 'pi pi-volume-up'
})

const repeatState = computed(() => spotify.player?.repeat_state ?? 'off')

const onSpotifyRoute = computed(() =>
  String(route.name ?? '').startsWith('spotify'),
)

/**
 * Entering the Spotify hub folds the dock back to its FAB — the full player is
 * already on screen — without overwriting the stored preference.
 */
const routeSuppressed = ref(false)
watch(onSpotifyRoute, (active) => {
  routeSuppressed.value = active
}, { immediate: true })

const expanded = computed(
  () => spotify.dockExpanded && !routeSuppressed.value,
)

const visible = computed(
  () => spotify.hasActiveTrack && (isPlaying.value || keepAlive.value),
)

function clearKeepAliveTimer(): void {
  if (keepAliveTimer) {
    clearTimeout(keepAliveTimer)
    keepAliveTimer = null
  }
}

function refreshKeepAlive(): void {
  if (isPlaying.value) {
    keepAlive.value = true
    clearKeepAliveTimer()
    return
  }
  if (!keepAlive.value) return
  // Never yank the dock out from under an open card or a hovering cursor.
  if (expanded.value || hovered.value) {
    clearKeepAliveTimer()
    return
  }
  if (keepAliveTimer) return
  keepAliveTimer = setTimeout(() => {
    keepAlive.value = false
    keepAliveTimer = null
  }, KEEP_ALIVE_MS)
}

watch(
  [isPlaying, expanded, hovered],
  () => {
    refreshKeepAlive()
  },
  { immediate: true },
)

watch(
  () => spotify.hasActiveTrack,
  (active) => {
    if (!active) {
      keepAlive.value = false
      clearKeepAliveTimer()
    }
  },
)

watch(
  () => [trackName.value, visible.value, expanded.value] as const,
  () => {
    void measureTitle()
  },
)

async function measureTitle(): Promise<void> {
  await nextTick()
  const viewport = titleViewport.value
  const text = titleText.value
  if (!viewport || !text) {
    titleOverflows.value = false
    return
  }
  titleOverflows.value = text.scrollWidth - viewport.clientWidth > 2
}

function toggleExpanded(): void {
  if (expanded.value) {
    spotify.setDockExpanded(false)
    return
  }
  routeSuppressed.value = false
  spotify.setDockExpanded(true)
}

function collapse(): void {
  spotify.setDockExpanded(false)
}

function onDocumentPointerDown(event: PointerEvent): void {
  if (!expanded.value) return
  const target = event.target
  if (!(target instanceof Node)) return
  if (dockEl.value?.contains(target)) return
  // Device / volume popovers teleport to body but belong to the dock.
  if (target instanceof Element && target.closest('.p-popover')) return
  collapse()
}

function onDocumentKeydown(event: KeyboardEvent): void {
  if (event.key === 'Escape' && expanded.value) collapse()
}

function openDeviceMenu(event: Event): void {
  void spotify.refreshDevices()
  deviceMenu.value?.toggle(event)
}

async function onDeviceSelect(deviceId: string): Promise<void> {
  deviceMenu.value?.hide()
  await spotify.transfer(deviceId, true)
}

function onVolumeInput(value: number): void {
  volumePreview.value = value
}

async function onVolumeCommit(value: number): Promise<void> {
  volumePreview.value = value
  await spotify.setVolume(value)
  volumePreview.value = null
}

function cycleRepeat(): void {
  const next =
    repeatState.value === 'off'
      ? 'context'
      : repeatState.value === 'context'
        ? 'track'
        : 'off'
  void spotify.setRepeat(next)
}

function openHub(): void {
  void router.push({ name: 'spotify' })
}

function openArtist(artistId: string): void {
  void router.push({ name: 'spotify-artist', params: { artistId } })
}

onMounted(() => {
  spotify.startPlayerPolling()
  document.addEventListener('pointerdown', onDocumentPointerDown)
  document.addEventListener('keydown', onDocumentKeydown)
  window.addEventListener('resize', measureTitle)
})

onUnmounted(() => {
  spotify.stopPlayerPolling()
  clearKeepAliveTimer()
  document.removeEventListener('pointerdown', onDocumentPointerDown)
  document.removeEventListener('keydown', onDocumentKeydown)
  window.removeEventListener('resize', measureTitle)
})

/** PrimeVue design tokens — slim seek rail sized for the floating card. */
const seekSliderDt = {
  track: { size: '3px' },
  range: { background: '{meadowGreen.500}' },
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

const volumeSliderDt = {
  track: { size: '3px' },
  range: { background: '{meadowGreen.500}' },
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
  <Teleport to="body">
    <Transition name="dock-pop">
      <section
        v-if="visible"
        ref="dockEl"
        class="dock"
        :class="{ expanded }"
        role="region"
        aria-label="Spotify now playing"
        @pointerenter="hovered = true"
        @pointerleave="hovered = false"
      >
        <div
          v-if="artUrl"
          class="bloom"
          :style="{ backgroundImage: `url('${artUrl}')` }"
          aria-hidden="true"
        />
        <div v-if="artUrl" class="veil" aria-hidden="true" />

        <div class="art">
          <NexusImage
            v-if="artUrl"
            :src="artUrl"
            :alt="`${trackName} album art`"
            size="fill"
            fit="cover"
          />
          <span v-else class="pi pi-headphones art-fallback" />
        </div>

        <button
          v-tooltip.left="`${trackName} — ${artistNames}`"
          type="button"
          class="fab-hit"
          aria-label="Open Spotify player"
          :aria-expanded="expanded"
          :inert="expanded"
          @click="toggleExpanded"
        >
          <span v-if="isPlaying" class="fab-badge" aria-hidden="true">
            <NexusSpotifyPlayingIndicator :active="true" />
          </span>
        </button>

        <div class="card" :inert="!expanded" :aria-hidden="!expanded">
          <div class="head">
            <span class="badge">
              <NexusSpotifyPlayingIndicator :active="isPlaying" />
              <span>{{ isPlaying ? 'Now playing' : 'Paused' }}</span>
            </span>

            <div ref="titleViewport" class="title-viewport">
              <span class="title" :class="{ marquee: titleOverflows }">
                <span ref="titleText" class="title-text">{{ trackName }}</span>
                <span v-if="titleOverflows" class="title-text" aria-hidden="true">
                  {{ trackName }}
                </span>
              </span>
            </div>

            <p class="artists">
              <template v-if="artistLinks.length">
                <template v-for="(artist, index) in artistLinks" :key="artist.id">
                  <button
                    type="button"
                    class="artist-link"
                    @click="openArtist(artist.id)"
                  >
                    {{ artist.name }}
                  </button>
                  <span v-if="index < artistLinks.length - 1">, </span>
                </template>
              </template>
              <template v-else>{{ artistNames }}</template>
            </p>
          </div>

          <Button
            v-tooltip.left="'Collapse'"
            type="button"
            icon="pi pi-chevron-down"
            rounded
            text
            severity="secondary"
            class="mini-btn collapse-btn"
            aria-label="Collapse player"
            :aria-expanded="true"
            @click="collapse"
          />

          <div class="seek">
            <Slider
              :model-value="progressMs"
              :min="0"
              :max="Math.max(durationMs, 1)"
              :disabled="!item || spotify.controlBusy"
              :dt="seekSliderDt"
              @update:model-value="onSeekInput($event as number)"
              @slideend="onSeekCommit(($event as { value: number }).value)"
            />
            <div class="times">
              <span>{{ progressLabel }}</span>
              <span>{{ durationLabel }}</span>
            </div>
          </div>

          <div class="transport">
            <Button
              v-tooltip.top="'Previous'"
              type="button"
              icon="pi pi-step-backward"
              rounded
              text
              severity="secondary"
              class="mini-btn"
              :disabled="spotify.controlBusy || !item"
              aria-label="Previous"
              @click="spotify.previous()"
            />
            <Button
              v-tooltip.top="isPlaying ? 'Pause' : 'Play'"
              type="button"
              :icon="isPlaying ? 'pi pi-pause' : 'pi pi-play'"
              rounded
              class="play-btn"
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
              class="mini-btn"
              :disabled="spotify.controlBusy || !item"
              aria-label="Next"
              @click="spotify.next()"
            />

            <span class="spacer" />

            <Button
              v-tooltip.top="spotify.isLiked ? 'Remove from Liked Songs' : 'Add to Liked Songs'"
              type="button"
              :icon="spotify.isLiked ? 'pi pi-heart-fill' : 'pi pi-heart'"
              rounded
              text
              :severity="spotify.isLiked ? 'success' : 'secondary'"
              class="mini-btn"
              :class="{ on: spotify.isLiked }"
              :disabled="!item || spotify.controlBusy"
              :aria-label="spotify.isLiked ? 'Unlike' : 'Like'"
              @click="spotify.toggleLike()"
            />
            <Button
              v-tooltip.top="'Shuffle'"
              type="button"
              icon="pi pi-arrow-right-arrow-left"
              rounded
              text
              :severity="spotify.player?.shuffle_state ? 'success' : 'secondary'"
              class="mini-btn"
              :class="{ on: spotify.player?.shuffle_state }"
              :disabled="spotify.controlBusy"
              aria-label="Shuffle"
              @click="spotify.setShuffle(!spotify.player?.shuffle_state)"
            />
            <Button
              v-tooltip.top="`Repeat: ${repeatState}`"
              type="button"
              :icon="repeatState === 'track' ? 'pi pi-replay' : 'pi pi-refresh'"
              rounded
              text
              :severity="repeatState !== 'off' ? 'success' : 'secondary'"
              class="mini-btn"
              :class="{ on: repeatState !== 'off' }"
              :disabled="spotify.controlBusy"
              aria-label="Repeat"
              @click="cycleRepeat()"
            />
          </div>

          <div class="footer">
            <Button
              v-tooltip.top="'Choose device'"
              type="button"
              icon="pi pi-desktop"
              :label="device?.name ?? 'No device'"
              text
              severity="secondary"
              class="device-btn"
              aria-label="Choose device"
              @click="openDeviceMenu"
            />

            <span class="spacer" />

            <Button
              v-tooltip.top="`Volume ${volumePercent}%`"
              type="button"
              :icon="volumeIcon"
              rounded
              text
              severity="secondary"
              class="mini-btn"
              :disabled="!device || spotify.controlBusy"
              aria-label="Volume"
              @click="volumeMenu?.toggle($event)"
            />
            <Button
              v-tooltip.top="'Open Spotify hub'"
              type="button"
              icon="pi pi-arrow-up-right"
              rounded
              text
              severity="secondary"
              class="mini-btn"
              aria-label="Open Spotify hub"
              @click="openHub"
            />
          </div>
        </div>
      </section>
    </Transition>

    <Popover ref="volumeMenu">
      <div class="volume-pop">
        <span :class="volumeIcon" />
        <Slider
          :model-value="volumePercent"
          :min="0"
          :max="100"
          :disabled="!device || spotify.controlBusy"
          :dt="volumeSliderDt"
          class="volume-slider"
          @update:model-value="onVolumeInput($event as number)"
          @slideend="onVolumeCommit(($event as { value: number }).value)"
        />
        <span class="volume-label">{{ volumePercent }}%</span>
      </div>
    </Popover>

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
  </Teleport>
</template>

<style scoped>
.dock {
  --dock-ease: cubic-bezier(0.22, 1, 0.36, 1);
  --art-size: 3.5rem;
  --art-offset: 0px;
  --art-radius: 999px;

  position: fixed;
  right: 1.25rem;
  bottom: 1.25rem;
  z-index: 900;
  width: 3.5rem;
  height: 3.5rem;
  border-radius: 999px;
  overflow: hidden;
  transform-origin: bottom right;
  background: var(--spotify-card-surface);
  border: 1px solid color-mix(in srgb, var(--lavender-blush) 12%, transparent);
  box-shadow: 0 0.75rem 2rem color-mix(in srgb, #000 45%, transparent);
  backdrop-filter: blur(18px);
  transition:
    width 420ms var(--dock-ease),
    height 420ms var(--dock-ease),
    border-radius 420ms var(--dock-ease),
    border-color 420ms ease,
    box-shadow 420ms ease;
}

.dock.expanded {
  --art-size: 5rem;
  --art-offset: 1rem;
  --art-radius: 0.85rem;

  width: 22rem;
  height: 17.5rem;
  border-radius: 1.25rem;
  border-color: color-mix(in srgb, var(--light-green) 24%, transparent);
  box-shadow: 0 1.5rem 3.5rem color-mix(in srgb, #000 55%, transparent);
}

/* Album colours bleed through the glass once the card is open. */
.bloom {
  position: absolute;
  inset: -35%;
  background-size: cover;
  background-position: center;
  filter: blur(40px) saturate(1.8);
  opacity: 0;
  transform: scale(1.1);
  pointer-events: none;
  transition:
    opacity 520ms ease,
    transform 620ms var(--dock-ease);
}

.dock.expanded .bloom {
  opacity: 0.5;
  transform: scale(1.25);
}

/* Pulls the bloom back down so labels keep their contrast. */
.veil {
  position: absolute;
  inset: 0;
  pointer-events: none;
  opacity: 0;
  background: linear-gradient(
    155deg,
    color-mix(in srgb, var(--coffee-bean) 62%, transparent),
    color-mix(in srgb, var(--coffee-bean) 90%, transparent)
  );
  transition: opacity 520ms ease;
}

.dock.expanded .veil {
  opacity: 1;
}

.art {
  position: absolute;
  top: var(--art-offset);
  left: var(--art-offset);
  width: var(--art-size);
  height: var(--art-size);
  border-radius: var(--art-radius);
  overflow: hidden;
  display: grid;
  place-items: center;
  background: color-mix(in srgb, var(--coffee-bean) 70%, transparent);
  color: color-mix(in srgb, var(--lavender-blush) 45%, transparent);
  box-shadow: 0 0.25rem 0.75rem color-mix(in srgb, #000 30%, transparent);
  transition:
    top 420ms var(--dock-ease),
    left 420ms var(--dock-ease),
    width 420ms var(--dock-ease),
    height 420ms var(--dock-ease),
    border-radius 420ms var(--dock-ease),
    box-shadow 420ms ease;
}

.dock.expanded .art {
  box-shadow: 0 0.35rem 1rem color-mix(in srgb, #000 40%, transparent);
}

.art :deep(.nexus-image) {
  background: transparent;
}

.art-fallback {
  font-size: 1.35rem;
}

/* Collapsed FAB: album art alone, with a quiet playing chip in the corner. */
.fab-hit {
  position: absolute;
  inset: 0;
  border: 0;
  padding: 0;
  border-radius: inherit;
  cursor: pointer;
  background: transparent;
  transition:
    opacity 200ms ease,
    transform 200ms var(--dock-ease);
}

.dock.expanded .fab-hit {
  opacity: 0;
  pointer-events: none;
}

.fab-hit:hover {
  transform: scale(1.04);
}

.fab-hit:focus-visible {
  outline: 2px solid var(--light-green);
  outline-offset: -3px;
}

.fab-badge {
  position: absolute;
  right: 0.2rem;
  bottom: 0.2rem;
  display: grid;
  place-items: center;
  width: 1.15rem;
  height: 1.15rem;
  border-radius: 999px;
  background: color-mix(in srgb, var(--coffee-bean) 82%, transparent);
  border: 1px solid color-mix(in srgb, var(--light-green) 35%, transparent);
  box-shadow: 0 0.15rem 0.45rem color-mix(in srgb, #000 45%, transparent);
  color: var(--light-green);
}

.fab-badge :deep(.eq) {
  font-size: 0.7rem;
  transform: none;
}

.card {
  position: absolute;
  inset: 0;
  padding: 1rem 1rem 1.75rem;
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
  opacity: 0;
  transform: translateY(8px);
  pointer-events: none;
  transition:
    opacity 180ms ease,
    transform 240ms var(--dock-ease);
}

.dock.expanded .card {
  opacity: 1;
  transform: translateY(0);
  pointer-events: auto;
  /* Let the shell finish growing before the contents arrive. */
  transition-delay: 140ms;
}

.head {
  min-height: 5rem;
  padding-left: 5.65rem;
  /* Keeps the title clear of the collapse chevron pinned top-right. */
  padding-right: 2.25rem;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 0.2rem;
  min-width: 0;
}

.badge {
  display: inline-flex;
  align-items: center;
  gap: 0.4em;
  font-size: 0.65rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--light-green);
  line-height: 1;
}

.title-viewport {
  overflow: hidden;
  min-width: 0;
}

.title {
  display: inline-flex;
  gap: 2.5rem;
  font-size: 1.05rem;
  font-weight: 700;
  letter-spacing: -0.01em;
  color: var(--lavender-blush);
  line-height: 1.25;
  white-space: nowrap;
  max-width: 100%;
}

/* Flex items default to min-width:auto, which would defeat the ellipsis. */
.title:not(.marquee) .title-text {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
}

.title.marquee {
  max-width: none;
  animation: marquee 14s linear infinite;
}

.title.marquee .title-text {
  flex: none;
}

.title-text {
  white-space: nowrap;
}

.artists {
  margin: 0;
  font-size: 0.82rem;
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

.collapse-btn {
  /* Beat PrimeVue's position:relative so this doesn't steal a flex row. */
  position: absolute !important;
  top: 0.5rem;
  right: 0.5rem;
  z-index: 2;
}

.seek {
  margin-top: 0.85rem;
}

.times {
  display: flex;
  justify-content: space-between;
  margin-top: 0.3rem;
  font-size: 0.68rem;
  font-variant-numeric: tabular-nums;
  color: color-mix(in srgb, var(--lavender-blush) 45%, transparent);
}

.transport {
  display: flex;
  align-items: center;
  gap: 0.1rem;
  margin-top: 0.5rem;
}

.footer {
  display: flex;
  align-items: center;
  gap: 0.1rem;
  margin-top: auto;
  padding-top: 0.5rem;
}

.spacer {
  flex: 1;
}

.mini-btn {
  width: 2.15rem !important;
  height: 2.15rem !important;
  flex-shrink: 0;
}

.mini-btn.on {
  background: color-mix(in srgb, var(--light-green) 14%, transparent) !important;
}

.play-btn {
  width: 2.6rem !important;
  height: 2.6rem !important;
  flex-shrink: 0;
  margin-inline: 0.15rem;
}

.device-btn {
  min-width: 0;
  padding: 0.35rem 0.55rem !important;
}

.device-btn :deep(.p-button-label) {
  font-size: 0.72rem;
  font-weight: 600;
  max-width: 8rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.volume-pop {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  min-width: 12rem;
  color: color-mix(in srgb, var(--lavender-blush) 75%, transparent);
}

.volume-slider {
  flex: 1;
}

.volume-label {
  font-size: 0.72rem;
  font-variant-numeric: tabular-nums;
  min-width: 2.4rem;
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

.dock-pop-enter-active {
  transition:
    opacity 260ms ease,
    transform 380ms var(--dock-ease);
}

.dock-pop-leave-active {
  transition:
    opacity 180ms ease,
    transform 220ms ease;
}

.dock-pop-enter-from,
.dock-pop-leave-to {
  opacity: 0;
  transform: translateY(14px) scale(0.82);
}

@keyframes marquee {
  0%,
  12% {
    transform: translateX(0);
  }
  88%,
  100% {
    transform: translateX(calc(-50% - 1.25rem));
  }
}

@media (max-width: 640px) {
  .dock.expanded {
    width: auto;
    left: 0.75rem;
    right: 0.75rem;
  }
}

@media (prefers-reduced-motion: reduce) {
  .dock,
  .art,
  .bloom,
  .card,
  .fab-hit,
  .dock-pop-enter-active,
  .dock-pop-leave-active {
    transition-duration: 1ms;
  }

  .title.marquee {
    animation: none;
  }

  .dock-pop-enter-from,
  .dock-pop-leave-to {
    transform: none;
  }
}
</style>
