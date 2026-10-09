<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import StatsTemplate from '@design/templates/StatsTemplate.vue'
import type { ViewState } from '@design/templates/types'
import NxStage from '@design/components/NxStage.vue'
import NxPanel from '@design/components/NxPanel.vue'
import NxPillGroup from '@design/components/NxPillGroup.vue'
import NxRankList, { type RankItem } from '@design/components/NxRankList.vue'
import NxHourBars from '@design/components/NxHourBars.vue'
import NxMeters, { type MeterItem } from '@design/components/NxMeters.vue'
import NxSerifSummary from '@design/components/NxSerifSummary.vue'
import NxEmptyState from '@design/components/NxEmptyState.vue'
import NexusSpotifyTrackRow from '@components/nexus-spotify-track-row/NexusSpotifyTrackRow.vue'
import CollectionFields from '@routes/collections/CollectionFields.vue'
import { plural, type CollectionField } from '@routes/collections/collectionFields'
import { useSpotifyStore } from '@stores/spotify/spotify.store'
import type { SpotifyTimeRange } from '@/types/spotify/spotify'
import ListeningNav from './ListeningNav.vue'
import { artistNames, audioMeters, capitalise } from './listening'

const spotify = useSpotifyStore()

const range = ref<SpotifyTimeRange>('short_term')
const rangeOptions = [
  { value: 'short_term' as const, label: '4 weeks' },
  { value: 'medium_term' as const, label: '6 months' },
  { value: 'long_term' as const, label: 'All time' },
]

const DAYPARTS = ['morning', 'afternoon', 'evening', 'night'] as const
const DAYPART_HOURS: Record<(typeof DAYPARTS)[number], string> = {
  morning: '05:00 to 12:00',
  afternoon: '12:00 to 17:00',
  evening: '17:00 to 22:00',
  night: '22:00 to 05:00',
}

onMounted(() => void spotify.loadHub())

const taste = computed(() => spotify.taste)
const summary = computed(() => taste.value?.summary ?? null)

const state = computed<ViewState>(() => {
  if (spotify.statusLoading || (spotify.connected && spotify.tasteLoading && !taste.value)) return 'loading'
  if (!spotify.connected || !taste.value) return 'empty'
  return 'ready'
})

const lede = computed(() => {
  const s = summary.value
  if (!s) return 'What you play, when you play it and what keeps coming back.'
  const parts = [`${plural(s.plays_last_7d, 'play')} this week across ${plural(s.unique_tracks_last_7d, 'track')}.`]
  if (s.top_genre) parts.push(`Mostly ${s.top_genre}${s.peak_bucket ? `, mostly in the ${s.peak_bucket}` : ''}.`)
  return parts.join(' ')
})

const fields = computed<CollectionField[]>(() => {
  const s = summary.value
  return [
    { key: 'plays', label: 'Plays · 7 days', value: s ? s.plays_last_7d.toLocaleString() : '—', variant: 'solid', span: 4 },
    { key: 'unique', label: 'Different tracks', value: s ? s.unique_tracks_last_7d.toLocaleString() : '—', variant: 'tint', span: 3 },
    s?.top_genre
      ? { key: 'genre', label: 'Top genre', title: capitalise(s.top_genre), variant: 'tint', span: 3 }
      : { key: 'genre', label: 'Top genre', title: '—', variant: 'outline', span: 3 },
    s?.peak_bucket
      ? { key: 'peak', label: 'Peak', title: capitalise(s.peak_bucket), variant: 'outline', span: 2 }
      : { key: 'peak', label: 'Peak', title: '—', variant: 'outline', span: 2 },
  ]
})

const topArtists = computed<RankItem[]>(() =>
  (taste.value?.top_artists?.[range.value] ?? []).slice(0, 10).map((row) => ({
    id: row.artist.id,
    title: row.artist.name,
    sub: row.artist.genres?.[0] ? capitalise(row.artist.genres[0]) : undefined,
    image: row.artist.images?.[0]?.url ?? null,
    to: { name: 'spotify-artist', params: { artistId: row.artist.id } },
  })),
)

const topTracks = computed<RankItem[]>(() =>
  (taste.value?.top_tracks?.[range.value] ?? []).slice(0, 10).map((row) => ({
    id: row.track.id,
    title: row.track.name,
    sub: artistNames(row.track.artists),
    image: row.track.album_image_url ?? null,
    to: row.track.album_id ? { name: 'spotify-album', params: { albumId: row.track.album_id } } : undefined,
  })),
)

const onRepeat = computed(() => taste.value?.on_repeat?.slice(0, 8) ?? [])

watch(
  () => onRepeat.value.map((r) => r.track.uri),
  (uris) => void spotify.refreshLikedUris(uris),
)

const dayparts = computed(() => {
  const buckets = taste.value?.time_of_day?.buckets ?? []
  const counts = DAYPARTS.map((d) => buckets.find((b) => b.bucket === d)?.count ?? 0)
  const total = counts.reduce((a, b) => a + b, 0)
  const peakIndex = counts.indexOf(Math.max(...counts))
  return { counts, total, peak: total ? DAYPARTS[peakIndex]! : null, share: total ? counts[peakIndex]! / total : 0 }
})

const weekdays = computed(() => taste.value?.time_of_day?.weekday ?? [])

const genres = computed<MeterItem[]>(() => {
  const list = (taste.value?.genres ?? []).slice(0, 8)
  const max = Math.max(1, ...list.map((g) => g.count))
  return list.map((g) => ({ key: g.genre, label: capitalise(g.genre), value: g.count / max, display: String(g.count) }))
})

const dna = computed(() => audioMeters(taste.value?.audio_metrics?.['7d']?.averages))
</script>

<template>
  <StatsTemplate :state="state">
    <template #stage>
      <NxStage size="compact" eyebrow="Listening" title="How you" accent="listen" :lede="lede" />
    </template>

    <template #range>
      <div class="range">
        <ListeningNav />
        <span class="spacer" />
        <NxPillGroup v-model="range" :options="rangeOptions" label="Time range" size="sm" />
      </div>
    </template>

    <template #empty>
      <NxEmptyState
        v-if="!spotify.connected"
        icon="listening"
        title="Connect Spotify first"
        body="Stats build up from what you play once Spotify is linked."
      >
        <Button rounded label="Connect Spotify" @click="spotify.connect()" />
      </NxEmptyState>
      <NxEmptyState v-else icon="listening" title="Not enough listening yet" body="Play some music, sync, and check back.">
        <Button rounded label="Sync now" :loading="spotify.syncPending" @click="spotify.syncNow()" />
      </NxEmptyState>
    </template>

    <template #fields>
      <CollectionFields section="listening" :fields="fields" />
    </template>

    <NxPanel title="Top artists" variant="flush" class="wide">
      <NxRankList v-if="topArtists.length" :items="topArtists" variant="circles" />
      <p v-else class="empty">No top artists for this range yet.</p>
    </NxPanel>

    <NxPanel title="When you listen">
      <template v-if="dayparts.total">
        <NxHourBars
          :values="dayparts.counts"
          :ticks="DAYPARTS.map(capitalise)"
          :height="140"
          label="Plays by time of day"
        />
        <NxSerifSummary v-if="dayparts.peak" size="md" class="say">
          Your <b>{{ dayparts.peak }}s</b> are the loudest:
          <em>{{ Math.round(dayparts.share * 100) }}%</em> of everything you play lands between
          {{ DAYPART_HOURS[dayparts.peak] }}.
        </NxSerifSummary>
      </template>
      <p v-else class="empty">Not enough plays to see a pattern yet.</p>
    </NxPanel>

    <NxPanel title="By weekday">
      <template v-if="weekdays.some((d) => d.count > 0)">
        <NxHourBars
          :values="weekdays.map((d) => d.count)"
          :ticks="weekdays.map((d) => d.day.slice(0, 3))"
          :height="140"
          label="Plays by weekday"
        />
      </template>
      <p v-else class="empty">Not enough plays to see a pattern yet.</p>
    </NxPanel>

    <NxPanel title="Top tracks">
      <NxRankList v-if="topTracks.length" :items="topTracks" shape="square" />
      <p v-else class="empty">No top tracks for this range yet.</p>
    </NxPanel>

    <NxPanel title="On repeat">
      <div v-if="onRepeat.length">
        <NexusSpotifyTrackRow
          v-for="item in onRepeat"
          :key="item.track.id"
          :track="item.track"
          :meta="`${item.play_count}×`"
          @play="spotify.playTrackUri(item.track.uri)"
        />
      </div>
      <p v-else class="empty">Play the same track twice in a week to see it here.</p>
    </NxPanel>

    <NxPanel title="Genres">
      <NxMeters v-if="genres.length" :items="genres" :cols="1" />
      <p v-else class="empty">Genres appear once your top artists sync.</p>
    </NxPanel>

    <NxPanel title="Sound of your week">
      <NxMeters v-if="dna.length" :items="dna" />
      <p v-else class="empty">An acoustic profile builds as you listen to full tracks.</p>
    </NxPanel>
  </StatsTemplate>
</template>

<style scoped>
.range {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px;
}

.spacer {
  flex: 1;
}

.say {
  margin-top: 22px;
}

.empty {
  margin: 0;
  font-size: 14px;
  color: var(--ink-3);
}
</style>
