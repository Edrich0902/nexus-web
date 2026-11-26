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
import NxFacts from '@design/components/NxFacts.vue'
import NxSerifSummary from '@design/components/NxSerifSummary.vue'
import NxEmptyState from '@design/components/NxEmptyState.vue'
import NexusSpotifyTrackRow from '@components/nexus-spotify-track-row/NexusSpotifyTrackRow.vue'
import CollectionFields from '@routes/collections/CollectionFields.vue'
import { plural, type CollectionField } from '@routes/collections/collectionFields'
import { useSpotifyStore } from '@stores/spotify/spotify.store'
import type { SpotifyStatsRange } from '@/types/spotify/spotify'
import ListeningNav from './ListeningNav.vue'
import { artistNames, audioMeters, capitalise } from './listening'

const spotify = useSpotifyStore()

const range = ref<SpotifyStatsRange>('30d')
const rangeOptions: Array<{ value: SpotifyStatsRange; label: string }> = [
  { value: '7d', label: '7 days' },
  { value: '30d', label: '30 days' },
  { value: '6m', label: '6 months' },
  { value: 'year', label: 'This year' },
  { value: 'all', label: 'All time' },
]

onMounted(async () => {
  await spotify.loadHub()
  if (spotify.connected) {
    await spotify.loadStats(range.value)
  }
})

watch(range, (next) => {
  if (spotify.connected) {
    void spotify.loadStats(next)
  }
})

const stats = computed(() => spotify.stats)
const summary = computed(() => stats.value?.summary ?? null)

const state = computed<ViewState>(() => {
  if (spotify.statusLoading || (spotify.connected && spotify.statsLoading && !stats.value)) return 'loading'
  if (!spotify.connected || !stats.value) return 'empty'
  return 'ready'
})

const lede = computed(() => {
  const s = summary.value
  if (!s) return 'What you play, when you play it and what keeps coming back.'
  const parts = [
    `${s.minutes_played.toLocaleString()} min across ${plural(s.plays, 'play')} (${plural(s.unique_tracks, 'track')}).`,
  ]
  if (s.top_genre) parts.push(`Mostly ${s.top_genre}${s.peak_bucket ? `, mostly in the ${s.peak_bucket}` : ''}.`)
  return parts.join(' ')
})

const fields = computed<CollectionField[]>(() => {
  const s = summary.value
  return [
    {
      key: 'minutes',
      label: 'Minutes played',
      value: s ? s.minutes_played.toLocaleString() : '—',
      sub: s ? `${s.hours_played} hr · ${s.daily_avg_minutes} min/day` : undefined,
      variant: 'solid',
      span: 4,
    },
    {
      key: 'plays',
      label: 'Plays',
      value: s ? s.plays.toLocaleString() : '—',
      sub: s ? `${s.unique_tracks.toLocaleString()} tracks · ${s.unique_artists.toLocaleString()} artists` : undefined,
      variant: 'tint',
      span: 3,
    },
    {
      key: 'streak',
      label: 'Active days',
      value: s ? s.active_days.toLocaleString() : '—',
      sub: s ? `${s.current_streak_days}d streak · ${s.longest_streak_days}d best` : undefined,
      variant: 'tint',
      span: 3,
    },
    s?.top_genre
      ? { key: 'genre', label: 'Top genre', title: capitalise(s.top_genre), variant: 'outline', span: 2 }
      : { key: 'genre', label: 'Top genre', title: '—', variant: 'outline', span: 2 },
  ]
})

const topArtists = computed<RankItem[]>(() =>
  (stats.value?.top_artists ?? []).slice(0, 10).map((row) => ({
    id: row.artist.id,
    title: row.artist.name,
    sub: [
      row.artist.genres?.[0] ? capitalise(row.artist.genres[0]) : null,
      row.plays != null ? `${row.plays}× · ${row.minutes ?? 0} min` : null,
    ]
      .filter(Boolean)
      .join(' · ') || undefined,
    image: row.artist.images?.[0]?.url ?? null,
    to: { name: 'spotify-artist', params: { artistId: row.artist.id } },
  })),
)

const topTracks = computed<RankItem[]>(() =>
  (stats.value?.top_tracks ?? []).slice(0, 10).map((row) => ({
    id: row.track.id,
    title: row.track.name,
    sub: [
      artistNames(row.track.artists),
      row.plays != null ? `${row.plays}× · ${row.minutes ?? 0} min` : null,
    ]
      .filter(Boolean)
      .join(' · '),
    image: row.track.album_image_url ?? null,
    to: row.track.album_id ? { name: 'spotify-album', params: { albumId: row.track.album_id } } : undefined,
  })),
)

const onRepeat = computed(() => stats.value?.on_repeat?.slice(0, 8) ?? [])

watch(
  () => onRepeat.value.map((r) => r.track.uri),
  (uris) => void spotify.refreshLikedUris(uris),
)

const hours = computed(() => stats.value?.clock?.hours ?? [])
const peakHour = computed(() => stats.value?.clock?.peak_hour ?? null)
const hasHours = computed(() => hours.value.some((h) => h.plays > 0))
const hourTicks = computed(() =>
  hours.value.map((h) => (h.hour % 6 === 0 ? `${String(h.hour).padStart(2, '0')}` : '')),
)

const weekdays = computed(() => stats.value?.clock?.weekdays ?? [])

const decades = computed<MeterItem[]>(() => {
  const list = stats.value?.decades ?? []
  const max = Math.max(1, ...list.map((d) => d.plays))
  return list.map((d) => ({
    key: String(d.decade),
    label: d.label,
    value: d.plays / max,
    display: `${d.plays}× · ${d.minutes}m`,
  }))
})

const contexts = computed<MeterItem[]>(() => {
  const list = stats.value?.contexts ?? []
  const max = Math.max(1, ...list.map((c) => c.plays))
  return list.map((c) => ({
    key: c.type,
    label: c.label,
    value: c.plays / max,
    display: `${Math.round(c.share * 100)}%`,
  }))
})

const genres = computed<MeterItem[]>(() => {
  const list = (stats.value?.genres ?? []).slice(0, 8)
  const max = Math.max(1, ...list.map((g) => g.count))
  return list.map((g) => ({ key: g.genre, label: capitalise(g.genre), value: g.count / max, display: String(g.count) }))
})

const dna = computed(() => audioMeters(stats.value?.audio?.averages))

const habitFacts = computed(() => {
  const s = summary.value
  const tempo = stats.value?.audio?.averages?.tempo
  if (!s) return []
  return [
    ...(typeof tempo === 'number' ? [{ label: 'Avg tempo', value: `${Math.round(tempo)} BPM` }] : []),
    ...(s.discovery_rate != null ? [{ label: 'Discovery', value: `${Math.round(s.discovery_rate * 100)}% new` }] : []),
    { label: 'Explicit', value: `${Math.round(s.explicit_pct * 100)}%` },
    ...(s.completion_rate != null ? [{ label: 'Full listens', value: `${Math.round(s.completion_rate * 100)}%` }] : []),
    ...(s.avg_release_year ? [{ label: 'Avg release year', value: String(s.avg_release_year) }] : []),
  ]
})
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

    <NxPanel title="Listening clock">
      <template v-if="hasHours">
        <NxHourBars
          :values="hours.map((h) => h.plays)"
          :ticks="hourTicks"
          :height="140"
          label="Plays by hour of day"
        />
        <NxSerifSummary v-if="peakHour !== null" size="md" class="say">
          Peak listening hour: <em>{{ String(peakHour).padStart(2, '0') }}:00</em>.
        </NxSerifSummary>
      </template>
      <p v-else class="empty">Not enough plays to see an hourly pattern yet.</p>
    </NxPanel>

    <NxPanel title="By weekday">
      <template v-if="weekdays.some((d) => d.plays > 0)">
        <NxHourBars
          :values="weekdays.map((d) => d.plays)"
          :ticks="weekdays.map((d) => d.day.slice(0, 3))"
          :height="140"
          label="Plays by weekday"
        />
      </template>
      <p v-else class="empty">Not enough plays to see a pattern yet.</p>
    </NxPanel>

    <NxPanel title="Decades">
      <template v-if="decades.length">
        <NxMeters :items="decades" :cols="1" />
        <NxSerifSummary v-if="summary?.oldest_track" size="md" class="say">
          Oldest track: <b>{{ summary.oldest_track.name }}</b> ({{ summary.oldest_track.release_year }}).
        </NxSerifSummary>
      </template>
      <p v-else class="empty">Run a sync or backfill to populate album release years.</p>
    </NxPanel>

    <NxPanel title="How you listen">
      <NxMeters v-if="contexts.length" :items="contexts" :cols="1" />
      <p v-else class="empty">Context breakdown appears as plays sync.</p>
      <NxFacts v-if="habitFacts.length" :items="habitFacts" class="say" />
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
          :meta="`${item.play_count}× · ${item.minutes}m`"
          @play="spotify.playTrackUri(item.track.uri)"
        />
      </div>
      <p v-else class="empty">Play the same track twice in this period to see it here.</p>
    </NxPanel>

    <NxPanel title="Genres">
      <NxMeters v-if="genres.length" :items="genres" :cols="1" />
      <p v-else class="empty">Genres appear once your top artists sync.</p>
    </NxPanel>

    <NxPanel title="Sound profile">
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
