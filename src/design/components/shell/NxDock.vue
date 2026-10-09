<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'
import NexusSpotifyNowPlaying from '@components/nexus-spotify-now-playing/NexusSpotifyNowPlaying.vue'
import { useSpotifyStore } from '@stores/spotify/spotify.store'
import NxIcon from '../NxIcon.vue'
import { useCommandStore } from '../../command/command.store'
import {
  dockGroups,
  isDestinationActive,
  phoneTabs,
  primaryDestinations,
  secondaryDestinations,
  type Destination,
} from '../../navigation'
import { sections } from '../../tokens'
import { inkFor } from '../../color'

const route = useRoute()
const spotify = useSpotifyStore()
const command = useCommandStore()

const moreOpen = ref(false)

const tabs = computed(() =>
  phoneTabs.map((key) => primaryDestinations.find((d) => d.key === key)!),
)

const moreDestinations = computed(() => [
  ...primaryDestinations.filter((d) => !(phoneTabs as readonly string[]).includes(d.key)),
  ...secondaryDestinations,
])

const moreActive = computed(() =>
  moreDestinations.value.some((d) => isDestinationActive(d, route.path)),
)

function active(dest: Destination): boolean {
  return isDestinationActive(dest, route.path)
}

function liveColour(dest: Destination): string | null {
  if (dest.key === 'listening' && spotify.player?.is_playing) return '#1ed760'
  return null
}

function tileStyle(dest: Destination): Record<string, string> {
  const bg = sections[dest.section].field.bg
  return { background: bg, color: inkFor(bg) }
}
</script>

<template>
  <nav class="nx-dock" aria-label="Sections">
    <template v-for="(group, gi) in dockGroups" :key="gi">
      <span v-if="gi" class="sep" aria-hidden="true" />
      <RouterLink
        v-for="dest in group"
        :key="dest.key"
        v-tooltip.top="dest.label"
        :to="dest.to"
        class="btn"
        :class="{ on: active(dest), live: liveColour(dest) }"
        :style="liveColour(dest) ? { '--dot': liveColour(dest)! } : undefined"
        :aria-label="dest.label"
        :aria-current="active(dest) ? 'page' : undefined"
      >
        <NxIcon :name="dest.icon" />
      </RouterLink>
    </template>
    <NexusSpotifyNowPlaying variant="dock" />
    <span class="sep" aria-hidden="true" />
    <button
      v-tooltip.top="'Search  ⌘K'"
      type="button"
      class="btn"
      aria-label="Search"
      @click="command.show()"
    >
      <NxIcon name="search" />
    </button>
  </nav>

  <div class="nx-phone-bar">
    <NexusSpotifyNowPlaying variant="strip" />
    <nav class="nx-tabbar" aria-label="Sections">
      <RouterLink
        v-for="dest in tabs"
        :key="dest.key"
        :to="dest.to"
        class="tab"
        :class="{ on: active(dest) }"
        :aria-current="active(dest) ? 'page' : undefined"
      >
        <NxIcon :name="dest.icon" :size="20" />
        <span>{{ dest.label }}</span>
      </RouterLink>
      <button type="button" class="tab" :class="{ on: moreActive }" @click="moreOpen = true">
        <NxIcon name="sparkles" :size="20" />
        <span>More</span>
      </button>
    </nav>
  </div>

  <Drawer
    v-model:visible="moreOpen"
    position="bottom"
    :show-close-icon="false"
    :pt="{ root: { class: 'nx-more' } }"
  >
    <template #header>
      <span class="nx-label">Everything in Nexus</span>
    </template>
    <div class="nx-more-grid">
      <RouterLink
        v-for="dest in moreDestinations"
        :key="dest.key"
        :to="dest.to"
        class="nx-more-tile"
        :style="tileStyle(dest)"
        @click="moreOpen = false"
      >
        <NxIcon :name="dest.icon" :size="20" />
        <span>{{ dest.label }}</span>
      </RouterLink>
    </div>
  </Drawer>
</template>

<style scoped>
.nx-dock {
  position: fixed;
  bottom: 22px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 60;
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px;
  border-radius: 20px;
  background: color-mix(in srgb, var(--amb) 65%, black);
  border: 1px solid var(--line);
  box-shadow: 0 18px 40px rgba(0, 0, 0, 0.35);
}

.btn {
  position: relative;
  width: 44px;
  height: 44px;
  border: 0;
  border-radius: 14px;
  background: transparent;
  display: grid;
  place-items: center;
  color: var(--ink-3);
  cursor: pointer;
  transition:
    background 0.2s,
    color 0.2s;
}

.btn:hover {
  background: var(--tint-2);
  color: var(--ink);
}

.btn.on {
  background: var(--ink);
  color: var(--amb);
}

.btn.live::after {
  content: '';
  position: absolute;
  top: 8px;
  right: 8px;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--dot, var(--acc));
}

.sep {
  width: 1px;
  height: 28px;
  margin: 0 4px;
  background: var(--line);
}

.nx-phone-bar {
  display: none;
}

@media (max-width: 640px) {
  .nx-dock {
    display: none;
  }

  .nx-phone-bar {
    display: flex;
    flex-direction: column;
    position: fixed;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 60;
    background: color-mix(in srgb, var(--amb) 88%, black);
    border-top: 1px solid var(--line);
    backdrop-filter: blur(18px);
    -webkit-backdrop-filter: blur(18px);
    padding-bottom: env(safe-area-inset-bottom);
  }

  .nx-tabbar {
    display: grid;
    grid-template-columns: repeat(5, 1fr);
  }

  .tab {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 3px;
    padding: 10px 0 8px;
    border: 0;
    background: transparent;
    font-size: 11px;
    font-weight: 500;
    color: var(--ink-3);
  }

  .tab.on {
    color: var(--acc);
  }
}
</style>

<style>
.p-drawer.nx-more {
  height: auto !important;
  max-height: 80dvh;
  border-radius: var(--r-xxl) var(--r-xxl) 0 0;
  background: var(--overlay);
  border-color: var(--line);
}

.nx-more-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
  padding-bottom: env(safe-area-inset-bottom);
}

.nx-more-tile {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 18px;
  min-height: 84px;
  padding: 14px;
  border-radius: var(--r-lg);
  font-weight: 700;
}
</style>
