import { computed, ref } from 'vue'
import type { RouteLocationRaw } from 'vue-router'
import { sections, type SectionKey } from '@design/tokens'
import { useNow } from '@/routes/f1/f1'
import { useSpotifyStore } from '@stores/spotify/spotify.store'
import { useGithubStore } from '@stores/github/github.store'
import { useF1Store } from '@stores/f1/f1.store'
import { useFoodDrinkStore } from '@stores/food-drink/food-drink.store'
import { useLibraryStore } from '@stores/library/library.store'
import { useSportsStore } from '@stores/sports/sports.store'
import type { FoodDrinkDashboard } from '@/types/food-drink/food-drink'
import type { F1HomeSnapshot } from '@/types/f1/f1'
import type { GithubPulse } from '@/types/github/github'
import type { LibraryPulse } from '@/types/library/library'
import type { SportsEventSummary } from '@/types/sports/sports'
import type { SpotifyTasteSnapshot } from '@/types/spotify/spotify'

export interface HomeField {
  key: string
  section: SectionKey
  label: string
  aside?: string
  value: string
  sub?: string
  span: number
  rows?: number
  valueSize?: number
  variant?: 'solid' | 'tint' | 'outline'
  to: RouteLocationRaw
  /** Drives the in-field flip animation. */
  slideId: string
  imageUrl?: string
}

export interface HomeUpcoming {
  key: string
  when: string
  section: SectionKey
  kind: string
  meta?: string
  title: string
  to: RouteLocationRaw
}

type Slide = {
  id: string
  label: string
  value: string
  sub?: string
  aside?: string
  valueSize?: number
  variant?: 'solid' | 'tint' | 'outline'
  to: RouteLocationRaw
  imageUrl?: string
}

const DAY_MS = 86_400_000
/** Seconds each slide stays; cards are phase-staggered within this window. */
const CYCLE_SECONDS = 60
/** Spread flips across the cycle so roughly one board face changes at a time. */
const STAGGER_SLOTS = 10
function daysUntil(iso: string | null | undefined): number | null {
  if (!iso) return null
  const t = new Date(iso).getTime()
  if (Number.isNaN(t)) return null
  return Math.ceil((t - Date.now()) / DAY_MS)
}

function shortDay(iso: string): string {
  const d = new Date(iso)
  const days = daysUntil(iso) ?? 99
  if (days <= 0) return d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
  if (days < 7) return d.toLocaleDateString(undefined, { weekday: 'short' })
  return d.toLocaleDateString(undefined, { day: 'numeric', month: 'short' })
}

const fmt = (n: number): string => n.toLocaleString()
const plural = (n: number, word: string): string => `${fmt(n)} ${word}${n === 1 ? '' : 's'}`

function salt(key: string): number {
  let h = 0
  for (let i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) >>> 0
  return h & 0xffff
}

function clip(raw: string | null | undefined, max = 36): string {
  const t = (raw ?? '').trim().replace(/\s+/g, ' ')
  if (t.length <= max) return t
  return `${t.slice(0, max - 1).trimEnd()}…`
}

function imgOf(item: { image_url?: string | null; media?: { url?: string | null } | null } | null | undefined): string | undefined {
  const url = item?.image_url || item?.media?.url
  return url || undefined
}

function cyclePhase(key: string): number {
  const slot = salt(key) % STAGGER_SLOTS
  return slot * Math.floor(CYCLE_SECONDS / STAGGER_SLOTS)
}

function pick<T extends { id: string }>(items: T[], nowMs: number, key: string): T {
  if (items.length <= 1) return items[0]!
  const elapsed = Math.floor(nowMs / 1000)
  return items[Math.floor((elapsed + cyclePhase(key)) / CYCLE_SECONDS) % items.length]!
}

function sportLabel(slug: string | null | undefined): string {
  switch (slug) {
    case 'football':
      return 'Football'
    case 'rugby':
      return 'Rugby'
    case 'golf':
      return 'Golf'
    case 'tennis':
      return 'Tennis'
    default:
      return slug || 'Sports'
  }
}

function peakLabel(bucket: string | null | undefined): string {
  switch (bucket) {
    case 'morning':
      return 'Mornings'
    case 'afternoon':
      return 'Afternoons'
    case 'evening':
      return 'Evenings'
    case 'night':
      return 'Nights'
    default:
      return bucket || 'Listening'
  }
}

function field(key: string, section: SectionKey, slide: Slide, span: number, rows?: number): HomeField {
  return {
    key,
    section,
    label: slide.label,
    value: slide.value,
    sub: slide.sub,
    aside: slide.aside,
    valueSize: slide.valueSize,
    variant: slide.variant,
    span,
    rows,
    to: slide.to,
    slideId: `${key}:${slide.id}`,
    imageUrl: slide.imageUrl,
  }
}

function listeningSlides(connected: boolean, taste: SpotifyTasteSnapshot | null): Slide[] {
  if (!connected) {
    return [
      {
        id: 'connect',
        label: 'Listening',
        value: 'Connect',
        sub: 'Link Spotify to see your week',
        valueSize: 48,
        variant: 'tint',
        to: { name: 'spotify' },
      },
    ]
  }
  const slides: Slide[] = []
  const summary = taste?.summary
  if (summary && summary.plays_last_7d > 0) {
    slides.push({
      id: 'week',
      label: 'Listening this week',
      aside: summary.top_genre ?? undefined,
      value: fmt(summary.plays_last_7d),
      sub: `plays · ${fmt(summary.unique_tracks_last_7d)} tracks`,
      valueSize: 84,
      to: { name: 'spotify' },
    })
  }
  if (summary?.top_genre) {
    slides.push({
      id: 'genre',
      label: 'Top genre',
      value: clip(summary.top_genre, 22),
      sub: 'this week',
      valueSize: 32,
      to: { name: 'spotify' },
    })
  }
  ;(taste?.on_repeat ?? []).slice(0, 2).forEach((entry, i) => {
    const name = entry.track?.name
    if (!name) return
    const artists = (entry.track?.artists ?? []).map((a) => a.name).filter(Boolean).join(', ')
    slides.push({
      id: `repeat-${i}`,
      label: 'On repeat',
      value: clip(name, 28),
      sub: [entry.play_count ? `${entry.play_count}×` : null, artists ? clip(artists, 28) : null]
        .filter(Boolean)
        .join(' · '),
      valueSize: 28,
      imageUrl: entry.track?.album_image_url ?? undefined,
      to: { name: 'spotify' },
    })
  })
  if (summary?.peak_bucket) {
    slides.push({
      id: 'peak',
      label: 'Peak listening',
      value: peakLabel(summary.peak_bucket),
      sub: 'your usual window',
      valueSize: 32,
      to: { name: 'spotify' },
    })
  }
  return slides.length
    ? slides
    : [
        {
          id: 'empty',
          label: 'Listening',
          value: '—',
          sub: 'Gathering your week',
          valueSize: 48,
          variant: 'tint',
          to: { name: 'spotify' },
        },
      ]
}

function cellarSlides(dash: FoodDrinkDashboard | null): Slide[] {
  const n = dash?.counts.wines ?? 0
  const wines = dash?.recent_wines ?? []
  const slides: Slide[] = [
    { id: 'count', label: 'Cellar', value: fmt(n), sub: n === 1 ? 'bottle' : 'bottles', to: { name: 'cellar' } },
  ]
  wines.slice(0, 4).forEach((w, i) => {
    slides.push({
      id: `wine-${i}`,
      label: 'Recent bottle',
      value: clip(w.name, 28),
      sub: [w.producer_name, w.vintage].filter(Boolean).join(' · ') || undefined,
      valueSize: 26,
      imageUrl: imgOf(w),
      to: { name: 'cellar-wine', params: { wineId: w.id } },
    })
  })
  return slides
}

function beerSlides(dash: FoodDrinkDashboard | null): Slide[] {
  const n = dash?.counts.beers ?? 0
  const beers = dash?.recent_beers ?? []
  const slides: Slide[] = [{ id: 'count', label: 'Beer', value: fmt(n), sub: 'logged', to: { name: 'beer' } }]
  beers.slice(0, 4).forEach((b, i) => {
    slides.push({
      id: `beer-${i}`,
      label: 'Recent beer',
      value: clip(b.name, 28),
      sub: b.brewery?.name ?? (b.rating != null ? `★ ${b.rating}` : undefined),
      valueSize: 26,
      imageUrl: imgOf(b),
      to: { name: 'beer-detail', params: { beerId: b.id } },
    })
  })
  return slides
}

function spiritsSlides(dash: FoodDrinkDashboard | null): Slide[] {
  const n = dash?.counts.spirits ?? 0
  const spirits = dash?.recent_spirits ?? []
  const slides: Slide[] = [
    { id: 'count', label: 'Spirits', value: fmt(n), sub: 'on the shelf', to: { name: 'spirits' } },
  ]
  spirits.slice(0, 4).forEach((s, i) => {
    slides.push({
      id: `spirit-${i}`,
      label: 'Recent spirit',
      value: clip(s.name, 28),
      sub: [s.producer, s.category].filter(Boolean).join(' · ') || undefined,
      valueSize: 26,
      imageUrl: imgOf(s),
      to: { name: 'spirit-detail', params: { spiritId: s.id } },
    })
  })
  return slides
}

function kitchenSlides(dash: FoodDrinkDashboard | null): Slide[] {
  const n = dash?.counts.recipes ?? 0
  const recipes = dash?.top_recipes ?? []
  const slides: Slide[] = [{ id: 'count', label: 'Recipes', value: fmt(n), sub: 'saved', to: { name: 'kitchen' } }]
  recipes.slice(0, 4).forEach((r, i) => {
    const name = r.meal?.name
    if (!name) return
    slides.push({
      id: `recipe-${i}`,
      label: 'Top recipe',
      value: clip(name, 28),
      sub: [r.rating != null ? `★ ${r.rating}` : null, r.cooked_count > 0 ? `${r.cooked_count}×` : null]
        .filter(Boolean)
        .join(' · '),
      valueSize: 26,
      imageUrl: imgOf(r) ?? r.meal?.thumb_url ?? undefined,
      to: { name: 'kitchen-recipe', params: { recipeId: r.id } },
    })
  })
  return slides
}

function pairingSlides(dash: FoodDrinkDashboard | null): Slide[] {
  const n = dash?.counts.pairings ?? 0
  const slides: Slide[] = [
    { id: 'count', label: 'Pairings', value: fmt(n), sub: 'food & drink', to: { name: 'food-drink' } },
  ]
  ;(dash?.recent_pairings ?? []).slice(0, 3).forEach((p, i) => {
    const title = p.recipe_name || p.drinkable_name
    if (!title) return
    slides.push({
      id: `pair-${i}`,
      label: 'Recent pairing',
      value: clip(title, 26),
      sub: [p.recipe_name && p.drinkable_name ? clip(p.drinkable_name, 24) : null, p.verdict]
        .filter(Boolean)
        .join(' · '),
      valueSize: 26,
      to: { name: 'food-drink' },
    })
  })
  ;(dash?.suggestions ?? []).slice(0, 2).forEach((s, i) => {
    if (!s.recipe_name) return
    slides.push({
      id: `suggest-${i}`,
      label: 'Try pairing',
      value: clip(s.recipe_name, 26),
      sub: s.drink_name ?? undefined,
      valueSize: 26,
      to: { name: 'food-drink' },
    })
  })
  return slides
}

function librarySlides(pulse: LibraryPulse | null): Slide[] {
  const reading = pulse?.reading ?? []
  const recent = pulse?.recent ?? []
  const slides: Slide[] = [
    {
      id: 'count',
      label: reading.length ? 'Reading' : 'Library',
      value: fmt(pulse?.counts.reading ?? 0),
      sub: `${fmt(pulse?.counts.total ?? 0)} books`,
      to: reading[0] ? { name: 'library-book', params: { bookId: reading[0].id } } : { name: 'library' },
    },
  ]
  reading.slice(0, 3).forEach((b, i) => {
    slides.push({
      id: `reading-${i}`,
      label: 'Currently reading',
      value: clip(b.title, 28),
      sub: b.authors ?? undefined,
      valueSize: 26,
      imageUrl: imgOf(b),
      to: { name: 'library-book', params: { bookId: b.id } },
    })
  })
  recent.slice(0, 2).forEach((b, i) => {
    if (reading.some((r) => r.id === b.id)) return
    slides.push({
      id: `recent-${i}`,
      label: 'Recent book',
      value: clip(b.title, 28),
      sub: b.authors ?? b.status ?? undefined,
      valueSize: 26,
      imageUrl: imgOf(b),
      to: { name: 'library-book', params: { bookId: b.id } },
    })
  })
  return slides
}

function codeSlides(connected: boolean, pulse: GithubPulse | null): Slide[] {
  if (!connected) {
    return [{ id: 'connect', label: 'Code', value: '—', sub: 'Connect GitHub', to: { name: 'github' } }]
  }
  const pulls = pulse?.open_pulls ?? []
  const merged = pulse?.merged_pulls ?? []
  const commits = pulse?.commits ?? []
  const slides: Slide[] = [
    {
      id: 'open',
      label: 'Open PRs',
      value: String(pulls.length),
      sub: pulls.length ? 'across your repos' : 'Nothing waiting',
      to: pulls.length ? { name: 'github-pulls' } : { name: 'github' },
    },
  ]
  pulls.slice(0, 3).forEach((p, i) => {
    if (!p.title) return
    const repo = p.repository?.name ?? p.repository?.full_name ?? undefined
    slides.push({
      id: `pr-${i}`,
      label: repo ?? 'Pull request',
      value: p.number != null ? `#${p.number}` : clip(p.title, 18),
      sub: clip(p.title, 40),
      valueSize: 40,
      to:
        p.repository?.owner && p.repository?.name && p.number != null
          ? {
              name: 'github-pull-detail',
              params: { owner: p.repository.owner, repo: p.repository.name, number: p.number },
            }
          : { name: 'github-pulls' },
    })
  })
  merged.slice(0, 2).forEach((p, i) => {
    if (!p.title) return
    slides.push({
      id: `merged-${i}`,
      label: 'Merged',
      value: clip(p.title, 26),
      sub: p.repository?.full_name ?? undefined,
      valueSize: 24,
      to: { name: 'github-pulls' },
    })
  })
  commits.slice(0, 2).forEach((c, i) => {
    const message = c.message?.split('\n')[0]?.trim()
    if (!message) return
    const shortSha = c.sha && c.sha.length >= 7 ? c.sha.slice(0, 7) : null
    slides.push({
      id: `commit-${i}`,
      label: 'Recent commit',
      value: shortSha ?? clip(message, 12),
      sub: clip(message, 42),
      aside: c.repository?.name ?? undefined,
      valueSize: shortSha ? 32 : 24,
      to: { name: 'github' },
    })
  })
  return slides
}

function f1Slides(home: F1HomeSnapshot | null): Slide[] {
  const next = home?.next_meeting
  const days = daysUntil(next?.date_start)
  const slides: Slide[] = [
    {
      id: 'next',
      label: 'Next race',
      value: days === null ? '—' : days <= 0 ? 'Now' : `${days}d`,
      sub: next?.meeting_name ?? 'Season break',
      to: { name: 'f1' },
    },
  ]
  if (home?.last_meeting) {
    slides.push({
      id: 'last',
      label: 'Last race',
      value: clip(home.last_meeting.circuit_short_name ?? home.last_meeting.meeting_name, 16),
      sub: home.last_meeting.meeting_name,
      valueSize: 32,
      to: { name: 'f1' },
    })
  }
  ;(home?.standings_drivers_top ?? []).slice(0, 3).forEach((d, i) => {
    slides.push({
      id: `driver-${i}`,
      label: i === 0 ? 'Championship' : `P${d.position ?? i + 1}`,
      value: d.name_acronym ?? clip(d.name, 14) ?? `#${d.driver_number}`,
      sub: [d.points != null ? `${fmt(d.points)} pts` : null, d.team_name].filter(Boolean).join(' · '),
      valueSize: 36,
      to: { name: 'f1' },
    })
  })
  const team = home?.standings_teams_top?.[0]
  if (team) {
    slides.push({
      id: 'team',
      label: 'Constructors',
      value: clip(team.team_name, 18),
      sub: team.points != null ? `${fmt(team.points)} pts` : undefined,
      valueSize: 28,
      to: { name: 'f1' },
    })
  }
  return slides
}

function sportsSlides(fixtures: SportsEventSummary[]): Slide[] {
  if (!fixtures.length) {
    return [
      { id: 'empty', label: 'Next fixture', value: '—', sub: 'Nothing scheduled', valueSize: 40, to: '/sports' },
    ]
  }
  return fixtures.slice(0, 6).map((f, i) => ({
    id: `fix-${i}`,
    label: sportLabel(f.sport_slug),
    value: f.starts_at ? shortDay(f.starts_at) : '—',
    sub: clip(f.name, 40),
    aside: f.league_name ?? undefined,
    valueSize: 40,
    to: { name: 'sports-sport', params: { sport: f.sport_slug } },
  }))
}

/**
 * Pulls each module's existing pulse data into colour fields, the serif
 * summary sentence and "coming up" stream items for the home screen.
 * Colour fields rotate through their pulse data every few seconds.
 */
export function useHomeModules() {
  const spotify = useSpotifyStore()
  const github = useGithubStore()
  const f1 = useF1Store()
  const foodDrink = useFoodDrinkStore()
  const library = useLibraryStore()
  const sports = useSportsStore()
  const now = useNow(1_000)

  const loading = ref(true)

  async function load(): Promise<void> {
    await Promise.allSettled([
      foodDrink.loadDashboard(),
      library.loadPulse({ silent: true }),
      f1.loadHome(),
      sports.loadHome(),
      github.loadPulse(),
      spotify.loadHub(),
    ])
    loading.value = false
  }

  const counts = computed(() => foodDrink.dashboard?.counts ?? null)
  const reading = computed(() => library.pulse?.reading?.[0] ?? null)
  const openPulls = computed(() => github.pulse?.open_pulls ?? [])
  const taste = computed(() => spotify.taste?.summary ?? null)
  const fixtures = computed(() => {
    const nowMs = Date.now()
    return (sports.home?.upcoming ?? []).filter((f) => {
      if (!f.starts_at) return true
      return new Date(f.starts_at).getTime() >= nowMs
    })
  })

  const fields = computed<HomeField[]>(() => {
    const t = now.value
    const dash = foodDrink.dashboard
    return [
      field('listening', 'listening', pick(listeningSlides(spotify.connected, spotify.taste), t, 'listening'), 5, 2),
      field('cellar', 'cellar', pick(cellarSlides(dash), t, 'cellar'), 4),
      field('f1', 'f1', pick(f1Slides(f1.home), t, 'f1'), 3),
      field('beer', 'beer', pick(beerSlides(dash), t, 'beer'), 2),
      field('code', 'code', pick(codeSlides(github.connected, github.pulse), t, 'code'), 3),
      field('library', 'library', pick(librarySlides(library.pulse), t, 'library'), 2),
      field('spirits', 'spirits', pick(spiritsSlides(dash), t, 'spirits'), 3),
      field('kitchen', 'kitchen', pick(kitchenSlides(dash), t, 'kitchen'), 3),
      field('food-drink', 'food-drink', pick(pairingSlides(dash), t, 'food-drink'), 3),
      field('sports', 'sports', pick(sportsSlides(fixtures.value), t, 'sports'), 3),
    ]
  })

  /** Serif sentence fragments: [plain, bold] pairs rendered with <b>. */
  const summary = computed<Array<{ text: string; strong?: boolean }>>(() => {
    const parts: Array<{ text: string; strong?: boolean }> = []
    const clauses: Array<Array<{ text: string; strong?: boolean }>> = []

    if (taste.value && taste.value.plays_last_7d > 0) {
      clauses.push([{ text: 'played ' }, { text: plural(taste.value.plays_last_7d, 'track'), strong: true }, { text: ' this week' }])
    }
    if (counts.value && counts.value.wines > 0) {
      clauses.push([{ text: 'have ' }, { text: plural(counts.value.wines, 'bottle'), strong: true }, { text: ' in the cellar' }])
    }
    if (reading.value) {
      clauses.push([{ text: 'are reading ' }, { text: reading.value.title, strong: true }])
    }
    if (openPulls.value.length > 0) {
      const n = openPulls.value.length
      clauses.push([{ text: 'have ' }, { text: `${n} pull request${n === 1 ? '' : 's'}`, strong: true }, { text: ' open' }])
    }

    if (clauses.length === 0) return []
    parts.push({ text: 'You ' })
    clauses.forEach((clause, i) => {
      if (i > 0) parts.push({ text: i === clauses.length - 1 ? ' and ' : ', ' })
      parts.push(...clause)
    })
    parts.push({ text: '.' })
    return parts
  })

  const upcoming = computed<HomeUpcoming[]>(() => {
    const items: HomeUpcoming[] = []
    const nextMeeting = f1.home?.next_meeting
    if (nextMeeting?.date_start) {
      items.push({
        key: `f1:${nextMeeting.meeting_key}`,
        when: nextMeeting.date_start,
        section: 'f1',
        kind: 'F1',
        meta: nextMeeting.circuit_short_name ?? nextMeeting.location ?? undefined,
        title: nextMeeting.meeting_name,
        to: { name: 'f1' },
      })
    }
    for (const fixture of fixtures.value.slice(0, 3)) {
      if (!fixture.starts_at) continue
      items.push({
        key: `sports:${fixture.id}`,
        when: fixture.starts_at,
        section: 'sports',
        kind: fixture.league_name ?? sportLabel(fixture.sport_slug),
        meta: fixture.venue ?? undefined,
        title: fixture.name,
        to: { name: 'sports-sport', params: { sport: fixture.sport_slug } },
      })
    }
    return items.sort((a, b) => a.when.localeCompare(b.when)).slice(0, 4)
  })

  return { loading, load, fields, summary, upcoming, shortDay, sections }
}
