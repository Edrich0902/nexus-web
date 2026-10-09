<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted } from 'vue'
import type { RouteLocationRaw } from 'vue-router'
import { useHubStore } from '@stores/hub/hub.store'
import { ambientFromPalette, useAmbient } from '@design/ambient'
import { moments, sections, type Ambient, type SectionKey } from '@design/tokens'
import NxStage from '@design/components/NxStage.vue'
import NxSerifSummary from '@design/components/NxSerifSummary.vue'
import NxSectionHeader from '@design/components/NxSectionHeader.vue'
import NxBento from '@design/components/NxBento.vue'
import NxField from '@design/components/NxField.vue'
import NxStream from '@design/components/NxStream.vue'
import NxStreamGroup from '@design/components/NxStreamGroup.vue'
import NxStreamItem from '@design/components/NxStreamItem.vue'
import NxEmptyState from '@design/components/NxEmptyState.vue'
import NxIcon from '@design/components/NxIcon.vue'
import NxSkeletonStage from '@design/components/skeletons/NxSkeletonStage.vue'
import NxSkeletonFields from '@design/components/skeletons/NxSkeletonFields.vue'
import NxSkeletonStream from '@design/components/skeletons/NxSkeletonStream.vue'
import type { ActivityEvent, NowPayload } from '@/types/hub/hub'
import { useHomeModules } from './useHomeModules'

const hub = useHubStore()
const modules = useHomeModules()

const NOW_POLL_MS = 30_000
const ACTIVITY_POLL_MS = 120_000
let nowTimer: ReturnType<typeof setInterval> | undefined
let activityTimer: ReturnType<typeof setInterval> | undefined

function onVisibility(): void {
  if (document.visibilityState === 'visible') void hub.loadNow()
}

onMounted(() => {
  void hub.loadNow()
  void hub.loadActivity(20)
  void modules.load()
  nowTimer = setInterval(() => document.visibilityState === 'visible' && void hub.loadNow(), NOW_POLL_MS)
  activityTimer = setInterval(
    () => document.visibilityState === 'visible' && void hub.loadActivity(20),
    ACTIVITY_POLL_MS,
  )
  document.addEventListener('visibilitychange', onVisibility)
})

onBeforeUnmount(() => {
  clearInterval(nowTimer)
  clearInterval(activityTimer)
  document.removeEventListener('visibilitychange', onVisibility)
})

const momentAmbient: Record<NowPayload['moment'], Ambient> = {
  music: moments.music,
  race: moments.race,
  cellar: moments.cellar,
  morning: moments.morning,
  afternoon: moments.afternoon,
  evening: moments.evening,
  night: moments.evening,
}

useAmbient(() => {
  const now = hub.now
  if (!now) return null
  return now.palette ? ambientFromPalette(now.palette) : momentAmbient[now.moment]
})

const now = computed(() => hub.now)

/* ── Stream ─────────────────────────────────────────────── */

const moduleMeta: Record<ActivityEvent['module'], { section: SectionKey; kind: string }> = {
  listening: { section: 'listening', kind: 'Listening' },
  cellar: { section: 'cellar', kind: 'Cellar' },
  beer: { section: 'beer', kind: 'Beer' },
  spirits: { section: 'spirits', kind: 'Spirits' },
  kitchen: { section: 'kitchen', kind: 'Kitchen' },
  library: { section: 'library', kind: 'Library' },
  code: { section: 'code', kind: 'Code' },
}

const verbs: Record<string, string> = {
  'listening.block': 'Session',
  'wine.added': 'Added',
  'wine.tasted': 'Tasted',
  'beer.added': 'Logged',
  'spirit.added': 'Added',
  'recipe.saved': 'Saved',
  'recipe.cooked': 'Cooked',
  'book.added': 'Shelved',
  'book.started': 'Started',
  'book.finished': 'Finished',
  'repo.pushed': 'Pushed',
}

function streamColor(event: ActivityEvent): string {
  const s = sections[moduleMeta[event.module]?.section ?? 'home']
  return event.module === 'code' || event.module === 'cellar' ? s.ambient.acc : s.field.bg
}

function streamTo(event: ActivityEvent): RouteLocationRaw | undefined {
  const id = event.subject?.id
  switch (event.subject?.type) {
    case 'cellar_wine':
      return { name: 'cellar-wine', params: { wineId: id } }
    case 'beer_beer':
      return { name: 'beer-detail', params: { beerId: id } }
    case 'spirit_spirit':
      return { name: 'spirit-detail', params: { spiritId: id } }
    case 'kitchen_recipe':
      return { name: 'kitchen-recipe', params: { recipeId: id } }
    case 'library_book':
      return { name: 'library-book', params: { bookId: id } }
  }
  if (event.module === 'listening') return { name: 'spotify' }
  if (event.module === 'code' && typeof event.meta.repo === 'string') {
    const [owner, repo] = event.meta.repo.split('/')
    if (owner && repo) return { name: 'github-repo', params: { owner, repo } }
  }
  return undefined
}

function chips(event: ActivityEvent): string[] {
  const m = event.meta
  const out: string[] = []
  if (typeof m.tracks === 'number') out.push(`${m.tracks} track${m.tracks === 1 ? '' : 's'}`)
  if (typeof m.minutes === 'number' && m.minutes > 0) out.push(`${m.minutes} min`)
  if (typeof m.rating === 'number') out.push(`★ ${m.rating}`)
  if (typeof m.abv === 'number') out.push(`${m.abv}%`)
  if (typeof m.occasion === 'string') out.push(m.occasion)
  if (typeof m.language === 'string') out.push(m.language)
  if (typeof m.cooked_count === 'number' && m.cooked_count > 1) out.push(`${m.cooked_count}× cooked`)
  return out
}

const dayKey = (d: Date): string => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`

const streamGroups = computed(() => {
  const today = dayKey(new Date())
  const yesterday = dayKey(new Date(Date.now() - 86_400_000))
  const groups: { label: string; events: ActivityEvent[] }[] = []
  for (const event of hub.activity) {
    const key = dayKey(new Date(event.occurred_at))
    const label = key === today ? 'Today' : key === yesterday ? 'Yesterday' : 'Earlier'
    const last = groups[groups.length - 1]
    if (last?.label === label) last.events.push(event)
    else groups.push({ label, events: [event] })
  }
  return groups
})

function timeLabel(iso: string): string {
  const d = new Date(iso)
  if (dayKey(d) === dayKey(new Date())) {
    return d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
  }
  return d.toLocaleDateString(undefined, { weekday: 'short' })
}
</script>

<template>
  <div class="home">
    <NxSkeletonStage v-if="hub.nowLoading && !now" :visual="false" />
    <NxStage
      v-else-if="now"
      :key="now.moment"
      :eyebrow="now.eyebrow"
      :live="now.live"
      :title="now.title"
      :accent="now.accent ?? undefined"
      :lede="now.lede ?? undefined"
      :progress="now.progress"
    >
      <template v-if="now.image" #visual>
        <img :src="now.image" alt="" />
      </template>
      <template v-if="now.actions.length" #actions>
        <RouterLink v-for="action in now.actions" :key="action.to" v-slot="{ navigate, href }" :to="action.to" custom>
          <Button
            as="a"
            :href="href"
            :label="action.label"
            rounded
            :severity="action.kind === 'primary' ? 'contrast' : 'secondary'"
            @click="navigate"
          />
        </RouterLink>
      </template>
    </NxStage>
    <NxStage v-else eyebrow="Today" title="Welcome" accent="back" />

    <NxSerifSummary v-if="modules.summary.value.length" class="summary nx-rise">
      <template v-for="(part, i) in modules.summary.value" :key="i">
        <b v-if="part.strong">{{ part.text }}</b><template v-else>{{ part.text }}</template>
      </template>
    </NxSerifSummary>

    <section aria-label="Modules">
      <NxSkeletonFields v-if="modules.loading.value" :spans="[5, 4, 3, 2, 3, 2, 3, 3, 3, 3]" />
      <NxBento v-else>
        <NxField
          v-for="field in modules.fields.value"
          :key="field.key"
          :bg="sections[field.section].field.bg"
          :ink="sections[field.section].field.ink"
          :variant="field.variant ?? 'solid'"
          :label="field.label"
          :aside="field.aside"
          :value="field.value"
          :value-size="field.valueSize ?? 52"
          :sub="field.sub"
          :span="field.span"
          :rows="field.rows ?? 1"
          :to="field.to"
        />
      </NxBento>
    </section>

    <div class="lower">
      <section aria-labelledby="stream-title">
        <NxSectionHeader id="stream-title" title="Your stream" />
        <NxSkeletonStream v-if="hub.activityLoading" />
        <NxEmptyState
          v-else-if="hub.activityError"
          title="Could not load your stream"
          body="Try again in a moment."
          icon="close"
          tone="error"
        >
          <Button label="Retry" rounded severity="secondary" @click="hub.loadActivity(20)" />
        </NxEmptyState>
        <NxEmptyState
          v-else-if="!hub.activity.length"
          title="A quiet stream"
          body="Tastings, books, recipes, pushes and listening sessions show up here as they happen."
        />
        <NxStream v-else>
          <NxStreamGroup v-for="group in streamGroups" :key="group.label" :label="group.label">
            <NxStreamItem
              v-for="event in group.events"
              :key="event.id"
              :time="timeLabel(event.occurred_at)"
              :color="streamColor(event)"
              :kind="moduleMeta[event.module]?.kind"
              :meta="verbs[event.type]"
              :title="event.title"
              :body="event.body ?? undefined"
              :chips="chips(event)"
              :to="streamTo(event)"
            />
          </NxStreamGroup>
        </NxStream>
        <button
          v-if="hub.activityCursor && hub.activity.length"
          type="button"
          class="more"
          @click="hub.loadMoreActivity(20)"
        >
          Show earlier <NxIcon name="chevron-down" :size="14" />
        </button>
      </section>

      <aside aria-labelledby="upcoming-title">
        <NxSectionHeader id="upcoming-title" title="Coming up" />
        <NxSkeletonStream v-if="modules.loading.value" :items="2" />
        <NxStream v-else-if="modules.upcoming.value.length">
          <NxStreamGroup label="Next" future>
            <NxStreamItem
              v-for="item in modules.upcoming.value"
              :key="item.key"
              :time="modules.shortDay(item.when)"
              :color="sections[item.section].field.bg"
              :kind="item.kind"
              :meta="item.meta"
              :title="item.title"
              :to="item.to"
              future
            />
          </NxStreamGroup>
        </NxStream>
        <p v-else class="nx-muted quiet">Nothing on the calendar.</p>
      </aside>
    </div>
  </div>
</template>

<style scoped>
.home {
  display: flex;
  flex-direction: column;
  gap: 40px;
}

.summary {
  margin-top: -8px;
}

.lower {
  display: grid;
  grid-template-columns: minmax(0, 1.5fr) minmax(0, 1fr);
  gap: 48px;
  align-items: start;
}

.more {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin: 8px 0 0 80px;
  padding: 6px 12px;
  border: 0;
  border-radius: 999px;
  background: var(--tint);
  color: var(--ink-2);
  font: inherit;
  font-size: 13px;
  cursor: pointer;
}

.more:hover {
  color: var(--ink);
}

.quiet {
  margin: 0;
}

@media (max-width: 960px) {
  .lower {
    grid-template-columns: minmax(0, 1fr);
    gap: 32px;
  }
}

@media (max-width: 640px) {
  .home {
    gap: 28px;
  }

  .more {
    margin-left: 62px;
  }
}
</style>
