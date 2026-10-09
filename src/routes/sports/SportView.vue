<script setup lang="ts">
import { computed, watch } from 'vue'
import { useRoute } from 'vue-router'
import IndexTemplate from '@design/templates/IndexTemplate.vue'
import NxStage from '@design/components/NxStage.vue'
import NxIcon from '@design/components/NxIcon.vue'
import NxSectionHeader from '@design/components/NxSectionHeader.vue'
import NxEmptyState from '@design/components/NxEmptyState.vue'
import NxPillNav, { type PillNavItem } from '@design/components/NxPillNav.vue'
import type { ViewState } from '@design/templates/types'
import NexusSportIcon from '@components/nexus-sport-icon/NexusSportIcon.vue'
import NexusTeamBadge from '@components/nexus-team-badge/NexusTeamBadge.vue'
import CollectionFields from '@routes/collections/CollectionFields.vue'
import { plural, type CollectionField } from '@routes/collections/collectionFields'
import { useSportsStore } from '@stores/sports/sports.store'
import { SPORT_LABELS, type SportsSlug } from '@/types/sports/sports'
import SportsEventRow from './SportsEventRow.vue'
import SportsTable from './SportsTable.vue'
import {
  eventName,
  eventWhen,
  hasMatchup,
  hasScore,
  sizedImage,
  tableRows,
  teamLabel,
} from './sports'

const route = useRoute()
const sports = useSportsStore()

const slug = computed(() => String(route.params.sport ?? 'football') as SportsSlug)
const label = computed(() => SPORT_LABELS[slug.value] ?? slug.value)

watch(slug, (s) => void sports.loadSport(s), { immediate: true })

const overview = computed(() => (sports.overview?.sport === slug.value ? sports.overview : null))

const state = computed<ViewState>(() => {
  if (!overview.value) return sports.overviewLoading ? 'loading' : 'error'
  const o = overview.value
  return o.leagues.length || o.upcoming.length || o.recent.length ? 'ready' : 'empty'
})

const nav = computed<PillNavItem[]>(() =>
  (Object.keys(SPORT_LABELS) as SportsSlug[]).map((s) => ({
    key: s,
    label: SPORT_LABELS[s],
    to: { name: 'sports-sport', params: { sport: s } },
  })),
)

const upcoming = computed(() => overview.value?.upcoming ?? [])
const recent = computed(() => overview.value?.recent ?? [])
const majors = computed(() => overview.value?.majors ?? [])
const leagues = computed(() => overview.value?.leagues ?? [])
const tables = computed(() => (overview.value?.standings ?? []).filter((b) => b.rows?.length))

const hero = computed(() => {
  const next = upcoming.value[0]
  if (next) return { event: next, kind: 'Next up' }
  const last = recent.value[0]
  return last ? { event: last, kind: 'Latest' } : null
})

const heading = computed(() => {
  const e = hero.value?.event
  if (!e) return { title: label.value, accent: 'on hold' }
  if (!hasMatchup(e)) return { title: eventName(e), accent: '' }
  const home = teamLabel(e.home_team, slug.value)
  const away = teamLabel(e.away_team, slug.value)
  if (hasScore(e)) return { title: `${home} ${e.home_score ?? 0}–${e.away_score ?? 0}`, accent: away }
  return { title: home, accent: `vs ${away}` }
})

const eyebrow = computed(() =>
  [label.value, hero.value?.kind, hero.value?.event.series ?? hero.value?.event.league_name].filter(Boolean).join(' · '),
)

const lede = computed(() => {
  const e = hero.value?.event
  if (!e) return 'Nothing synced for this sport yet. Run a sync to pull fixtures and results from TheSportsDB.'
  const where = [e.venue, e.country].filter(Boolean).join(', ')
  return [eventWhen(e), where].filter(Boolean).join(' · ')
})

const heroThumb = computed(() => sizedImage(hero.value?.event.thumb_url || null, 'medium'))

const fields = computed<CollectionField[]>(() => {
  const next = upcoming.value[0]
  const last = recent.value[0]
  const out: CollectionField[] = [
    {
      key: 'upcoming',
      label: 'Coming up',
      value: upcoming.value.length,
      sub: next ? eventWhen(next) : 'Nothing scheduled yet',
      variant: 'solid',
      span: 4,
    },
    {
      key: 'recent',
      label: 'Results',
      value: recent.value.length,
      sub: last ? `Latest: ${eventName(last)}` : undefined,
      variant: 'tint',
      span: 3,
    },
    {
      key: 'leagues',
      label: 'Competitions',
      value: leagues.value.length,
      sub: leagues.value.length ? undefined : 'Awaiting sync',
      variant: 'outline',
      span: 2,
    },
  ]
  const table = tables.value[0]
  const top = table ? tableRows(table, 1)[0] : undefined
  if (table && top) {
    out.push({
      key: 'leader',
      label: `Top of the ${table.league ?? 'table'}`,
      title: top.team,
      sub: `${top.points} pts · ${plural(Number(top.played) || 0, 'game')}`,
      variant: 'tint',
      span: 3,
    })
  } else {
    out.push({
      key: 'majors',
      label: 'Majors',
      value: majors.value.length,
      sub: majors.value[0] ? (majors.value[0].series ?? eventName(majors.value[0])) : 'None on the calendar',
      variant: 'tint',
      span: 3,
    })
  }
  return out
})
</script>

<template>
  <IndexTemplate
    :state="state"
    :empty-title="`No ${label.toLowerCase()} yet`"
    empty-body="Run a sync to pull competitions, fixtures and results from TheSportsDB."
    error-title="Could not load this sport"
  >
    <template #stage>
      <NxStage :eyebrow="eyebrow" :title="heading.title" :accent="heading.accent" :lede="lede">
        <template #visual>
          <img v-if="heroThumb" :src="heroThumb" alt="" />
          <div v-else-if="hero?.event.league_badge_url" class="plate">
            <NexusTeamBadge :src="hero.event.league_badge_url" :label="hero.event.league_name" :size="120" />
          </div>
          <div v-else class="plate">
            <NexusSportIcon :sport="slug" :size="72" />
          </div>
        </template>
        <template #actions>
          <Button
            rounded
            severity="secondary"
            label="Sync"
            :loading="sports.syncPending"
            @click="sports.syncNow('all')"
          >
            <template #icon="{ class: iconClass }">
              <NxIcon name="refresh" :size="16" :class="iconClass" />
            </template>
          </Button>
        </template>
      </NxStage>
    </template>

    <template #fields>
      <CollectionFields section="sports" :fields="fields" />
    </template>

    <template #toolbar>
      <NxPillNav :items="nav" label="Sports" />
    </template>

    <template #empty>
      <NxEmptyState
        :title="`No ${label.toLowerCase()} yet`"
        body="Run a sync to pull competitions, fixtures and results from TheSportsDB."
        icon="sports"
      />
    </template>

    <div class="blocks">
      <section v-if="upcoming.length">
        <NxSectionHeader title="Coming up" />
        <div class="rows">
          <SportsEventRow v-for="e in upcoming" :key="e.id" :event="e" />
        </div>
      </section>

      <section>
        <NxSectionHeader title="Results" />
        <div v-if="recent.length" class="rows">
          <SportsEventRow v-for="e in recent" :key="e.id" :event="e" />
        </div>
        <p v-else class="nx-muted">No results cached yet.</p>
      </section>

      <section v-if="majors.length">
        <NxSectionHeader title="Majors & signature events" />
        <div class="rows">
          <SportsEventRow v-for="e in majors" :key="e.id" :event="e" />
        </div>
      </section>

      <section v-if="tables.length">
        <NxSectionHeader title="Tables" />
        <div class="tables">
          <SportsTable v-for="b in tables" :key="`${b.league_id}-${b.season}`" :block="b" />
        </div>
      </section>

      <section v-if="leagues.length">
        <NxSectionHeader title="Competitions we follow" />
        <ul class="leagues">
          <li v-for="l in leagues" :key="l.id">
            <NexusTeamBadge :src="l.badge_url" :label="l.name" :size="22" />
            {{ l.name }}
          </li>
        </ul>
      </section>
    </div>
  </IndexTemplate>
</template>

<style scoped>
.plate {
  width: 100%;
  height: 100%;
  display: grid;
  place-items: center;
  background: var(--surface-2);
}

.plate :deep(.badge img) {
  object-fit: contain;
}

.blocks {
  display: flex;
  flex-direction: column;
  gap: 44px;
}

.rows > :first-child {
  border-top: 0;
}

.tables {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 36px 56px;
}

.leagues {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.leagues li {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 6px 14px 6px 8px;
  border-radius: 999px;
  background: var(--tint);
  font-size: 13px;
}

@media (max-width: 960px) {
  .tables {
    grid-template-columns: minmax(0, 1fr);
  }
}

@media (max-width: 640px) {
  .blocks {
    gap: 32px;
  }
}
</style>
