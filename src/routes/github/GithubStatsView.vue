<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import StatsTemplate from '@design/templates/StatsTemplate.vue'
import type { ViewState } from '@design/templates/types'
import NxStage from '@design/components/NxStage.vue'
import NxPanel from '@design/components/NxPanel.vue'
import NxHourBars from '@design/components/NxHourBars.vue'
import NxMeters, { type MeterItem } from '@design/components/NxMeters.vue'
import NxIcon from '@design/components/NxIcon.vue'
import CollectionFields from '@routes/collections/CollectionFields.vue'
import type { CollectionField } from '@routes/collections/collectionFields'
import { plural } from '@routes/collections/collectionFields'
import { relativeTime } from '@lib/datetime'
import { useGithubStore } from '@stores/github/github.store'
import CodeNav from './CodeNav.vue'
import ContributionGrid from './ContributionGrid.vue'
import RepoRow from './RepoRow.vue'

const github = useGithubStore()
const router = useRouter()

onMounted(async () => {
  await github.loadStats()
  if (!github.connected) await router.replace({ name: 'github' })
})

const stats = computed(() => github.stats)

const state = computed<ViewState>(() => {
  if (!stats.value && (github.statsLoading || github.statusLoading)) return 'loading'
  return stats.value ? 'ready' : 'empty'
})

const eyebrow = computed(() =>
  stats.value?.computed_at ? `Last 12 months · updated ${relativeTime(stats.value.computed_at)}` : 'Last 12 months',
)

const lede = computed(() => {
  const s = stats.value
  if (!s) return ''
  if (!s.current_streak) return `Longest streak this year: ${plural(s.longest_streak, 'day')}.`
  return `On a ${plural(s.current_streak, 'day')} streak — the longest this year was ${plural(s.longest_streak, 'day')}.`
})

const fields = computed<CollectionField[]>(() => {
  const s = stats.value
  if (!s) return []
  return [
    { key: 'streak', label: 'Current streak', value: s.current_streak, sub: s.current_streak === 1 ? 'day' : 'days', variant: 'solid', span: 3 },
    { key: 'longest', label: 'Longest streak', value: s.longest_streak, sub: s.longest_streak === 1 ? 'day' : 'days', variant: 'tint', span: 3 },
    { key: 'open', label: 'Open PRs', value: s.open_pr_count, variant: 'tint', span: 3, to: { name: 'github-pulls' } },
    { key: 'merged', label: 'Merged PRs', value: s.merged_pr_count, variant: 'outline', span: 3 },
  ]
})

const dayFmt = new Intl.DateTimeFormat(undefined, { day: 'numeric', month: 'short' })

function shortDay(iso: string | undefined): string {
  if (!iso) return ''
  const d = new Date(`${iso}T12:00:00`)
  return Number.isNaN(d.getTime()) ? iso : dayFmt.format(d)
}

const spark = computed(() => stats.value?.sparkline ?? [])
const sparkValues = computed(() => spark.value.map((p) => p.count))
const sparkTicks = computed(() => {
  const s = spark.value
  if (!s.length) return []
  return [shortDay(s[0]?.date), shortDay(s[Math.floor(s.length / 2)]?.date), shortDay(s[s.length - 1]?.date)]
})
const sparkTotal = computed(() => sparkValues.value.reduce((a, b) => a + b, 0))

const languages = computed<MeterItem[]>(() => {
  const list = stats.value?.languages ?? []
  const total = list.reduce((a, l) => a + l.count, 0) || 1
  return list.slice(0, 8).map((l) => ({
    key: l.language,
    label: l.language,
    value: l.count / total,
    display: `${Math.round((l.count / total) * 100)}%`,
  }))
})
</script>

<template>
  <StatsTemplate
    :state="state"
    empty-title="Stats are not ready yet"
    empty-body="Contribution stats are computed after the first GitHub sync. Try refreshing in a minute."
  >
    <template #stage>
      <NxStage
        size="compact"
        :eyebrow="eyebrow"
        :title="stats ? stats.total_contributions.toLocaleString() : 'Your'"
        accent="contributions"
        :lede="lede"
      >
        <template #actions>
          <Button
            rounded
            severity="secondary"
            label="Refresh"
            :loading="github.statsLoading"
            @click="github.loadStats(true)"
          >
            <template #icon="{ class: iconClass }">
              <NxIcon name="refresh" :size="16" :class="iconClass" />
            </template>
          </Button>
        </template>
      </NxStage>
    </template>

    <template #range>
      <CodeNav />
    </template>

    <template #fields>
      <CollectionFields section="code" :fields="fields" />
    </template>

    <template v-if="stats">
      <NxPanel title="Contribution calendar" class="wide">
        <ContributionGrid :weeks="stats.calendar.weeks" :total="stats.total_contributions" />
      </NxPanel>

      <NxPanel :title="`Last ${spark.length} days · ${sparkTotal}`">
        <NxHourBars
          v-if="spark.length"
          :values="sparkValues"
          :ticks="sparkTicks"
          :height="160"
          label="Contributions per day"
        />
        <p v-else class="quiet">No recent activity.</p>
      </NxPanel>

      <NxPanel title="Languages">
        <NxMeters v-if="languages.length" :items="languages" :cols="1" />
        <p v-else class="quiet">No language data yet.</p>
      </NxPanel>

      <NxPanel v-if="stats.top_repos.length" title="Most active repositories" class="wide">
        <div class="repos">
          <RepoRow
            v-for="r in stats.top_repos"
            :key="r.full_name"
            :owner="r.owner"
            :name="r.name"
            :language="r.language"
            :is-private="r.private"
            :pushed-at="r.pushed_at"
          />
        </div>
      </NxPanel>
    </template>
  </StatsTemplate>
</template>

<style scoped>
.quiet {
  margin: 0;
  color: var(--ink-3);
  font-size: 14px;
}

.repos {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  column-gap: 40px;
}

@media (max-width: 960px) {
  .repos {
    grid-template-columns: minmax(0, 1fr);
  }
}
</style>
