<script setup lang="ts">
import { onBeforeUnmount, onMounted } from 'vue'
import { RouterView, useRoute, useRouter } from 'vue-router'
import NxTopBar from '@design/components/shell/NxTopBar.vue'
import NxDock from '@design/components/shell/NxDock.vue'
import NxCommandPalette from '@design/components/shell/NxCommandPalette.vue'
import NexusSpotifyPlayerPanel from '@components/nexus-spotify-player-panel/NexusSpotifyPlayerPanel.vue'
import { useCommandStore } from '@design/command/command.store'
import { createNavigationSource } from '@design/command/navigation-source'
import { useSpotifyStore } from '@stores/spotify/spotify.store'

const route = useRoute()
const router = useRouter()
const command = useCommandStore()
const spotify = useSpotifyStore()

const unregisterNavigation = command.register(
  createNavigationSource({
    router,
    extraActions: () =>
      spotify.hasActiveTrack
        ? [
            {
              id: 'player',
              label: spotify.player?.is_playing ? 'Pause music' : 'Resume music',
              hint: spotify.player?.item?.name ?? undefined,
              group: 'Actions',
              icon: spotify.player?.is_playing ? 'pause' : 'play',
              color: '#1ed760',
              keywords: ['play', 'pause', 'spotify'],
              run: () => {
                void spotify.togglePlayPause()
              },
            },
          ]
        : [],
  }),
)

function onKeydown(event: KeyboardEvent): void {
  if (!route.meta.shell) return
  if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
    event.preventDefault()
    command.toggle()
  }
}

onMounted(() => document.addEventListener('keydown', onKeydown))
onBeforeUnmount(() => {
  document.removeEventListener('keydown', onKeydown)
  unregisterNavigation()
})
</script>

<template>
  <Toast />
  <ConfirmPopup />

  <NxTopBar v-if="route.meta.shell" />

  <RouterView v-slot="{ Component }">
    <Transition name="nx-page" mode="out-in">
      <component :is="Component" :class="{ 'nx-page': route.meta.shell }" />
    </Transition>
  </RouterView>

  <template v-if="route.meta.shell">
    <NxDock />
    <NexusSpotifyPlayerPanel />
    <NxCommandPalette />
  </template>
</template>

<style>
.nx-page {
  width: 100%;
  max-width: var(--page-max);
  margin: 0 auto;
  padding: 8px var(--page-pad) var(--shell-dock-space);
  min-height: calc(100dvh - var(--shell-top));
}

.nx-page-enter-active {
  transition:
    opacity 0.35s var(--ease),
    transform 0.45s var(--ease);
}

.nx-page-leave-active {
  transition: opacity 0.15s ease;
}

.nx-page-enter-from {
  opacity: 0;
  transform: translateY(10px);
}

.nx-page-leave-to {
  opacity: 0;
}
</style>
