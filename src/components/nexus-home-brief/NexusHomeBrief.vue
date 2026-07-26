<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import NexusSpotifyIcon from '@components/nexus-spotify-icon/NexusSpotifyIcon.vue'
import NexusGithubIcon from '@components/nexus-github-icon/NexusGithubIcon.vue'
import NexusF1Icon from '@components/nexus-f1-icon/NexusF1Icon.vue'
import NexusFoodDrinkIcon from '@components/nexus-food-drink-icon/NexusFoodDrinkIcon.vue'
import NexusLibraryIcon from '@components/nexus-library-icon/NexusLibraryIcon.vue'
import { useSpotifyStore } from '@stores/spotify/spotify.store'
import { useGithubStore } from '@stores/github/github.store'
import { useF1Store } from '@stores/f1/f1.store'
import { useFoodDrinkStore } from '@stores/food-drink/food-drink.store'
import { useLibraryStore } from '@stores/library/library.store'
import { formatDate } from '@lib/datetime'
import type { Component } from 'vue'

type BriefChip = {
  key: string
  label: string
  detail: string
  accent: string
  icon: Component
  to: { name: string; params?: Record<string, string | number> }
}

const router = useRouter()
const spotify = useSpotifyStore()
const github = useGithubStore()
const f1 = useF1Store()
const foodDrink = useFoodDrinkStore()
const library = useLibraryStore()

const loading = ref(true)

onMounted(async () => {
  loading.value = true
  await Promise.allSettled([
    spotify.loadHub(),
    github.loadPulse(),
    f1.loadHome(),
    foodDrink.loadDashboard(),
    library.loadPulse({ silent: true }),
  ])
  loading.value = false
})

const chips = computed<BriefChip[]>(() => {
  const items: BriefChip[] = []

  const live = spotify.player?.item
  const last = spotify.recentlyPlayed.find((r) => r.track)?.track
  if (spotify.connected && live?.name) {
    items.push({
      key: 'spotify',
      label: spotify.player?.is_playing ? 'Now playing' : 'Paused',
      detail: [
        live.name,
        live.artists?.map((a) => a.name).filter(Boolean).join(', '),
      ]
        .filter(Boolean)
        .join(' · '),
      accent: 'var(--spotify-green)',
      icon: NexusSpotifyIcon,
      to: { name: 'spotify' },
    })
  } else if (spotify.connected && last?.name) {
    items.push({
      key: 'spotify',
      label: 'Last played',
      detail: [
        last.name,
        last.artists?.map((a) => a.name).filter(Boolean).join(', '),
      ]
        .filter(Boolean)
        .join(' · '),
      accent: 'var(--spotify-green)',
      icon: NexusSpotifyIcon,
      to: { name: 'spotify' },
    })
  }

  const openPulls = github.pulse?.open_pulls ?? []
  if (github.connected && openPulls.length > 0) {
    const first = openPulls[0]
    items.push({
      key: 'github',
      label: `${openPulls.length} open PR${openPulls.length === 1 ? '' : 's'}`,
      detail: first?.title || 'Review inbox',
      accent: 'var(--github-ink)',
      icon: NexusGithubIcon,
      to:
        first?.repository?.owner && first?.repository?.name && first.number != null
          ? {
              name: 'github-pull-detail',
              params: {
                owner: first.repository.owner,
                repo: first.repository.name,
                number: first.number,
              },
            }
          : { name: 'github-pulls' },
    })
  }

  const nextMeeting = f1.home?.next_meeting
  if (nextMeeting?.meeting_name) {
    items.push({
      key: 'f1',
      label: 'Next weekend',
      detail: [
        nextMeeting.meeting_name,
        nextMeeting.date_start ? formatDate(nextMeeting.date_start) : null,
      ]
        .filter(Boolean)
        .join(' · '),
      accent: 'var(--sport-f1)',
      icon: NexusF1Icon,
      to: { name: 'f1' },
    })
  }

  const suggestion = foodDrink.dashboard?.suggestions?.[0]
  const latestWine = foodDrink.dashboard?.recent_wines?.[0]
  if (suggestion) {
    items.push({
      key: 'food-drink',
      label: 'Try tonight',
      detail: [
        suggestion.recipe_name || 'Recipe',
        'with',
        suggestion.drink_name || 'drink',
      ].join(' '),
      accent: 'var(--food-drink-accent)',
      icon: NexusFoodDrinkIcon,
      to:
        suggestion.drinkable_type === 'wine'
          ? {
              name: 'cellar-wine',
              params: { wineId: suggestion.drinkable_id },
            }
          : {
              name: 'beer-detail',
              params: { beerId: suggestion.drinkable_id },
            },
    })
  } else if (latestWine) {
    items.push({
      key: 'food-drink',
      label: 'Latest wine',
      detail: [latestWine.name, latestWine.producer_name]
        .filter(Boolean)
        .join(' · '),
      accent: 'var(--food-drink-accent)',
      icon: NexusFoodDrinkIcon,
      to: { name: 'cellar-wine', params: { wineId: latestWine.id } },
    })
  }

  const reading = library.pulse?.reading?.[0]
  if (reading) {
    items.push({
      key: 'library',
      label: 'Reading',
      detail: [reading.title, reading.authors].filter(Boolean).join(' · '),
      accent: 'var(--library-accent)',
      icon: NexusLibraryIcon,
      to: { name: 'library-book', params: { bookId: reading.id } },
    })
  }

  return items.slice(0, 5)
})

const mode = computed<'loading' | 'empty' | 'ready'>(() => {
  if (loading.value && chips.value.length === 0) return 'loading'
  if (chips.value.length === 0) return 'empty'
  return 'ready'
})

function openChip(chip: BriefChip): void {
  void router.push(chip.to)
}
</script>

<template>
  <section class="brief" :class="`is-${mode}`" aria-label="Today’s brief">
    <header class="brief-head">
      <p class="eyebrow">Today</p>
      <h3>Command brief</h3>
    </header>

    <div v-if="mode === 'loading'" class="brief-skel">
      <Skeleton v-for="n in 4" :key="n" height="2.75rem" border-radius="0.75rem" />
    </div>

    <p v-else-if="mode === 'empty'" class="brief-empty">
      Connect modules or log a few items — Spotify, GitHub, F1, Food & Drink, and
      Library will surface here.
    </p>

    <ul v-else class="brief-list">
      <li v-for="chip in chips" :key="chip.key">
        <button
          type="button"
          class="brief-chip"
          :style="{ '--chip-accent': chip.accent }"
          @click="openChip(chip)"
        >
          <span class="chip-icon">
            <component :is="chip.icon" :size="16" />
          </span>
          <span class="chip-copy">
            <span class="chip-label">{{ chip.label }}</span>
            <span class="chip-detail">{{ chip.detail }}</span>
          </span>
          <i class="pi pi-angle-right chip-arrow" aria-hidden="true" />
        </button>
      </li>
    </ul>
  </section>
</template>

<style scoped>
.brief {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  padding: 1rem 1.15rem;
  border-radius: 1.05rem;
  background:
    radial-gradient(
      120% 90% at 0% 0%,
      color-mix(in srgb, var(--light-green) 14%, transparent),
      transparent 55%
    ),
    var(--coffee-bean-panel);
  border: 1px solid color-mix(in srgb, var(--light-green) 16%, transparent);
}

.brief-head {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
}

.eyebrow {
  margin: 0;
  font-size: 0.68rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--light-green);
}

.brief-head h3 {
  margin: 0;
  font-size: 1.05rem;
  font-weight: 700;
  letter-spacing: -0.01em;
}

.brief-skel {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(12rem, 1fr));
  gap: 0.5rem;
}

.brief-empty {
  margin: 0;
  font-size: 0.9rem;
  line-height: 1.45;
  opacity: 0.72;
}

.brief-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(14rem, 1fr));
  gap: 0.5rem;
}

.brief-chip {
  width: 100%;
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  gap: 0.65rem;
  align-items: center;
  padding: 0.65rem 0.75rem;
  border: 0;
  border-radius: 0.8rem;
  text-align: left;
  cursor: pointer;
  color: inherit;
  background: color-mix(in srgb, var(--chip-accent, var(--light-green)) 12%, transparent);
  transition: background 0.18s ease, transform 0.18s ease;
}

.brief-chip:hover {
  background: color-mix(in srgb, var(--chip-accent, var(--light-green)) 22%, transparent);
  transform: translateY(-1px);
}

.chip-icon {
  display: grid;
  place-items: center;
  width: 1.85rem;
  height: 1.85rem;
  border-radius: 0.55rem;
  color: var(--chip-accent, var(--light-green));
  background: color-mix(in srgb, var(--chip-accent, var(--light-green)) 18%, transparent);
}

.chip-copy {
  display: flex;
  flex-direction: column;
  gap: 0.12rem;
  min-width: 0;
}

.chip-label {
  font-size: 0.68rem;
  font-weight: 700;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: var(--chip-accent, var(--light-green));
}

.chip-detail {
  font-size: 0.88rem;
  font-weight: 600;
  line-height: 1.25;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.chip-arrow {
  opacity: 0.45;
  font-size: 0.85rem;
}
</style>
