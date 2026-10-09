<script setup lang="ts">
import { computed } from 'vue'
import NexusImage from '@components/nexus-image/NexusImage.vue'
import NexusSpotifyPlayingIndicator from '@components/nexus-spotify-playing-indicator/NexusSpotifyPlayingIndicator.vue'
import NxIcon from '@design/components/NxIcon.vue'
import NxIconButton from '@design/components/NxIconButton.vue'
import { useSpotifyStore } from '@stores/spotify/spotify.store'

defineProps<{
  /** `dock`: album-art button inside the desktop dock. `strip`: phone bar above the tabs. */
  variant: 'dock' | 'strip'
}>()

const spotify = useSpotifyStore()

const item = computed(() => spotify.player?.item ?? null)
const isPlaying = computed(() => spotify.player?.is_playing === true)
const artUrl = computed(() => item.value?.album?.images?.[0]?.url ?? null)
const trackName = computed(() => item.value?.name ?? 'Unknown track')
const artistNames = computed(
  () => (item.value?.artists ?? []).map((a) => a.name).filter(Boolean).join(', ') || 'Unknown artist',
)

function togglePanel(): void {
  spotify.setDockExpanded(!spotify.dockExpanded)
}
</script>

<template>
  <template v-if="spotify.hasActiveTrack">
    <template v-if="variant === 'dock'">
      <span class="sep" aria-hidden="true" />
      <button
        v-tooltip.top="`${trackName} · ${artistNames}`"
        type="button"
        class="np-dock"
        :class="{ on: spotify.dockExpanded }"
        data-player-toggle
        :aria-label="`Now playing: ${trackName} by ${artistNames}. Open player`"
        :aria-expanded="spotify.dockExpanded"
        @click="togglePanel"
      >
        <NexusImage v-if="artUrl" :src="artUrl" alt="" size="fill" fit="cover" />
        <NxIcon v-else name="headphones" />
        <span v-if="isPlaying" class="np-eq" aria-hidden="true">
          <NexusSpotifyPlayingIndicator :active="true" />
        </span>
      </button>
    </template>

    <div v-else class="np-strip">
      <button
        type="button"
        class="np-strip-open"
        data-player-toggle
        :aria-expanded="spotify.dockExpanded"
        :aria-label="`Now playing: ${trackName} by ${artistNames}. Open player`"
        @click="togglePanel"
      >
        <span class="np-strip-art">
          <NexusImage v-if="artUrl" :src="artUrl" alt="" size="fill" fit="cover" />
          <NxIcon v-else name="headphones" :size="16" />
        </span>
        <span class="np-strip-text">
          <span class="t">{{ trackName }}</span>
          <span class="a">{{ artistNames }}</span>
        </span>
      </button>
      <NxIconButton
        :icon="isPlaying ? 'pause' : 'play'"
        :label="isPlaying ? 'Pause' : 'Play'"
        :tooltip="false"
        :disabled="spotify.controlBusy"
        @click="spotify.togglePlayPause()"
      />
    </div>
  </template>
</template>

<style scoped>
.sep {
  width: 1px;
  height: 28px;
  margin: 0 4px;
  background: var(--line);
}

.np-dock {
  position: relative;
  width: 44px;
  height: 44px;
  padding: 0;
  border: 0;
  border-radius: 12px;
  overflow: hidden;
  display: grid;
  place-items: center;
  background: var(--tint-2);
  color: var(--ink-2);
  cursor: pointer;
  transition: transform 0.25s var(--ease), box-shadow 0.2s;
}

.np-dock:hover {
  transform: scale(1.05);
}

.np-dock.on {
  box-shadow: 0 0 0 2px var(--ink);
}

.np-dock :deep(.nexus-image) {
  width: 100%;
  height: 100%;
}

.np-eq {
  position: absolute;
  right: 3px;
  bottom: 3px;
  display: grid;
  place-items: center;
  width: 16px;
  height: 16px;
  border-radius: 999px;
  background: rgba(0, 0, 0, 0.6);
  color: #1ed760;
  font-size: 10px;
}

.np-eq :deep(.eq) {
  color: #1ed760;
  transform: none;
}

.np-strip {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px 0 12px;
}

.np-strip-open {
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 10px;
  border: 0;
  padding: 0;
  background: transparent;
  text-align: left;
  cursor: pointer;
}

.np-strip-art {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  overflow: hidden;
  flex-shrink: 0;
  display: grid;
  place-items: center;
  background: var(--tint-2);
}

.np-strip-art :deep(.nexus-image) {
  width: 100%;
  height: 100%;
}

.np-strip-text {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.np-strip-text .t {
  font-weight: 600;
  font-size: 13.5px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.np-strip-text .a {
  font-size: 12px;
  color: var(--ink-3);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
