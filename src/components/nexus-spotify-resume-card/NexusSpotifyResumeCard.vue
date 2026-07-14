<script setup lang="ts">
import { computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useSpotifyStore } from '@stores/spotify/spotify.store'
import NexusSpotifyIcon from '@components/nexus-spotify-icon/NexusSpotifyIcon.vue'
import NexusSpotifyPlayingIndicator from '@components/nexus-spotify-playing-indicator/NexusSpotifyPlayingIndicator.vue'

const spotify = useSpotifyStore()
const router = useRouter()

onMounted(() => {
  void spotify.loadHub()
  spotify.startPlayerPolling()
})

onUnmounted(() => {
  spotify.stopPlayerPolling()
})

const liveItem = computed(() => spotify.player?.item ?? null)
const lastPlayed = computed(() => {
  const row = spotify.recentlyPlayed.find((r) => r.track)
  return row?.track ?? null
})

const mode = computed<'loading' | 'now' | 'last' | 'connect' | 'empty'>(() => {
  if (spotify.statusLoading) return 'loading'
  if (!spotify.connected) return 'connect'
  if (liveItem.value?.uri) return 'now'
  if (lastPlayed.value) return 'last'
  if (spotify.playerLoading || spotify.recentlyLoading) return 'loading'
  return 'empty'
})

const title = computed(() => {
  if (mode.value === 'now') return liveItem.value?.name ?? 'Now playing'
  if (mode.value === 'last') return lastPlayed.value?.name ?? 'Last played'
  if (mode.value === 'connect') return 'Link Spotify'
  return 'Spotify'
})

const subtitle = computed(() => {
  if (mode.value === 'now') {
    return (
      liveItem.value?.artists?.map((a) => a.name).filter(Boolean).join(', ') ||
      'Unknown artist'
    )
  }
  if (mode.value === 'last') {
    return (
      lastPlayed.value?.artists.map((a) => a.name).join(', ') ||
      'Unknown artist'
    )
  }
  if (mode.value === 'connect') {
    return 'Control playback and browse listening data from the hub'
  }
  return 'Nothing in your recent archive yet — sync after connecting'
})

const artUrl = computed(() => {
  if (mode.value === 'now') {
    return liveItem.value?.album?.images?.[0]?.url ?? null
  }
  if (mode.value === 'last') return lastPlayed.value?.album_image_url ?? null
  return null
})

const badge = computed(() => {
  if (mode.value === 'now') {
    return spotify.player?.is_playing ? 'Now playing' : 'Paused'
  }
  if (mode.value === 'last') return 'Last played'
  return 'Spotify'
})

const deviceLabel = computed(() => {
  if (mode.value !== 'now' || !spotify.player?.device) return null
  return `Playing on ${spotify.player.device.name}`
})

async function primaryAction(event: Event): Promise<void> {
  event.stopPropagation()
  event.preventDefault()

  if (mode.value === 'connect') {
    await spotify.connect()
    return
  }

  if (mode.value === 'now') {
    if (spotify.player?.is_playing) {
      await spotify.pause()
    } else {
      await spotify.play()
    }
    return
  }

  if (mode.value === 'last' && lastPlayed.value?.uri) {
    await spotify.playTrackUri(lastPlayed.value.uri)
  }
}

function openSpotify(): void {
  if (mode.value === 'loading') return
  void router.push({ name: 'spotify' })
}
</script>

<template>
  <article
    class="resume-card"
    :class="{ loading: mode === 'loading' }"
    :role="mode === 'loading' ? undefined : 'link'"
    :tabindex="mode === 'loading' ? undefined : 0"
    :aria-busy="mode === 'loading'"
    @click="openSpotify"
    @keydown.enter="openSpotify"
  >
    <template v-if="mode === 'loading'">
      <Skeleton width="100%" height="100%" border-radius="0.85rem" class="art-skel" />
      <div class="body">
        <Skeleton width="6rem" height="0.7rem" />
        <Skeleton width="70%" height="1.5rem" />
        <Skeleton width="45%" height="0.9rem" />
        <Skeleton width="7rem" height="2.25rem" border-radius="0.5rem" class="cta-skel" />
      </div>
    </template>

    <template v-else>
      <div class="art-plane">
        <img
          v-if="artUrl"
          :src="artUrl"
          :alt="title"
          class="art-image"
        />
        <div v-else class="art-empty">
          <NexusSpotifyIcon v-if="mode === 'connect' || mode === 'empty'" :size="36" />
          <span v-else class="pi pi-headphones text-3xl" />
        </div>
        <div class="art-veil" />
      </div>

      <div class="body">
        <div class="status-row">
          <span class="now-badge">
            <NexusSpotifyPlayingIndicator
              v-if="mode === 'now'"
              :active="spotify.player?.is_playing === true"
            />
            <span class="now-badge-label">{{ badge }}</span>
          </span>
          <span v-if="deviceLabel" class="device-label">
            <span class="pi pi-wifi" />
            {{ deviceLabel }}
          </span>
        </div>

        <h3 class="title">{{ title }}</h3>
        <p class="subtitle">{{ subtitle }}</p>

        <div class="actions">
          <Button
            :label="
              mode === 'connect'
                ? 'Connect Spotify'
                : mode === 'now' && spotify.player?.is_playing
                  ? 'Pause'
                  : 'Play'
            "
            :icon="
              mode === 'connect'
                ? 'pi pi-link'
                : mode === 'now' && spotify.player?.is_playing
                  ? 'pi pi-pause'
                  : 'pi pi-play'
            "
            :severity="mode === 'connect' ? 'success' : undefined"
            :loading="spotify.controlBusy"
            :disabled="mode === 'empty'"
            @click="primaryAction"
          />
        </div>
      </div>
    </template>
  </article>
</template>

<style scoped>
.resume-card {
  display: grid;
  grid-template-columns: minmax(9rem, 12rem) 1fr;
  gap: 1.25rem;
  padding: 1rem;
  border-radius: 1rem;
  background: var(--spotify-card-surface);
  border: 1px solid color-mix(in srgb, var(--light-green) 18%, transparent);
  overflow: hidden;
  min-height: 11rem;
  cursor: pointer;
  transition:
    border-color 0.15s ease,
    transform 0.15s ease,
    box-shadow 0.15s ease;
}

.resume-card.loading {
  cursor: default;
}

.resume-card:not(.loading):hover {
  border-color: color-mix(in srgb, var(--light-green) 45%, transparent);
  box-shadow: 0 0 0 1px color-mix(in srgb, var(--light-green) 12%, transparent);
}

.resume-card:not(.loading):focus-visible {
  outline: 2px solid color-mix(in srgb, var(--light-green) 55%, transparent);
  outline-offset: 2px;
}

@media (max-width: 640px) {
  .resume-card {
    grid-template-columns: 1fr;
  }
}

.art-skel {
  min-height: 9rem;
  aspect-ratio: 1;
}

.art-plane {
  position: relative;
  border-radius: 0.85rem;
  overflow: hidden;
  min-height: 9rem;
  background: color-mix(in srgb, var(--coffee-bean) 70%, transparent);
}

.art-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.art-empty {
  width: 100%;
  height: 100%;
  min-height: 9rem;
  display: grid;
  place-items: center;
  color: var(--light-green);
  background: color-mix(in srgb, var(--light-green) 14%, transparent);
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

.body {
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 0.45rem;
  min-width: 0;
  padding: 0.15rem 0.25rem 0.15rem 0;
}

.cta-skel {
  margin-top: 0.25rem;
}

.status-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.65rem 1rem;
}

.now-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.4em;
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--light-green);
  line-height: 1;
}

.now-badge-label {
  line-height: 1;
}

.device-label {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.8rem;
  color: color-mix(in srgb, var(--lavender-blush) 72%, transparent);
}

.title {
  margin: 0;
  font-size: clamp(1.25rem, 2.2vw, 1.65rem);
  font-weight: 700;
  letter-spacing: -0.02em;
  color: var(--lavender-blush);
  line-height: 1.15;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.subtitle {
  margin: 0;
  font-size: 1rem;
  color: color-mix(in srgb, var(--light-green) 75%, var(--lavender-blush));
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
  margin-top: 0.25rem;
}
</style>
