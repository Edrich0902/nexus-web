<script setup lang="ts">
import { onBeforeUnmount, onMounted, type VNode } from 'vue'
import { RouterView, useRoute, useRouter } from 'vue-router'
import NxTopBar from '@design/components/shell/NxTopBar.vue'
import NxDock from '@design/components/shell/NxDock.vue'
import NxCommandPalette from '@design/components/shell/NxCommandPalette.vue'
import NexusSpotifyPlayerPanel from '@components/nexus-spotify-player-panel/NexusSpotifyPlayerPanel.vue'
import NexusSpotifyQueuePanel from '@components/nexus-spotify-queue-panel/NexusSpotifyQueuePanel.vue'
import NexusSpotifyAddToPlaylist from '@components/nexus-spotify-add-to-playlist/NexusSpotifyAddToPlaylist.vue'
import { scoreItem, useCommandStore, type CommandItem } from '@design/command/command.store'
import { createNavigationSource } from '@design/command/navigation-source'
import { createSearchSource } from '@design/command/search-source'
import { useAuthStore } from '@stores/auth/auth.store'
import { useSpotifyStore } from '@stores/spotify/spotify.store'

const route = useRoute()
const router = useRouter()
const command = useCommandStore()
const spotify = useSpotifyStore()
const auth = useAuthStore()

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
const unregisterSearch = command.register(createSearchSource(router))

const signOutItem: CommandItem = {
  id: 'account:sign-out',
  label: 'Sign out',
  hint: 'This device',
  group: 'Actions',
  icon: 'log-out',
  keywords: ['log out', 'logout', 'sign off'],
  run: async () => {
    await auth.logout()
    await router.replace({ name: 'login' })
  },
}

/** Only offered once the user types for it, so it never sits in the empty palette. */
const unregisterAccount = command.register({
  id: 'account',
  order: 90,
  fetch: (query) => (query.trim() && scoreItem(signOutItem, query) > 0 ? [signOutItem] : []),
})

function onKeydown(event: KeyboardEvent): void {
  if (!route.meta.shell) return
  if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
    event.preventDefault()
    command.toggle()
  }
}

/**
 * Views may render dialogs next to their template, so the page frame is a
 * wrapper element. It is keyed by view component (not path) so param changes
 * within a view don't replay the entrance. The entrance is a CSS animation
 * rather than an out-in <Transition>: a leave that never finishes (hidden
 * tab, throttled frames) would otherwise block the next page indefinitely.
 */
const pageKeys = new WeakMap<object, number>()
let pageKeySeq = 0

function pageKey(vnode: VNode): number {
  const type = vnode.type as object
  let key = pageKeys.get(type)
  if (key === undefined) {
    key = ++pageKeySeq
    pageKeys.set(type, key)
  }
  return key
}

onMounted(() => document.addEventListener('keydown', onKeydown))
onBeforeUnmount(() => {
  document.removeEventListener('keydown', onKeydown)
  unregisterNavigation()
  unregisterSearch()
  unregisterAccount()
})
</script>

<template>
  <Toast />
  <ConfirmPopup />

  <NxTopBar v-if="route.meta.shell" />

  <RouterView v-slot="{ Component }">
    <div v-if="Component" :key="pageKey(Component)" :class="{ 'nx-page': route.meta.shell }">
      <component :is="Component" />
    </div>
  </RouterView>

  <template v-if="route.meta.shell">
    <NxDock />
    <NexusSpotifyPlayerPanel />
    <NexusSpotifyQueuePanel />
    <NexusSpotifyAddToPlaylist />
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
  /* No fill-mode: a lingering transform would trap position: fixed children. */
  animation: nx-page-in 0.45s var(--ease);
}

@keyframes nx-page-in {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
}
</style>
