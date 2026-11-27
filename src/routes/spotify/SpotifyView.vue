<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useConfirm } from 'primevue/useconfirm'
import IndexTemplate from '@design/templates/IndexTemplate.vue'
import type { ViewState } from '@design/templates/types'
import NxStage from '@design/components/NxStage.vue'
import NxIcon from '@design/components/NxIcon.vue'
import NxIconButton from '@design/components/NxIconButton.vue'
import NxSectionHeader from '@design/components/NxSectionHeader.vue'
import NxCoverGrid from '@design/components/NxCoverGrid.vue'
import NxCoverCard from '@design/components/NxCoverCard.vue'
import NxChips from '@design/components/NxChips.vue'
import NxPanel from '@design/components/NxPanel.vue'
import NxSkeletonRows from '@design/components/skeletons/NxSkeletonRows.vue'
import { usePaletteAmbient } from '@design/usePaletteAmbient'
import NexusSpotifyIcon from '@components/nexus-spotify-icon/NexusSpotifyIcon.vue'
import NexusSpotifyTrackRow from '@components/nexus-spotify-track-row/NexusSpotifyTrackRow.vue'
import NexusSpotifyTrackMetrics from '@components/nexus-spotify-track-metrics/NexusSpotifyTrackMetrics.vue'
import CollectionFields from '@routes/collections/CollectionFields.vue'
import { plural, type CollectionField } from '@routes/collections/collectionFields'
import { useSpotifyProgress } from '@/composables/useSpotifyProgress'
import { useSpotifyStore } from '@stores/spotify/spotify.store'
import ListeningNav from './ListeningNav.vue'
import { capitalise, linkedArtists, relativeTime, splitTitle } from './listening'

const spotify = useSpotifyStore()
const route = useRoute()
const router = useRouter()
const confirm = useConfirm()
const { progressMs, durationMs } = useSpotifyProgress()

const createOpen = ref(false)
const newPlaylist = ref({ name: '', description: '' })
const creating = ref(false)
const scrollY = ref(0)
let scrollRaf = 0

const vReveal = {
  mounted(el: HTMLElement) {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    el.classList.add('reveal-init')
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            el.classList.add('reveal-in')
            observer.unobserve(el)
          }
        }
      },
      { threshold: 0.08, rootMargin: '0px 0px -30px 0px' },
    )
    observer.observe(el)
    ;(el as HTMLElement & { __revealObs?: IntersectionObserver }).__revealObs = observer
  },
  unmounted(el: HTMLElement) {
    ;(el as HTMLElement & { __revealObs?: IntersectionObserver }).__revealObs?.disconnect()
  },
}

function onScroll(): void {
  if (scrollRaf) return
  scrollRaf = requestAnimationFrame(() => {
    scrollRaf = 0
    scrollY.value = Math.min(700, Math.max(0, window.scrollY || document.documentElement.scrollTop || 0))
  })
}

onMounted(async () => {
  window.addEventListener('scroll', onScroll, { passive: true })
  spotify.startPlayerPolling()
  const connected = typeof route.query.connected === 'string' ? route.query.connected : null
  const error = typeof route.query.error === 'string' ? route.query.error : null
  if (connected !== null) {
    await spotify.handleOAuthReturn(connected, error)
    await router.replace({ name: 'spotify', query: {} })
    return
  }
  await spotify.loadHub()
})

onUnmounted(() => {
  window.removeEventListener('scroll', onScroll)
  if (scrollRaf) cancelAnimationFrame(scrollRaf)
  spotify.stopPlayerPolling()
})

watch(
  () => spotify.connected,
  (isConnected, was) => {
    if (isConnected && was === false) void spotify.loadHub()
  },
)

const state = computed<ViewState>(() => (spotify.statusLoading ? 'loading' : 'ready'))

const isPlaying = computed(() => spotify.player?.is_playing === true)

/** What the stage is about: the live track, or failing that the last one played. */
const hero = computed(() => {
  const item = spotify.player?.item
  if (item?.name) {
    return {
      live: true,
      name: item.name,
      uri: item.uri ?? null,
      art: item.album?.images?.[0]?.url ?? null,
      album: item.album?.name ?? null,
      artists: linkedArtists(item.artists),
      when: null as string | null,
    }
  }
  const last = spotify.recentlyPlayed.find((r) => r.track)
  if (!last?.track) return null
  return {
    live: false,
    name: last.track.name,
    uri: last.track.uri,
    art: last.track.album_image_url,
    album: last.track.album_name,
    artists: linkedArtists(last.track.artists),
    when: last.played_at,
  }
})

usePaletteAmbient(() => hero.value?.art)

const heading = computed(() => (hero.value ? splitTitle(hero.value.name) : { title: 'Your', accent: 'listening' }))

const eyebrow = computed(() => {
  if (!hero.value) return 'Listening'
  if (!hero.value.live) return `Last played · ${relativeTime(hero.value.when)}`
  const device = spotify.player?.device?.name
  return `${isPlaying.value ? 'Now playing' : 'Paused'}${device ? ` · ${device}` : ''}`
})

const progress = computed(() =>
  hero.value?.live && durationMs.value > 0 ? progressMs.value / durationMs.value : null,
)

const summary = computed(() => spotify.taste?.summary ?? null)
const ownPlaylists = computed(() => spotify.playlists.filter((p) => p.is_owner).length)

const fields = computed<CollectionField[]>(() => {
  const s = summary.value
  return [
    {
      key: 'plays',
      label: 'Plays this week',
      value: s ? s.plays_last_7d.toLocaleString() : '—',
      sub: s ? plural(s.unique_tracks_last_7d, 'different track') : 'Sync to count your plays',
      variant: 'solid',
      span: 4,
    },
    s?.top_genre
      ? { key: 'genre', label: 'Top genre', title: capitalise(s.top_genre), variant: 'tint', span: 3, to: { name: 'spotify-stats' } }
      : { key: 'genre', label: 'Top genre', title: 'Appears after a sync', variant: 'outline', span: 3 },
    s?.peak_bucket
      ? { key: 'peak', label: 'You listen most', title: capitalise(s.peak_bucket), variant: 'tint', span: 2 }
      : { key: 'peak', label: 'You listen most', title: '—', variant: 'outline', span: 2 },
    {
      key: 'playlists',
      label: 'Playlists',
      value: spotify.playlists.length,
      sub: ownPlaylists.value ? `${ownPlaylists.value} made by you` : undefined,
      variant: 'outline',
      span: 3,
    },
  ]
})

const recent = computed(() => spotify.recentlyPlayed.filter((r) => r.track).slice(0, 8))
const onRepeat = computed(() => spotify.taste?.on_repeat?.slice(0, 6) ?? [])
const suggestions = computed(() => spotify.suggestions.slice(0, 6))
const genres = computed(() => (spotify.taste?.genres ?? []).slice(0, 8).map((g) => capitalise(g.genre)))

watch(
  () => [
    ...recent.value.map((r) => r.track!.uri),
    ...suggestions.value.map((s) => s.track.uri),
    ...onRepeat.value.map((r) => r.track.uri),
  ],
  (uris) => void spotify.refreshLikedUris(uris),
)

function playHero(): void {
  if (hero.value?.live) void spotify.togglePlayPause()
  else if (hero.value?.uri) void spotify.playTrackUri(hero.value.uri)
}

function confirmDisconnect(event: Event): void {
  confirm.require({
    target: event.currentTarget as HTMLElement,
    message: 'Disconnect Spotify from Nexus?',
    rejectProps: { label: 'Cancel', severity: 'secondary', text: true },
    acceptProps: { label: 'Disconnect', severity: 'danger' },
    accept: () => void spotify.disconnect(),
  })
}

async function submitCreatePlaylist(): Promise<void> {
  const name = newPlaylist.value.name.trim()
  if (!name) return
  creating.value = true
  const playlist = await spotify.createPlaylist({
    name,
    description: newPlaylist.value.description.trim() || undefined,
  })
  creating.value = false
  if (!playlist) return
  createOpen.value = false
  newPlaylist.value = { name: '', description: '' }
  await router.push({ name: 'spotify-playlist', params: { playlistId: playlist.id } })
}
</script>

<template>
  <Teleport to="body">
    <div
      v-if="spotify.connected"
      class="aurora"
      :class="{ paused: !isPlaying }"
      :style="{ transform: `translate3d(0, ${(-scrollY * 0.25).toFixed(1)}px, 0)` }"
      aria-hidden="true"
    >
      <div class="aurora-blob b1" />
      <div class="aurora-blob b2" />
      <div class="aurora-blob b3" />
      <div
        v-if="hero?.art"
        class="aurora-art"
        :style="{
          backgroundImage: `url(${hero.art})`,
          transform: `translate3d(0, ${(-scrollY * 0.45).toFixed(1)}px, 0) scale(1.14)`,
          opacity: Math.max(0, 0.36 - scrollY * 0.00065).toFixed(3),
        }"
      />
    </div>
  </Teleport>
  <IndexTemplate
    :state="state"
    class="spotify-page"
    :style="{ '--sy': scrollY }"
  >
    <template #stage>
      <NxStage
        v-if="!spotify.connected"
        eyebrow="Listening"
        title="Bring your"
        accent="music in"
        lede="Connect Spotify to control playback from anywhere in Nexus, see what you have been playing and keep your playlists close. Audio stays on Spotify."
      >
        <template #visual>
          <div class="mark"><NexusSpotifyIcon :size="72" /></div>
        </template>
        <template #actions>
          <Button rounded label="Connect Spotify" @click="spotify.connect()" />
        </template>
      </NxStage>

      <NxStage
        v-else
        :live="hero?.live && isPlaying"
        :eyebrow="eyebrow"
        :title="heading.title"
        :accent="heading.accent"
        :progress="progress"
      >
        <template v-if="hero?.live && isPlaying" #eyebrow>
          <span class="eq" aria-hidden="true"><i /><i /><i /><i /></span>
          <span>{{ eyebrow }}</span>
        </template>
        <template #visual>
          <div class="hero-art" :class="{ playing: hero?.live && isPlaying }">
            <img v-if="hero?.art" :src="hero.art" alt="" />
            <NxIcon v-else name="headphones" :size="48" />
          </div>
        </template>
        <template v-if="hero" #lede>
          <template v-for="(a, i) in hero.artists" :key="a.id">
            <RouterLink :to="{ name: 'spotify-artist', params: { artistId: a.id } }" class="lede-link">{{
              a.name
            }}</RouterLink
            ><template v-if="i < hero.artists.length - 1">, </template>
          </template>
          <template v-if="hero.album"> · {{ hero.album }}</template>
        </template>
        <template v-else #lede>
          Nothing has played yet. Start something on Spotify and it shows up here.
        </template>
        <template v-if="hero" #actions>
          <Button
            rounded
            severity="contrast"
            :label="hero.live ? (isPlaying ? 'Pause' : 'Resume') : 'Play again'"
            :disabled="spotify.controlBusy"
            @click="playHero"
          >
            <template #icon="{ class: iconClass }">
              <NxIcon :name="hero.live && isPlaying ? 'pause' : 'play'" :size="16" :class="iconClass" />
            </template>
          </Button>
          <Button rounded severity="secondary" label="Queue" @click="spotify.openQueuePanel()">
            <template #icon="{ class: iconClass }">
              <NxIcon name="queue" :size="16" :class="iconClass" />
            </template>
          </Button>
          <NxIconButton
            v-if="hero.uri"
            icon="plus"
            variant="tint"
            label="Add to playlist"
            @click="spotify.openAddToPlaylist(hero.uri)"
          />
        </template>
      </NxStage>
    </template>

    <template v-if="spotify.connected" #fields>
      <CollectionFields section="listening" :fields="fields" />
    </template>

    <template v-if="spotify.connected" #toolbar>
      <ListeningNav>
        <span class="spacer" />
        <NxIconButton
          icon="refresh"
          label="Sync with Spotify"
          :disabled="spotify.syncPending"
          :class="{ spinning: spotify.syncPending }"
          @click="spotify.syncNow()"
        />
        <Button rounded text severity="secondary" label="Disconnect" @click="confirmDisconnect" />
      </ListeningNav>
    </template>

    <div v-if="spotify.connected" class="blocks">
      <Message v-if="spotify.needsReauth" severity="warn" :closable="false" class="reauth">
        Spotify needs re-authorising<template v-if="spotify.status?.missing_scopes?.length">
          (missing {{ spotify.status.missing_scopes.join(', ') }})</template
        >.
        <Button size="small" rounded label="Reconnect" @click="spotify.connect()" />
      </Message>

      <div class="two">
        <section v-reveal>
          <NxSectionHeader title="Recently played" action-label="Your stats" :to="{ name: 'spotify-stats' }" />
          <NxSkeletonRows v-if="spotify.recentlyLoading && !recent.length" :rows="6" />
          <p v-else-if="!recent.length" class="empty">No recent plays yet. Listen on Spotify, then sync.</p>
          <div v-else>
            <NexusSpotifyTrackRow
              v-for="(row, i) in recent"
              :key="`${row.played_at}-${row.track!.id}`"
              class="track-row"
              :class="{ 'is-active': isPlaying && spotify.player?.item?.uri === row.track!.uri }"
              :style="{ '--i': i }"
              :track="row.track!"
              :meta="relativeTime(row.played_at)"
              @play="spotify.playTrackUri(row.track!.uri)"
            />
          </div>
        </section>
        <div v-reveal class="stack">
          <NxPanel v-if="spotify.player?.item"><NexusSpotifyTrackMetrics /></NxPanel>
        </div>
      </div>

      <section v-reveal>
        <NxSectionHeader title="Playlists" action-label="New playlist" @action="createOpen = true" />
        <NxSkeletonRows v-if="spotify.playlistsLoading && !spotify.playlists.length" :rows="3" />
        <p v-else-if="!spotify.playlists.length" class="empty">No playlists synced yet.</p>
        <NxCoverGrid v-else :min="168">
          <NxCoverCard
            v-for="(p, idx) in spotify.playlists"
            :key="p.id"
            class="pl-card"
            :style="{ '--i': idx % 10 }"
            :to="{ name: 'spotify-playlist', params: { playlistId: p.id } }"
            :title="p.name"
            :sub="plural(p.item_count, 'track')"
            :src="p.image_url"
            aspect="square"
            icon="queue"
          />
        </NxCoverGrid>
      </section>

      <div class="two">
        <section v-reveal>
          <NxSectionHeader title="On repeat" />
          <p v-if="!onRepeat.length" class="empty">Play a track a few times this week and it lands here.</p>
          <div v-else>
            <NexusSpotifyTrackRow
              v-for="(item, i) in onRepeat"
              :key="item.track.id"
              class="track-row"
              :class="{ 'is-active': isPlaying && spotify.player?.item?.uri === item.track.uri }"
              :style="{ '--i': i }"
              :track="item.track"
              :index="i + 1"
              :meta="plural(item.play_count, 'play')"
              @play="spotify.playTrackUri(item.track.uri)"
            />
          </div>
        </section>
        <section v-reveal>
          <NxSectionHeader title="For you" />
          <NxChips v-if="genres.length" :items="genres" label="Your genres" class="genres" />
          <NxSkeletonRows v-if="spotify.tasteLoading && !suggestions.length" :rows="4" />
          <p v-else-if="!suggestions.length" class="empty">Suggestions appear once recent and top tracks sync.</p>
          <div v-else>
            <NexusSpotifyTrackRow
              v-for="(item, i) in suggestions"
              :key="item.track.id"
              class="track-row"
              :class="{ 'is-active': isPlaying && spotify.player?.item?.uri === item.track.uri }"
              :style="{ '--i': i }"
              :track="item.track"
              :subtitle="item.reason"
              @play="spotify.playTrackUri(item.track.uri)"
            />
          </div>
        </section>
      </div>
    </div>
  </IndexTemplate>

  <Dialog v-model:visible="createOpen" modal header="New playlist" :style="{ width: 'min(30rem, 94vw)' }">
    <form id="new-playlist" class="nx-form" @submit.prevent="submitCreatePlaylist">
      <label class="f">
        <span>Name</span>
        <InputText v-model="newPlaylist.name" autofocus />
      </label>
      <label class="f">
        <span>Description</span>
        <Textarea v-model="newPlaylist.description" rows="3" auto-resize />
      </label>
    </form>
    <template #footer>
      <Button label="Cancel" text severity="secondary" @click="createOpen = false" />
      <Button
        type="submit"
        form="new-playlist"
        rounded
        label="Create playlist"
        :loading="creating"
        :disabled="!newPlaylist.name.trim()"
      />
    </template>
  </Dialog>
</template>

<style scoped>
.mark {
  width: 100%;
  height: 100%;
  display: grid;
  place-items: center;
  color: #1ed760;
  background: radial-gradient(circle at 30% 25%, rgb(30 215 96 / 0.22), transparent 70%);
}

.lede-link:hover {
  color: var(--ink);
  text-decoration: underline;
}

.spacer {
  flex: 1;
}

.spinning :deep(svg) {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.blocks {
  display: flex;
  flex-direction: column;
  gap: 48px;
}

.reauth :deep(.p-message-text) {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px;
}

.two {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 40px;
}

.stack {
  display: flex;
  flex-direction: column;
  gap: 28px;
  min-width: 0;
}

section {
  min-width: 0;
}

.genres {
  margin-bottom: 14px;
}

.empty {
  margin: 0;
  font-size: 14px;
  color: var(--ink-3);
}

@media (max-width: 960px) {
  .two {
    grid-template-columns: minmax(0, 1fr);
    gap: 36px;
  }
}

@media (max-width: 640px) {
  .blocks {
    gap: 36px;
  }
}

.spotify-page {
  position: relative;
  z-index: 1;
}

.spotify-page :deep(.nx-stage .visual) {
  transform: perspective(900px)
    translate3d(0, calc(var(--sy, 0) * 0.32px), 0)
    scale(calc(max(0.86, 1 - var(--sy, 0) * 0.0004)))
    rotateX(calc(min(10deg, var(--sy, 0) * 0.03deg)));
  opacity: calc(max(0.2, 1 - var(--sy, 0) * 0.002));
  will-change: transform, opacity;
  box-shadow: 0 28px 64px -16px color-mix(in srgb, var(--acc) 40%, rgb(0 0 0 / 0.6));
}

.spotify-page :deep(.nx-stage .copy) {
  transform: translate3d(0, calc(var(--sy, 0) * 0.14px), 0);
  will-change: transform;
}

.hero-art {
  width: 100%;
  height: 100%;
  display: grid;
  place-items: center;
}

.hero-art.playing img {
  animation: cover-breathe 9s ease-in-out infinite alternate;
}

@keyframes cover-breathe {
  0% { transform: scale(1); }
  100% { transform: scale(1.05); }
}

.reveal-init {
  opacity: 0;
  transform: translate3d(0, 34px, 0) scale(0.975);
  transition:
    opacity 0.7s cubic-bezier(0.22, 1, 0.36, 1),
    transform 0.7s cubic-bezier(0.22, 1, 0.36, 1);
  will-change: opacity, transform;
}

.reveal-init.reveal-in {
  opacity: 1;
  transform: translate3d(0, 0, 0) scale(1);
}

.reveal-init .pl-card {
  opacity: 0;
  transform: translate3d(0, 22px, 0) scale(0.96);
  transition:
    opacity 0.55s cubic-bezier(0.22, 1, 0.36, 1),
    transform 0.55s cubic-bezier(0.22, 1, 0.36, 1);
  transition-delay: calc(var(--i, 0) * 45ms);
}

.reveal-init.reveal-in .pl-card {
  opacity: 1;
  transform: translate3d(0, 0, 0) scale(1);
}

.pl-card:hover {
  transform: translate3d(0, -6px, 0) scale(1.02) !important;
  filter: drop-shadow(0 16px 28px color-mix(in srgb, var(--acc) 28%, transparent));
}

.reveal-init .track-row {
  opacity: 0;
  transform: translate3d(-10px, 14px, 0);
  transition:
    opacity 0.5s cubic-bezier(0.22, 1, 0.36, 1),
    transform 0.5s cubic-bezier(0.22, 1, 0.36, 1),
    background 0.2s var(--ease);
  transition-delay: calc(var(--i, 0) * 35ms);
}

.reveal-init.reveal-in .track-row {
  opacity: 1;
  transform: translate3d(0, 0, 0);
}

.track-row:hover {
  transform: translate3d(4px, 0, 0) !important;
}

.track-row.is-active {
  background: color-mix(in srgb, var(--acc) 12%, transparent);
  border-radius: var(--r-md, 10px);
  box-shadow: inset 2px 0 0 var(--acc);
}

.eq {
  display: inline-flex;
  align-items: flex-end;
  gap: 2.5px;
  height: 13px;
}

.eq i {
  width: 2.5px;
  height: 100%;
  border-radius: 2px;
  background: var(--acc);
  transform-origin: bottom;
  animation: eq-bar 0.7s ease-in-out infinite alternate;
}

.eq i:nth-child(2) { animation-delay: 0.18s; }
.eq i:nth-child(3) { animation-delay: 0.36s; }
.eq i:nth-child(4) { animation-delay: 0.12s; }

@keyframes eq-bar {
  0% { transform: scaleY(0.25); }
  100% { transform: scaleY(1); }
}

.hero-art img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.aurora {
  position: fixed;
  inset: -10% 0 -25%;
  pointer-events: none;
  z-index: 0;
  overflow: hidden;
  will-change: transform;
}

.aurora-blob {
  position: absolute;
  border-radius: 50%;
  filter: blur(80px);
  opacity: 0.42;
  transition: background 0.9s var(--ease);
}

.aurora-blob.b1 {
  width: 420px;
  height: 420px;
  background: var(--acc);
  top: -80px;
  right: 8%;
  animation: aurora1 13s ease-in-out infinite alternate;
}

.aurora-blob.b2 {
  width: 480px;
  height: 480px;
  background: var(--amb-2);
  top: 80px;
  left: -100px;
  opacity: 0.52;
  animation: aurora2 16s ease-in-out infinite alternate;
}

.aurora-blob.b3 {
  width: 320px;
  height: 320px;
  background: color-mix(in srgb, var(--acc) 55%, var(--amb-2));
  top: 220px;
  right: 26%;
  opacity: 0.32;
  animation: aurora3 11s ease-in-out infinite alternate;
}

.aurora-art {
  position: absolute;
  inset: -6% 0 15%;
  background-size: cover;
  background-position: center 30%;
  filter: blur(26px) saturate(1.3);
  mask-image: linear-gradient(to bottom, #000 0%, rgb(0 0 0 / 0.65) 55%, transparent 100%);
  -webkit-mask-image: linear-gradient(to bottom, #000 0%, rgb(0 0 0 / 0.65) 55%, transparent 100%);
  will-change: transform, opacity;
}

.aurora.paused .aurora-blob {
  animation-play-state: paused;
}

@keyframes aurora1 {
  0% { transform: translate(0, 0) scale(1); }
  100% { transform: translate(-160px, 100px) scale(1.18); }
}

@keyframes aurora2 {
  0% { transform: translate(0, 0) scale(1); }
  100% { transform: translate(180px, -60px) scale(1.15); }
}

@keyframes aurora3 {
  0% { transform: translate(0, 0) scale(0.95); }
  100% { transform: translate(-100px, 70px) scale(1.16); }
}

@media (prefers-reduced-motion: reduce) {
  .aurora {
    transform: none !important;
  }
  .hero-art {
    transform: none !important;
    opacity: 1 !important;
  }
  .aurora-art {
    display: none;
  }
  .aurora-blob {
    animation: none;
  }
}
</style>
