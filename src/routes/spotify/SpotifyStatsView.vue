<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import StatsTemplate from '@design/templates/StatsTemplate.vue'
import type { ViewState } from '@design/templates/types'
import NxStage from '@design/components/NxStage.vue'
import NxPanel from '@design/components/NxPanel.vue'
import NxPillGroup from '@design/components/NxPillGroup.vue'
import NxRankList, { type RankItem } from '@design/components/NxRankList.vue'
import NxHourBars from '@design/components/NxHourBars.vue'
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

const statsReadyOnce = ref(false)

onMounted(() => {
  void spotify.loadHub()
})

watch(
  [() => spotify.connected, range],
  async ([connected, nextRange]) => {
    if (!connected) return
    await spotify.loadStats(nextRange)
    statsReadyOnce.value = true
  },
  { immediate: true },
)

const stats = computed(() => spotify.stats)
const summary = computed(() => stats.value?.summary ?? null)

const state = computed<ViewState>(() => {
  if (
    spotify.statusLoading ||
    (spotify.connected && !stats.value && (spotify.statsLoading || !statsReadyOnce.value))
  ) {
    return 'loading'
  }
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

const topAlbums = computed<RankItem[]>(() =>
  (stats.value?.top_albums ?? []).slice(0, 10).map((row) => ({
    id: row.name,
    title: row.name,
    sub: `${row.artist} · ${row.plays}× · ${row.minutes} min`,
    image: row.image_url ?? null,
  })),
)

const hoveredDay = ref<{ date: string; plays: number; minutes: number } | null>(null)
const selectedDay = ref<{ date: string; plays: number; minutes: number } | null>(null)
const activeHeatDay = computed(() => hoveredDay.value ?? selectedDay.value)

const heatmapWeeks = computed(() => {
  const map = new Map((stats.value?.heatmap ?? []).map((d) => [d.date, d]))
  const maxPlays = Math.max(1, ...(stats.value?.heatmap ?? []).map((d) => d.plays))
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  // Align end to Saturday of current week or today; 52 weeks = 364 days
  const start = new Date(today)
  start.setDate(start.getDate() - 363)
  // Pad back to Monday
  const day = (start.getDay() + 6) % 7
  start.setDate(start.getDate() - day)

  const weeks: Array<Array<{ date: string; plays: number; minutes: number; level: number }>> = []
  const cur = new Date(start)
  while (cur <= today) {
    const col: Array<{ date: string; plays: number; minutes: number; level: number }> = []
    for (let r = 0; r < 7; r++) {
      const iso = `${cur.getFullYear()}-${String(cur.getMonth() + 1).padStart(2, '0')}-${String(cur.getDate()).padStart(2, '0')}`
      const hit = cur <= today ? map.get(iso) : undefined
      const plays = hit?.plays ?? 0
      const minutes = hit?.minutes ?? 0
      const ratio = plays / maxPlays
      const level = plays === 0 ? 0 : ratio >= 0.75 ? 4 : ratio >= 0.45 ? 3 : ratio >= 0.2 ? 2 : 1
      col.push({ date: iso, plays, minutes, level })
      cur.setDate(cur.getDate() + 1)
    }
    weeks.push(col)
  }
  return weeks
})

const timeline = computed(() => stats.value?.timeline ?? [])
const latestObsession = computed(() => (timeline.value.length ? timeline.value[timeline.value.length - 1]! : null))
const earlierObsessions = computed(() => (timeline.value.length > 1 ? timeline.value.slice(0, -1).reverse() : []))
const loyalty = computed(() => stats.value?.loyalty ?? null)
const milestones = computed(() => stats.value?.milestones ?? null)

function shortDate(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number)
  if (!y || !m || !d) return iso
  return new Date(y, m - 1, d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

const milestoneRows = computed(() => {
  const m = milestones.value
  if (!m) return []
  return [
    { key: 'all', icon: '★', label: 'All-time plays', sub: null, value: m.all_time_plays.toLocaleString() },
    ...(m.peak_day
      ? [{ key: 'peak', icon: '⚡', label: 'Peak day', sub: shortDate(m.peak_day.date), value: `${m.peak_day.plays}× · ${m.peak_day.minutes}m` }]
      : []),
    ...(m.obsessed_day
      ? [{ key: 'obs', icon: '↻', label: 'Single-day repeat', sub: shortDate(m.obsessed_day.date), value: `${m.obsessed_day.track_name} · ${m.obsessed_day.plays}×` }]
      : []),
    ...(m.first_play
      ? [{ key: 'first', icon: '♪', label: 'First logged', sub: shortDate(m.first_play.date), value: m.first_play.track_name }]
      : []),
  ]
})

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
const hourValues = computed(() => hours.value.map((h) => h.plays))
const hourDetails = computed(() =>
  hours.value.map(
    (h) => `${String(h.hour).padStart(2, '0')}:00 · ${plural(h.plays, 'play')} · ${h.minutes} min`,
  ),
)

const weekdays = computed(() => stats.value?.clock?.weekdays ?? [])
const weekdayValues = computed(() => weekdays.value.map((d) => d.plays))
const weekdayDetails = computed(() =>
  weekdays.value.map((d) => `${d.day} · ${plural(d.plays, 'play')} · ${d.minutes} min`),
)
const peakWeekday = computed(() => {
  const list = weekdays.value
  if (!list.some((d) => d.plays > 0)) return null
  return list.reduce((best, cur) => (cur.plays > best.plays ? cur : best))
})

const SEG_COLORS = [
  'var(--acc)',
  'color-mix(in srgb, var(--acc) 62%, var(--surface))',
  'var(--ink-3)',
  'var(--tint-2)',
  'var(--line-strong)',
]

const decadesList = computed(() =>
  (stats.value?.decades ?? []).map((d, i) => ({
    ...d,
    pct: Math.round(d.share * 100),
    color: SEG_COLORS[i % SEG_COLORS.length]!,
  })),
)

const contextsList = computed(() =>
  (stats.value?.contexts ?? []).map((c, i) => ({
    ...c,
    pct: Math.round(c.share * 100),
    color: SEG_COLORS[i % SEG_COLORS.length]!,
  })),
)

const genresList = computed(() => {
  const list = (stats.value?.genres ?? []).slice(0, 6)
  const total = Math.max(1, list.reduce((sum, g) => sum + g.count, 0))
  return list.map((g, i) => ({
    genre: g.genre,
    label: capitalise(g.genre),
    count: g.count,
    pct: Math.round((g.count / total) * 100),
    color: SEG_COLORS[i % SEG_COLORS.length]!,
  }))
})

const dna = computed(() => audioMeters(stats.value?.audio?.averages))

const RADAR_SHORT: Record<string, string> = {
  energy: 'ENG',
  danceability: 'DNC',
  valence: 'MOOD',
  acousticness: 'ACOU',
  instrumentalness: 'INST',
  speechiness: 'SPK',
}

const radar = computed(() => {
  const traits = dna.value
  if (traits.length < 3) return null
  const r = 56
  const n = traits.length
  const rings = [1, 0.66, 0.33].map((scale) =>
    traits
      .map((_, i) => {
        const a = -Math.PI / 2 + (2 * Math.PI * i) / n
        return `${(Math.cos(a) * r * scale).toFixed(1)},${(Math.sin(a) * r * scale).toFixed(1)}`
      })
      .join(' '),
  )
  const axes = traits.map((t, i) => {
    const a = -Math.PI / 2 + (2 * Math.PI * i) / n
    const x = Math.cos(a) * r
    const y = Math.sin(a) * r
    const lx = Math.cos(a) * (r + 14)
    const ly = Math.sin(a) * (r + 14) + 3
    return {
      key: t.key,
      short: RADAR_SHORT[t.key] ?? t.label.slice(0, 4).toUpperCase(),
      x: x.toFixed(1),
      y: y.toFixed(1),
      lx: lx.toFixed(1),
      ly: ly.toFixed(1),
      anchor: Math.abs(lx) < 6 ? 'middle' : lx > 0 ? 'start' : 'end',
    }
  })
  const polygon = traits
    .map((t, i) => {
      const a = -Math.PI / 2 + (2 * Math.PI * i) / n
      const val = Math.max(0.06, t.value) * r
      return `${(Math.cos(a) * val).toFixed(1)},${(Math.sin(a) * val).toFixed(1)}`
    })
    .join(' ')
  return { rings, axes, polygon }
})

const soundVibe = computed(() => {
  const avg = stats.value?.audio?.averages
  if (!avg) return null
  const energy = typeof avg.energy === 'number' ? Math.round(avg.energy * 100) : null
  const mood = typeof avg.valence === 'number' ? Math.round(avg.valence * 100) : null
  if (energy === null || mood === null) return null
  const tone =
    energy >= 65 && mood >= 55
      ? 'High-energy & upbeat'
      : energy >= 65
        ? 'High-energy & intense'
        : mood >= 55
          ? 'Easygoing & bright'
          : 'Chill & atmospheric'
  return { tone, energy, mood }
})

const habitFacts = computed(() => {
  const s = summary.value
  const tempo = stats.value?.audio?.averages?.tempo
  if (!s) return []
  return [
    ...(typeof tempo === 'number' ? [{ label: 'Avg tempo', value: `${Math.round(tempo)} BPM` }] : []),
    ...(s.completion_rate != null ? [{ label: 'Full listens', value: `${Math.round(s.completion_rate * 100)}%` }] : []),
    ...(s.discovery_rate != null ? [{ label: 'Discovery', value: `${Math.round(s.discovery_rate * 100)}% new` }] : []),
    { label: 'Explicit', value: `${Math.round(s.explicit_pct * 100)}%` },
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
          :values="hourValues"
          :ticks="hourTicks"
          :details="hourDetails"
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
          :values="weekdayValues"
          :ticks="weekdays.map((d) => d.day.slice(0, 3))"
          :details="weekdayDetails"
          show-values
          :height="140"
          label="Plays by weekday"
        />
        <NxSerifSummary v-if="peakWeekday" size="md" class="say">
          <b>{{ peakWeekday.day }}</b> leads with <em>{{ plural(peakWeekday.plays, 'play') }}</em>
          ({{ peakWeekday.minutes }} min).
        </NxSerifSummary>
      </template>
      <p v-else class="empty">Not enough plays to see a pattern yet.</p>
    </NxPanel>

    <NxPanel title="Decades">
      <template #action>
        <span v-if="summary?.avg_release_year" class="pill-note">
          Avg year <b>{{ summary.avg_release_year }}</b>
        </span>
      </template>
      <template v-if="decadesList.length">
        <div class="seg-bar" aria-label="Listening by decade">
          <div
            v-for="d in decadesList"
            :key="d.decade"
            class="seg"
            :style="{ width: `${Math.max(2, d.pct)}%`, background: d.color }"
            :title="`${d.label}: ${d.pct}%`"
          />
        </div>
        <div class="seg-rows">
          <div v-for="d in decadesList" :key="d.decade" class="seg-row">
            <span class="seg-left"><i class="seg-dot" :style="{ background: d.color }" />{{ d.label }}</span>
            <span class="seg-right">
              <span>{{ d.plays }}× · {{ d.minutes }}m</span>
              <span class="seg-pct">{{ d.pct }}%</span>
            </span>
          </div>
        </div>
        <NxSerifSummary v-if="summary?.oldest_track" size="md" class="say">
          Oldest track: <b>{{ summary.oldest_track.name }}</b> ({{ summary.oldest_track.release_year }}).
        </NxSerifSummary>
      </template>
      <p v-else class="empty">Run a sync or backfill to populate album release years.</p>
    </NxPanel>

    <NxPanel title="How you listen">
      <template #action>
        <span v-if="contextsList.length" class="pill-note">By source</span>
      </template>
      <template v-if="contextsList.length">
        <div class="seg-bar" aria-label="Listening context">
          <div
            v-for="c in contextsList"
            :key="c.type"
            class="seg"
            :style="{ width: `${Math.max(2, c.pct)}%`, background: c.color }"
            :title="`${c.label}: ${c.pct}%`"
          />
        </div>
        <div class="seg-legend">
          <span v-for="c in contextsList" :key="c.type" class="seg-legend-item">
            <i class="seg-dot" :style="{ background: c.color }" />
            {{ c.label }}
            <span class="seg-mono">{{ c.pct }}%</span>
          </span>
        </div>
      </template>
      <p v-else class="empty">Context breakdown appears as plays sync.</p>
      <div v-if="habitFacts.length" class="habit-grid">
        <div v-for="f in habitFacts" :key="f.label" class="habit-cell">
          <span class="habit-label">{{ f.label }}</span>
          <span class="habit-val">{{ f.value }}</span>
        </div>
      </div>
    </NxPanel>

    <NxPanel title="Top tracks">
      <NxRankList v-if="topTracks.length" :items="topTracks" shape="square" />
      <p v-else class="empty">No top tracks for this range yet.</p>
    </NxPanel>

    <NxPanel title="Top albums">
      <NxRankList v-if="topAlbums.length" :items="topAlbums" shape="square" />
      <p v-else class="empty">No top albums for this range yet.</p>
    </NxPanel>

    <NxPanel title="Year in listening" class="wide">
      <template #action>
        <span class="pill-note">
          {{
            activeHeatDay
              ? `${activeHeatDay.date} · ${plural(activeHeatDay.plays, 'play')} · ${activeHeatDay.minutes} min`
              : 'Hover or tap a day'
          }}
        </span>
      </template>
      <div class="heatmap" role="grid" aria-label="Listening activity over the last year">
        <div v-for="(week, wi) in heatmapWeeks" :key="wi" class="hm-col">
          <button
            v-for="cell in week"
            :key="cell.date"
            type="button"
            class="hm-cell"
            :class="[`lv-${cell.level}`, { active: activeHeatDay?.date === cell.date }]"
            :title="`${cell.date}: ${plural(cell.plays, 'play')} · ${cell.minutes} min`"
            :aria-label="`${cell.date}: ${cell.plays} plays, ${cell.minutes} min`"
            @mouseenter="hoveredDay = cell"
            @mouseleave="hoveredDay = null"
            @focus="hoveredDay = cell"
            @blur="hoveredDay = null"
            @click="selectedDay = selectedDay?.date === cell.date ? null : cell"
          />
        </div>
      </div>
      <div class="hm-foot">
        <span class="hm-months">Last 12 months</span>
        <span class="hm-scale">
          <span>Less</span>
          <i class="hm-swatch lv-0" />
          <i class="hm-swatch lv-1" />
          <i class="hm-swatch lv-2" />
          <i class="hm-swatch lv-3" />
          <i class="hm-swatch lv-4" />
          <span>More</span>
        </span>
      </div>
    </NxPanel>

    <NxPanel title="Obsessions">
      <template #action>
        <span v-if="timeline.length" class="pill-note">#1 artist per period</span>
      </template>
      <template v-if="latestObsession">
        <div class="obs-hero">
          <img
            v-if="latestObsession.top_artist_image"
            :src="latestObsession.top_artist_image"
            alt=""
            class="obs-hero-img"
          />
          <div v-else class="obs-hero-img obs-hero-fallback">
            {{ latestObsession.top_artist.charAt(0) }}
          </div>
          <div class="obs-hero-meta">
            <div class="obs-hero-kicker">Latest · {{ latestObsession.label }}</div>
            <div class="obs-hero-name">{{ latestObsession.top_artist }}</div>
            <div class="obs-hero-sub">
              {{ latestObsession.artist_plays }} of {{ latestObsession.total_plays }} plays
              ({{ Math.round(latestObsession.share * 100) }}%) · {{ latestObsession.minutes }} min
            </div>
          </div>
        </div>
        <div v-if="earlierObsessions.length" class="seg-rows">
          <div v-for="t in earlierObsessions" :key="t.period" class="seg-row">
            <span class="seg-left">
              <img v-if="t.top_artist_image" :src="t.top_artist_image" alt="" class="obs-avatar" />
              <i v-else class="seg-dot" style="background: var(--acc)" />
              <span>{{ t.label }}</span>
              <span class="obs-artist">{{ t.top_artist }}</span>
            </span>
            <span class="seg-right">
              <span>{{ t.artist_plays }}/{{ t.total_plays }}×</span>
              <span class="seg-pct">{{ Math.round(t.share * 100) }}%</span>
            </span>
          </div>
        </div>
        <p v-else class="obs-note">Earlier periods appear here as listening history grows.</p>
      </template>
      <p v-else class="empty">Not enough history for an obsession timeline yet.</p>
    </NxPanel>

    <NxPanel title="Loyalty &amp; milestones">
      <template #action>
        <span v-if="loyalty?.top5_share != null" class="pill-note">
          Top 5 = <b>{{ Math.round(loyalty.top5_share * 100) }}%</b>
        </span>
      </template>
      <template v-if="loyalty?.top5_share != null">
        <div class="seg-bar" aria-label="Top 5 artist concentration">
          <div class="seg" :style="{ width: `${Math.max(2, Math.round(loyalty.top5_share * 100))}%`, background: 'var(--acc)' }" />
          <div
            v-if="loyalty.top5_share < 1"
            class="seg"
            :style="{ width: `${Math.max(2, Math.round((1 - loyalty.top5_share) * 100))}%`, background: 'var(--tint-2)' }"
          />
        </div>
        <NxSerifSummary size="md" class="say">
          You spread <em>{{ Math.round((1 - loyalty.top5_share) * 100) }}%</em> of plays across
          {{ plural(Math.max(0, loyalty.total_artists - 5), 'other artist') }}.
        </NxSerifSummary>
      </template>
      <div v-if="milestoneRows.length" class="seg-rows">
        <div v-for="m in milestoneRows" :key="m.key" class="seg-row">
          <span class="seg-left">
            <span class="ms-icon">{{ m.icon }}</span>
            <span>{{ m.label }}</span>
            <span v-if="m.sub" class="ms-sub">· {{ m.sub }}</span>
          </span>
          <span class="seg-right ms-val">{{ m.value }}</span>
        </div>
      </div>
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
      <template #action>
        <span v-if="genresList.length" class="pill-note">
          Top <b>{{ genresList[0]!.label }}</b>
        </span>
      </template>
      <template v-if="genresList.length">
        <div class="seg-bar" aria-label="Listening by genre">
          <div
            v-for="g in genresList"
            :key="g.genre"
            class="seg"
            :style="{ width: `${Math.max(2, g.pct)}%`, background: g.color }"
            :title="`${g.label}: ${g.pct}%`"
          />
        </div>
        <div class="seg-rows">
          <div v-for="g in genresList" :key="g.genre" class="seg-row">
            <span class="seg-left"><i class="seg-dot" :style="{ background: g.color }" />{{ g.label }}</span>
            <span class="seg-right">
              <span>{{ g.count }}×</span>
              <span class="seg-pct">{{ g.pct }}%</span>
            </span>
          </div>
        </div>
        <NxSerifSummary size="md" class="say">
          Mostly <em>{{ genresList[0]!.label }}</em> across {{ plural(genresList.length, 'tagged genre') }}.
        </NxSerifSummary>
      </template>
      <p v-else class="empty">Genres appear once your top artists sync.</p>
    </NxPanel>

    <NxPanel title="Sound profile">
      <template #action>
        <span v-if="dna.length" class="pill-note">Audio DNA</span>
      </template>
      <template v-if="dna.length">
        <div class="sound-body">
          <svg
            v-if="radar"
            class="radar"
            width="176"
            height="164"
            viewBox="-96 -86 192 172"
            aria-label="Audio DNA radar"
          >
            <polygon
              v-for="(pts, i) in radar.rings"
              :key="i"
              :points="pts"
              fill="none"
              stroke="var(--line-strong)"
              stroke-opacity="0.55"
            />
            <line
              v-for="ax in radar.axes"
              :key="`ax-${ax.key}`"
              x1="0"
              y1="0"
              :x2="ax.x"
              :y2="ax.y"
              stroke="var(--line-strong)"
              stroke-opacity="0.45"
            />
            <polygon
              :points="radar.polygon"
              fill="var(--acc)"
              fill-opacity="0.22"
              stroke="var(--acc)"
              stroke-width="1.8"
            />
            <text
              v-for="ax in radar.axes"
              :key="`lbl-${ax.key}`"
              :x="ax.lx"
              :y="ax.ly"
              :text-anchor="ax.anchor"
              fill="var(--ink-3)"
              font-size="9"
              font-family="var(--font-mono)"
            >
              {{ ax.short }}
            </text>
          </svg>
          <div class="trait-grid">
            <div v-for="t in dna" :key="t.key" class="trait-cell">
              <span class="trait-name">{{ t.label }}</span>
              <span class="trait-val">{{ Math.round(t.value * 100) }}%</span>
            </div>
          </div>
        </div>
        <NxSerifSummary v-if="soundVibe" size="md" class="say">
          {{ soundVibe.tone }} — <em>{{ soundVibe.energy }}% energy</em>, <em>{{ soundVibe.mood }}% mood</em>.
        </NxSerifSummary>
      </template>
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

.pill-note {
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--ink-3);
}

.pill-note b {
  color: var(--acc);
  font-weight: 500;
}

.seg-bar {
  height: 12px;
  border-radius: 999px;
  overflow: hidden;
  display: flex;
  gap: 2px;
  background: var(--tint);
}

.seg {
  height: 100%;
  border-radius: 2px;
}

.seg:first-child {
  border-radius: 999px 2px 2px 999px;
}

.seg:last-child {
  border-radius: 2px 999px 999px 2px;
}

.seg:only-child {
  border-radius: 999px;
}

.seg-rows {
  display: flex;
  flex-direction: column;
  margin-top: 16px;
}

.seg-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 9px 0;
  border-bottom: 1px solid var(--line);
  font-size: 13px;
}

.seg-row:last-child {
  border-bottom: 0;
}

.seg-left {
  display: flex;
  align-items: center;
  gap: 10px;
  color: var(--ink);
  font-weight: 500;
}

.seg-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

.seg-right {
  display: flex;
  align-items: center;
  gap: 12px;
  font-family: var(--font-mono);
  font-size: 12px;
  color: var(--ink-3);
}

.seg-pct {
  color: var(--ink-2);
  min-width: 34px;
  text-align: right;
}

.seg-legend {
  display: flex;
  flex-wrap: wrap;
  gap: 14px;
  margin-top: 14px;
  font-size: 12px;
  color: var(--ink-2);
}

.seg-legend-item {
  display: inline-flex;
  align-items: center;
  gap: 7px;
}

.seg-mono {
  font-family: var(--font-mono);
  color: var(--ink-3);
  font-size: 11px;
}

.habit-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
  margin-top: 18px;
}

.habit-cell {
  background: var(--tint);
  border: 1px solid var(--line);
  border-radius: var(--r-sm, 10px);
  padding: 11px 13px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.habit-label {
  font-family: var(--font-mono);
  font-size: 10px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--ink-3);
}

.habit-val {
  font-size: 15px;
  font-weight: 500;
  color: var(--ink);
}

.sound-body {
  display: grid;
  grid-template-columns: 176px 1fr;
  gap: 18px;
  align-items: center;
}

@media (max-width: 560px) {
  .sound-body {
    grid-template-columns: 1fr;
  }
  .radar {
    margin: 0 auto;
  }
}

.trait-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
}

.trait-cell {
  background: var(--tint);
  border: 1px solid var(--line);
  border-radius: var(--r-sm, 10px);
  padding: 9px 11px;
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 8px;
}

.trait-name {
  font-size: 12px;
  color: var(--ink-2);
}

.trait-val {
  font-family: var(--font-mono);
  font-size: 12px;
  color: var(--acc);
  font-weight: 500;
}

.heatmap {
  display: grid;
  grid-auto-flow: column;
  grid-auto-columns: minmax(8px, 1fr);
  gap: 3px;
  overflow-x: auto;
  padding-bottom: 4px;
}

.hm-col {
  display: grid;
  grid-template-rows: repeat(7, 1fr);
  gap: 3px;
}

.hm-cell {
  aspect-ratio: 1;
  width: 100%;
  min-width: 8px;
  border: 0;
  padding: 0;
  border-radius: 2px;
  background: var(--tint);
  cursor: pointer;
}

.hm-cell.lv-1 {
  background: color-mix(in srgb, var(--acc) 25%, var(--surface));
}
.hm-cell.lv-2 {
  background: color-mix(in srgb, var(--acc) 50%, var(--surface));
}
.hm-cell.lv-3 {
  background: color-mix(in srgb, var(--acc) 75%, var(--surface));
}
.hm-cell.lv-4 {
  background: var(--acc);
}

.hm-cell.active {
  outline: 1.5px solid var(--ink);
  outline-offset: 1px;
}

.hm-foot {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 10px;
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--ink-3);
}

.hm-scale {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.hm-swatch {
  width: 10px;
  height: 10px;
  border-radius: 2px;
  display: inline-block;
  background: var(--tint);
}

.hm-swatch.lv-1 {
  background: color-mix(in srgb, var(--acc) 25%, var(--surface));
}
.hm-swatch.lv-2 {
  background: color-mix(in srgb, var(--acc) 50%, var(--surface));
}
.hm-swatch.lv-3 {
  background: color-mix(in srgb, var(--acc) 75%, var(--surface));
}
.hm-swatch.lv-4 {
  background: var(--acc);
}

.obs-avatar {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  object-fit: cover;
  flex-shrink: 0;
}

.obs-artist {
  color: var(--ink-2);
  font-weight: 400;
}

.obs-hero {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 14px 16px;
  background: var(--tint);
  border: 1px solid var(--line);
  border-radius: var(--r-md, 12px);
}

.obs-hero-img {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  object-fit: cover;
  flex-shrink: 0;
}

.obs-hero-fallback {
  background: var(--acc);
  color: var(--bg);
  display: grid;
  place-items: center;
  font-family: var(--font-serif);
  font-size: 24px;
}

.obs-hero-meta {
  min-width: 0;
  flex: 1;
}

.obs-hero-kicker {
  font-family: var(--font-mono);
  font-size: 10px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--acc);
  margin-bottom: 3px;
}

.obs-hero-name {
  font-family: var(--font-serif);
  font-size: 24px;
  line-height: 1.1;
  color: var(--ink);
}

.obs-hero-sub {
  font-size: 12px;
  color: var(--ink-3);
  margin-top: 4px;
}

.obs-note {
  margin: 16px 0 0;
  font-size: 12px;
  color: var(--ink-3);
}

.ms-icon {
  width: 26px;
  height: 26px;
  border-radius: 8px;
  background: var(--tint);
  border: 1px solid var(--line);
  display: grid;
  place-items: center;
  color: var(--acc);
  font-size: 12px;
  flex-shrink: 0;
}

.ms-sub {
  color: var(--ink-3);
  font-weight: 400;
  font-size: 12px;
}

.ms-val {
  color: var(--ink-2);
}
</style>
