<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useConfirm } from 'primevue/useconfirm'
import DetailTemplate from '@design/templates/DetailTemplate.vue'
import type { ViewState } from '@design/templates/types'
import NxStage from '@design/components/NxStage.vue'
import NxPillGroup from '@design/components/NxPillGroup.vue'
import NxIcon from '@design/components/NxIcon.vue'
import NxIconButton from '@design/components/NxIconButton.vue'
import NxSkeletonRows from '@design/components/skeletons/NxSkeletonRows.vue'
import { relativeTime } from '@lib/datetime'
import { useGithubStore } from '@stores/github/github.store'
import type { GithubPullStateFilter } from '@/types/github/github'
import PullRow from './PullRow.vue'
import CommitRow from './CommitRow.vue'
import { PULL_FILTERS, languageColour } from './code'

type Tab = 'pulls' | 'commits' | 'branches'

const github = useGithubStore()
const route = useRoute()
const router = useRouter()
const confirm = useConfirm()

const owner = computed(() => String(route.params.owner ?? ''))
const repo = computed(() => String(route.params.repo ?? ''))
const tab = ref<Tab>('pulls')
const filter = ref<GithubPullStateFilter>('open')
const ready = ref(false)

const tabs: { value: Tab; label: string }[] = [
  { value: 'pulls', label: 'Pull requests' },
  { value: 'commits', label: 'Commits' },
  { value: 'branches', label: 'Branches' },
]

const info = computed(() => github.repos.find((r) => r.owner === owner.value && r.name === repo.value) ?? null)
const defaultBranch = computed(() => github.currentRepo?.default_branch ?? info.value?.default_branch ?? null)
const starred = computed(() => github.currentRepo?.starred ?? info.value?.starred ?? false)

async function init(): Promise<void> {
  ready.value = false
  await github.loadHub()
  if (!github.connected) {
    await router.replace({ name: 'github' })
    return
  }
  ready.value = true
  await Promise.all([github.loadCurrentRepo(owner.value, repo.value), loadTab()])
}

async function loadTab(): Promise<void> {
  if (tab.value === 'pulls') await github.loadRepoPulls(owner.value, repo.value, filter.value)
  else if (tab.value === 'commits') await github.loadCommits(owner.value, repo.value)
  else await github.loadBranches(owner.value, repo.value)
}

watch([owner, repo], () => void init(), { immediate: true })
watch([tab, filter], () => void loadTab())

const state = computed<ViewState>(() => (ready.value ? 'ready' : 'loading'))

const eyebrow = computed(() => {
  const parts = [owner.value, info.value?.private ? 'Private' : 'Public']
  if (info.value?.pushed_at) parts.push(`pushed ${relativeTime(info.value.pushed_at)}`)
  return parts.join(' · ')
})

const lede = computed(() => info.value?.description || (defaultBranch.value ? `Default branch ${defaultBranch.value}.` : ''))

/* ── Branches ───────────────────────────────────────────── */

const showCreateBranch = ref(false)
const newBranchName = ref('')
const newBranchFrom = ref<string | null>(null)
const branchOptions = computed(() => github.branches.map((b) => ({ label: b.name, value: b.name })))

function openCreateBranch(): void {
  newBranchName.value = ''
  newBranchFrom.value = defaultBranch.value ?? github.branches[0]?.name ?? null
  showCreateBranch.value = true
}

async function createBranch(): Promise<void> {
  const name = newBranchName.value.trim()
  if (!name) return
  const ok = await github.createBranch(owner.value, repo.value, { name, from: newBranchFrom.value })
  if (ok) showCreateBranch.value = false
}

function deleteBranchConfirm(event: Event, branch: string): void {
  confirm.require({
    target: event.currentTarget as HTMLElement,
    message: `Delete branch “${branch}”?`,
    acceptLabel: 'Delete',
    rejectLabel: 'Cancel',
    acceptProps: { severity: 'danger', size: 'small' },
    rejectProps: { severity: 'secondary', text: true, size: 'small' },
    accept: () => void github.deleteBranch(owner.value, repo.value, branch),
  })
}
</script>

<template>
  <DetailTemplate :state="state" :back-to="{ name: 'github' }" back-label="Code">
    <template #stage>
      <NxStage size="compact" :eyebrow="eyebrow" :title="repo" :lede="lede">
        <template #actions>
          <Button
            as="router-link"
            rounded
            severity="contrast"
            label="New pull request"
            :to="{ name: 'github-pull-create', params: { owner, repo } }"
          >
            <template #icon="{ class: iconClass }">
              <NxIcon name="plus" :size="16" :class="iconClass" />
            </template>
          </Button>
          <Button
            v-if="info?.html_url"
            as="a"
            :href="info.html_url"
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
          <NxIconButton
            icon="star"
            :label="starred ? 'Unstar repository' : 'Star repository'"
            :active="starred"
            :disabled="github.writePending"
            @click="github.toggleStar(owner, repo)"
          />
        </template>
      </NxStage>
    </template>

    <div class="repo">
      <div class="bar">
        <NxPillGroup v-model="tab" :options="tabs" label="Repository section" />
        <span v-if="info?.language" class="lang">
          <i :style="{ background: languageColour(info.language) }" />{{ info.language }}
        </span>
        <NxPillGroup
          v-if="tab === 'pulls'"
          v-model="filter"
          :options="PULL_FILTERS"
          label="Pull request state"
          size="sm"
          class="end"
        />
        <Button v-else-if="tab === 'branches'" rounded size="small" severity="secondary" label="New branch" class="end" @click="openCreateBranch">
          <template #icon="{ class: iconClass }">
            <NxIcon name="plus" :size="14" :class="iconClass" />
          </template>
        </Button>
      </div>

      <template v-if="tab === 'pulls'">
        <NxSkeletonRows v-if="github.repoPullsLoading && !github.repoPulls.length" :rows="5" />
        <p v-else-if="!github.repoPulls.length" class="quiet">No pull requests for this filter.</p>
        <div v-else :class="{ dim: github.repoPullsLoading }">
          <PullRow
            v-for="p in github.repoPulls"
            :key="p.id ?? p.number ?? ''"
            :owner="owner"
            :repo="repo"
            :number="p.number"
            :title="p.title"
            :state="p.state"
            :draft="p.draft"
            :merged="p.merged"
            :merged-at="p.merged_at"
            :updated-at="p.updated_at"
            :user="p.user"
            :href="p.html_url"
          />
        </div>
      </template>

      <template v-else-if="tab === 'commits'">
        <NxSkeletonRows v-if="github.commitsLoading && !github.commits.length" :rows="8" />
        <p v-else-if="!github.commits.length" class="quiet">No commits found.</p>
        <div v-else :class="{ dim: github.commitsLoading }">
          <CommitRow v-for="c in github.commits" :key="c.sha ?? ''" :commit="c" />
        </div>
      </template>

      <template v-else>
        <NxSkeletonRows v-if="github.branchesLoading && !github.branches.length" :rows="5" />
        <p v-else-if="!github.branches.length" class="quiet">No branches found.</p>
        <div v-else :class="{ dim: github.branchesLoading }">
          <div v-for="b in github.branches" :key="b.name" class="branch">
            <span class="name">{{ b.name }}</span>
            <span v-if="b.name === defaultBranch" class="tag">Default</span>
            <span v-if="b.protected" class="tag">Protected</span>
            <span class="spacer" />
            <RouterLink
              v-if="b.name !== defaultBranch"
              :to="{ name: 'github-pull-create', params: { owner, repo }, query: { head: b.name } }"
              class="open-pr"
              >Open PR</RouterLink
            >
            <NxIconButton
              icon="trash"
              size="sm"
              :label="`Delete ${b.name}`"
              :disabled="b.name === defaultBranch || b.protected || github.writePending"
              @click="deleteBranchConfirm($event, b.name)"
            />
          </div>
        </div>
      </template>
    </div>
  </DetailTemplate>

  <Dialog v-model:visible="showCreateBranch" modal header="New branch" style="width: min(440px, 94vw)">
    <form id="new-branch" class="nx-form" @submit.prevent="createBranch">
      <label class="f">
        <span>Name</span>
        <InputText v-model="newBranchName" placeholder="feature/my-change" autofocus />
      </label>
      <label class="f">
        <span>From</span>
        <Select
          v-model="newBranchFrom"
          :options="branchOptions"
          option-label="label"
          option-value="value"
          placeholder="Default branch"
          filter
        />
      </label>
    </form>
    <template #footer>
      <Button label="Cancel" text severity="secondary" @click="showCreateBranch = false" />
      <Button
        type="submit"
        form="new-branch"
        rounded
        label="Create branch"
        :loading="github.writePending"
        :disabled="!newBranchName.trim()"
      />
    </template>
  </Dialog>
</template>

<style scoped>
.repo {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.bar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px 16px;
}

.end {
  margin-left: auto;
}

.lang {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: var(--ink-3);
}

.lang i {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.quiet {
  margin: 0;
  padding: 14px 0;
  border-top: 1px solid var(--line);
  color: var(--ink-3);
  font-size: 14px;
}

.dim {
  opacity: 0.55;
  transition: opacity 0.2s;
}

.branch {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 0;
  border-top: 1px solid var(--line);
  min-width: 0;
}

.name {
  font-family: var(--font-mono);
  font-size: 14px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.tag {
  flex-shrink: 0;
  padding: 1px 8px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 600;
  color: var(--ink-2);
  background: var(--tint-2);
}

.spacer {
  flex: 1;
}

.open-pr {
  flex-shrink: 0;
  font-size: 13px;
  color: var(--ink-3);
}

.open-pr:hover {
  color: var(--ink);
}
</style>
