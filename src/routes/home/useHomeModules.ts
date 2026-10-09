import { computed, ref } from 'vue'
import type { RouteLocationRaw } from 'vue-router'
import { sections, type SectionKey } from '@design/tokens'
import { useSpotifyStore } from '@stores/spotify/spotify.store'
import { useGithubStore } from '@stores/github/github.store'
import { useF1Store } from '@stores/f1/f1.store'
import { useFoodDrinkStore } from '@stores/food-drink/food-drink.store'
import { useLibraryStore } from '@stores/library/library.store'
import { useSportsStore } from '@stores/sports/sports.store'

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

const DAY_MS = 86_400_000

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

/**
 * Pulls each module's existing pulse data into colour fields, the serif
 * summary sentence and "coming up" stream items for the home screen.
 */
export function useHomeModules() {
  const spotify = useSpotifyStore()
  const github = useGithubStore()
  const f1 = useF1Store()
  const foodDrink = useFoodDrinkStore()
  const library = useLibraryStore()
  const sports = useSportsStore()

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
  const nextMeeting = computed(() => f1.home?.next_meeting ?? null)
  const nextFixture = computed(() => sports.home?.upcoming?.[0] ?? null)
  const openPulls = computed(() => github.pulse?.open_pulls ?? [])
  const taste = computed(() => spotify.taste?.summary ?? null)

  const fields = computed<HomeField[]>(() => {
    const list: HomeField[] = []

    list.push(
      spotify.connected && taste.value
        ? {
            key: 'listening',
            section: 'listening',
            label: 'Listening this week',
            aside: taste.value.top_genre ?? undefined,
            value: fmt(taste.value.plays_last_7d),
            sub: `plays · ${fmt(taste.value.unique_tracks_last_7d)} different tracks`,
            span: 5,
            rows: 2,
            valueSize: 96,
            to: { name: 'spotify' },
          }
        : {
            key: 'listening',
            section: 'listening',
            label: 'Listening',
            value: spotify.connected ? '—' : 'Connect',
            sub: spotify.connected ? 'Gathering your week' : 'Link Spotify to see your week',
            span: 5,
            rows: 2,
            valueSize: 64,
            variant: 'tint',
            to: { name: 'spotify' },
          },
    )

    list.push({
      key: 'cellar',
      section: 'cellar',
      label: 'Cellar',
      aside: foodDrink.dashboard?.recent_wines?.[0]?.name,
      value: fmt(counts.value?.wines ?? 0),
      sub: counts.value?.wines === 1 ? 'bottle' : 'bottles',
      span: 4,
      to: { name: 'cellar' },
    })

    const meetingDays = daysUntil(nextMeeting.value?.date_start)
    list.push({
      key: 'f1',
      section: 'f1',
      label: 'Next race',
      value: meetingDays === null ? '—' : meetingDays <= 0 ? 'Now' : `${meetingDays}d`,
      sub: nextMeeting.value?.meeting_name ?? 'Season break',
      span: 3,
      to: { name: 'f1' },
    })

    list.push({
      key: 'beer',
      section: 'beer',
      label: 'Beer',
      value: fmt(counts.value?.beers ?? 0),
      sub: 'logged',
      span: 2,
      to: { name: 'beer' },
    })

    list.push({
      key: 'code',
      section: 'code',
      label: 'Code',
      value: github.connected ? String(openPulls.value.length) : '—',
      sub: github.connected
        ? openPulls.value[0]?.title ?? 'No open pull requests'
        : 'Connect GitHub',
      span: 3,
      to: openPulls.value.length ? { name: 'github-pulls' } : { name: 'github' },
    })

    list.push({
      key: 'library',
      section: 'library',
      label: reading.value ? 'Reading' : 'Library',
      value: fmt(library.pulse?.counts.reading ?? 0),
      sub: reading.value?.title ?? `${fmt(library.pulse?.counts.total ?? 0)} books`,
      span: 2,
      to: reading.value ? { name: 'library-book', params: { bookId: reading.value.id } } : { name: 'library' },
    })

    list.push(
      {
        key: 'spirits',
        section: 'spirits',
        label: 'Spirits',
        value: fmt(counts.value?.spirits ?? 0),
        sub: 'on the shelf',
        span: 3,
        to: { name: 'spirits' },
      },
      {
        key: 'kitchen',
        section: 'kitchen',
        label: 'Recipes',
        value: fmt(counts.value?.recipes ?? 0),
        sub: 'saved',
        span: 3,
        to: { name: 'kitchen' },
      },
      {
        key: 'food-drink',
        section: 'food-drink',
        label: 'Pairings',
        value: fmt(counts.value?.pairings ?? 0),
        sub: 'food & drink',
        span: 3,
        to: { name: 'food-drink' },
      },
      {
        key: 'sports',
        section: 'sports',
        label: 'Next fixture',
        value: nextFixture.value?.starts_at ? shortDay(nextFixture.value.starts_at) : '—',
        sub: nextFixture.value?.name ?? 'Nothing scheduled',
        span: 3,
        valueSize: 40,
        to: nextFixture.value ? { name: 'sports-sport', params: { sport: nextFixture.value.sport_slug } } : '/sports',
      },
    )

    return list
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
    if (nextMeeting.value?.date_start) {
      items.push({
        key: `f1:${nextMeeting.value.meeting_key}`,
        when: nextMeeting.value.date_start,
        section: 'f1',
        kind: 'F1',
        meta: nextMeeting.value.circuit_short_name ?? nextMeeting.value.location ?? undefined,
        title: nextMeeting.value.meeting_name,
        to: { name: 'f1' },
      })
    }
    if (nextFixture.value?.starts_at) {
      items.push({
        key: `sports:${nextFixture.value.id}`,
        when: nextFixture.value.starts_at,
        section: 'sports',
        kind: nextFixture.value.league_name ?? 'Sports',
        meta: nextFixture.value.venue ?? undefined,
        title: nextFixture.value.name,
        to: { name: 'sports-sport', params: { sport: nextFixture.value.sport_slug } },
      })
    }
    return items.sort((a, b) => a.when.localeCompare(b.when)).slice(0, 3)
  })

  return { loading, load, fields, summary, upcoming, shortDay, sections }
}
