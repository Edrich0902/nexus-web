<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useConfirm } from 'primevue/useconfirm'
import IndexTemplate from '@design/templates/IndexTemplate.vue'
import type { ViewState } from '@design/templates/types'
import NxStage from '@design/components/NxStage.vue'
import NxPanel from '@design/components/NxPanel.vue'
import NxPillGroup from '@design/components/NxPillGroup.vue'
import NxIcon from '@design/components/NxIcon.vue'
import NxIconButton from '@design/components/NxIconButton.vue'
import NxEmptyState from '@design/components/NxEmptyState.vue'
import NxSkeletonRows from '@design/components/skeletons/NxSkeletonRows.vue'
import NexusGithubIcon from '@components/nexus-github-icon/NexusGithubIcon.vue'
import CollectionFields from '@routes/collections/CollectionFields.vue'
import type { CollectionField } from '@routes/collections/collectionFields'
import { plural } from '@routes/collections/collectionFields'
import { relativeTime } from '@lib/datetime'
import { useGithubStore } from '@stores/github/github.store'
import CodeNav from './CodeNav.vue'
import RepoRow from './RepoRow.vue'
import PullRow from './PullRow.vue'
import CommitRow from './CommitRow.vue'
import { firstLine } from './code'

const github = useGithubStore()
const route = useRoute()
const router = useRouter()
const confirm = useConfirm()
const filter = ref<'all' | 'starred'>('all')

onMounted(async () => {
  const connected = typeof route.query.connected === 'string' ? route.query.connected : null
  const error = typeof route.query.error === 'string' ? route.query.error : null

  if (connected !== null) {
    await github.handleOAuthReturn(connected, error)
    await router.replace({ name: 'github', query: {} })
  } else {
    await github.loadHub()
  }
  if (github.connected) void github.loadPulse()
})

const state = computed<ViewState>(() => {
  if (!github.status && github.statusLoading) return 'loading'
  return github.connected ? 'ready' : 'empty'
})

const repos = computed(() => (filter.value === 'starred' ? github.repos.filter((r) => r.starred) : github.repos))
const openPulls = computed(() => github.pulse?.open_pulls ?? [])
const mergedPulls = computed(() => github.pulse?.merged_pulls ?? [])
const commits = computed(() => github.pulse?.commits ?? [])

const profile = computed(() => github.profile)

const eyebrow = computed(() => {
  const parts = [profile.value?.login ? `@${profile.value.login}` : 'GitHub']
  if (github.status?.last_synced_at) parts.push(`Synced ${relativeTime(github.status.last_synced_at)}`)
  return parts.join(' · ')
})

const stageTitle = computed(() => {
  const n = openPulls.value.length
  if (!github.pulse) return { title: 'Your', accent: 'code' }
  return n ? { title: plural(n, 'pull request'), accent: 'open' } : { title: 'All', accent: 'clear' }
})

const lede = computed(() => {
  if (profile.value?.bio) return profile.value.bio
  const latest = github.repos.reduce<string | null>(
    (best, r) => (r.pushed_at && (!best || r.pushed_at > best) ? r.pushed_at : best),
    null,
  )
  const count = plural(github.repos.length, 'repository', 'repositories')
  return latest ? `${count}, last pushed ${relativeTime(latest)}.` : `${count} synced from GitHub.`
})

const fields = computed<CollectionField[]>(() => {
  const p = profile.value
  const latest = commits.value[0]
  const privateCount = github.repos.filter((r) => r.private).length
  return [
    {
      key: 'repos',
      label: 'Repositories',
      value: github.repos.length,
      sub: privateCount ? `${privateCount} private` : undefined,
      variant: 'solid',
      span: 3,
    },
    {
      key: 'open',
      label: 'Open PRs',
      value: openPulls.value.length,
      variant: 'tint',
      span: 3,
      to: { name: 'github-pulls' },
    },
    { key: 'merged', label: 'Recently merged', value: mergedPulls.value.length, variant: 'tint', span: 2 },
    latest
      ? {
          key: 'latest',
          label: 'Latest commit',
          aside: latest.author_date ? relativeTime(latest.author_date) : undefined,
          title: firstLine(latest.message),
          sub: latest.repository.full_name ?? latest.repository.name,
          variant: 'outline',
          span: 4,
        }
      : {
          key: 'followers',
          label: 'Followers',
          value: p?.followers ?? 0,
          sub: p?.following != null ? `following ${p.following}` : undefined,
          variant: 'outline',
          span: 4,
        },
  ]
})

function disconnectConfirm(event: Event): void {
  confirm.require({
    target: event.currentTarget as HTMLElement,
    message: 'Disconnect GitHub from Nexus?',
    acceptLabel: 'Disconnect',
    rejectLabel: 'Cancel',
    acceptProps: { severity: 'danger', size: 'small' },
    rejectProps: { severity: 'secondary', text: true, size: 'small' },
    accept: () => void github.disconnect(),
  })
}
</script>

<template>
  <IndexTemplate :state="state">
    <template #stage>
      <NxStage
        v-if="github.connected"
        art="square"
        :eyebrow="eyebrow"
        :title="stageTitle.title"
        :accent="stageTitle.accent"
        :lede="lede"
      >
        <template v-if="profile?.avatar_url" #visual>
          <img :src="profile.avatar_url" :alt="profile.login ?? 'GitHub avatar'" />
        </template>
        <template #actions>
          <Button
            v-if="openPulls.length"
            as="router-link"
            rounded
            severity="contrast"
            label="Review pull requests"
            :to="{ name: 'github-pulls' }"
          />
          <Button rounded severity="secondary" label="Sync" :loading="github.syncPending" @click="github.syncNow()">
            <template #icon="{ class: iconClass }">
              <NxIcon name="refresh" :size="16" :class="iconClass" />
            </template>
          </Button>
          <Button
            v-if="profile?.html_url"
            as="a"
            :href="profile.html_url"
            target="_blank"
            rel="noopener noreferrer"
            rounded
            severity="secondary"
            label="Open on GitHub"
          >
            <template #icon="{ class: iconClass }">
              <NxIcon name="external-link" :size="16" :class="iconClass" />
            </template>
          </Button>
          <NxIconButton icon="close" label="Disconnect GitHub" @click="disconnectConfirm" />
        </template>
      </NxStage>
      <NxStage
        v-else
        size="compact"
        eyebrow="Code"
        title="Your"
        accent="code"
        lede="Link GitHub to browse repositories, review pull request diffs and merge without leaving Nexus."
      >
        <template #actions>
          <Button rounded severity="contrast" label="Connect GitHub" @click="github.connect()">
            <template #icon>
              <NexusGithubIcon :size="16" />
            </template>
          </Button>
        </template>
      </NxStage>
    </template>

    <template v-if="github.connected" #fields>
      <CollectionFields section="code" :fields="fields" />
    </template>

    <template v-if="github.connected" #toolbar>
      <CodeNav />
    </template>

    <template #empty>
      <NxEmptyState
        title="GitHub is not linked"
        body="Connecting asks GitHub for read access to your repositories and permission to open, review and merge pull requests."
        icon="code"
      />
    </template>

    <div class="code">
      <div v-if="github.needsReauth" class="notice" role="status">
        <NxIcon name="clock" :size="16" />
        <span>GitHub needs you to authorise Nexus again before it can sync.</span>
        <Button size="small" rounded label="Reconnect" @click="github.connect()" />
      </div>

      <div class="cols">
        <NxPanel title="Recent commits" variant="flush">
          <NxSkeletonRows v-if="github.pulseLoading && !github.pulse" :rows="5" />
          <p v-else-if="!commits.length" class="quiet">No commits in the last few days.</p>
          <CommitRow
            v-for="c in commits.slice(0, 8)"
            v-else
            :key="`${c.repository.full_name}-${c.sha}`"
            :commit="c"
            :repo="c.repository.name"
          />
        </NxPanel>

        <NxPanel title="Open pull requests" action-label="All pull requests" :to="{ name: 'github-pulls' }" variant="flush">
          <NxSkeletonRows v-if="github.pulseLoading && !github.pulse" :rows="4" />
          <p v-else-if="!openPulls.length" class="quiet">Nothing waiting on you.</p>
          <PullRow
            v-for="p in openPulls.slice(0, 6)"
            v-else
            :key="p.id ?? `${p.repository.full_name}-${p.number}`"
            :owner="p.repository.owner"
            :repo="p.repository.name"
            :number="p.number"
            :title="p.title"
            :state="p.state"
            :draft="p.draft"
            :updated-at="p.updated_at"
            :user="p.user"
            :href="p.html_url"
            show-repo
          />
          <template v-if="mergedPulls.length">
            <h3 class="sub">Recently merged</h3>
            <PullRow
              v-for="p in mergedPulls.slice(0, 4)"
              :key="`m-${p.id ?? p.number}`"
              :owner="p.repository.owner"
              :repo="p.repository.name"
              :number="p.number"
              :title="p.title"
              :state="p.state"
              merged
              :updated-at="p.updated_at"
              :user="p.user"
              :href="p.html_url"
              show-repo
            />
          </template>
        </NxPanel>
      </div>

      <NxPanel :title="`Repositories · ${repos.length}`" variant="flush">
        <template #action>
          <NxPillGroup
            v-model="filter"
            :options="[
              { value: 'all', label: 'All' },
              { value: 'starred', label: 'Starred' },
            ]"
            label="Repository filter"
            size="sm"
          />
        </template>
        <NxSkeletonRows v-if="github.reposLoading && !github.repos.length" :rows="6" />
        <p v-else-if="!repos.length" class="quiet">
          {{ filter === 'starred' ? 'No starred repositories yet.' : 'No repositories synced yet — hit Sync to pull them from GitHub.' }}
        </p>
        <div v-else class="repos">
          <RepoRow
            v-for="r in repos"
            :key="r.id"
            :owner="r.owner"
            :name="r.name"
            :description="r.description"
            :language="r.language"
            :is-private="r.private"
            :starred="r.starred"
            :pushed-at="r.pushed_at"
          />
        </div>
      </NxPanel>
    </div>
  </IndexTemplate>
</template>

<style scoped>
.code {
  display: flex;
  flex-direction: column;
  gap: 40px;
}

.cols {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 40px;
}

.notice {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  border-radius: var(--r-md);
  background: color-mix(in srgb, var(--warn) 14%, transparent);
  color: var(--ink);
  font-size: 14px;
}

.notice span {
  flex: 1;
}

.quiet {
  margin: 0;
  padding: 14px 0;
  border-top: 1px solid var(--line);
  color: var(--ink-3);
  font-size: 14px;
}

.sub {
  margin: 24px 0 4px;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--ink-3);
}

.repos {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  column-gap: 40px;
}

@media (max-width: 960px) {
  .cols,
  .repos {
    grid-template-columns: minmax(0, 1fr);
  }
}
</style>
