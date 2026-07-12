<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useConfirm } from 'primevue/useconfirm'
import NexusPageWrapper from '@components/nexus-page-wrapper/NexusPageWrapper.vue'
import NexusGithubChrome from '@components/nexus-github-chrome/NexusGithubChrome.vue'
import { useGithubStore } from '@stores/github/github.store'
import type { GithubPullStateFilter } from '@/types/github/github'

const github = useGithubStore()
const route = useRoute()
const router = useRouter()
const confirm = useConfirm()

const owner = computed(() => String(route.params.owner ?? ''))
const repo = computed(() => String(route.params.repo ?? ''))
const tab = ref<'pulls' | 'commits' | 'branches'>('pulls')
const state = ref<GithubPullStateFilter>('open')
const showCreateBranch = ref(false)
const newBranchName = ref('')
const newBranchFrom = ref<string | null>(null)

const stateOptions = [
  { label: 'Open', value: 'open' },
  { label: 'Merged', value: 'merged' },
  { label: 'Closed', value: 'closed' },
  { label: 'All', value: 'all' },
]

const title = computed(() => `${owner.value}/${repo.value}`)
const defaultBranch = computed(
  () => github.currentRepo?.default_branch ?? null,
)
const branchOptions = computed(() =>
  github.branches.map((branch) => ({
    label: branch.name,
    value: branch.name,
  })),
)

async function load(): Promise<void> {
  await github.loadHub()
  if (!github.connected) {
    await router.replace({ name: 'github' })
    return
  }
  await github.loadCurrentRepo(owner.value, repo.value)
  if (tab.value === 'pulls') {
    await github.loadRepoPulls(owner.value, repo.value, state.value)
  } else if (tab.value === 'commits') {
    await github.loadCommits(owner.value, repo.value)
  } else {
    await github.loadBranches(owner.value, repo.value)
    newBranchFrom.value = defaultBranch.value ?? github.branches[0]?.name ?? null
  }
}

onMounted(() => {
  void load()
})

watch([owner, repo, tab, state], () => {
  void load()
})

function formatDate(value: string | null): string {
  if (!value) return '—'
  return new Date(value).toLocaleString()
}

function deleteBranchConfirm(event: Event, branch: string): void {
  confirm.require({
    target: event.currentTarget as HTMLElement,
    message: `Delete branch “${branch}”?`,
    icon: 'pi pi-exclamation-triangle',
    rejectProps: {
      label: 'Cancel',
      severity: 'secondary',
      outlined: true,
    },
    acceptProps: {
      label: 'Delete',
      severity: 'danger',
    },
    accept: () => {
      void github.deleteBranch(owner.value, repo.value, branch)
    },
  })
}

async function createBranch(): Promise<void> {
  const name = newBranchName.value.trim()
  if (!name) return
  const ok = await github.createBranch(owner.value, repo.value, {
    name,
    from: newBranchFrom.value,
  })
  if (ok) {
    showCreateBranch.value = false
    newBranchName.value = ''
  }
}
</script>

<template>
  <NexusPageWrapper show-toolbar :title="title">
    <template #toolbar>
      <div class="toolbar-actions">
        <span
          v-if="github.currentRepo?.starred"
          class="star-badge"
          title="Starred on GitHub"
        >
          <i class="pi pi-star-fill" />
          Starred
        </span>
        <Button
          label="New pull request"
          icon="pi pi-plus"
          size="small"
          @click="
            router.push({
              name: 'github-pull-create',
              params: { owner, repo },
            })
          "
        />
      </div>
    </template>

    <div class="github-page">
      <NexusGithubChrome>
        <div class="tabs">
          <button
            type="button"
            class="tab"
            :class="{ active: tab === 'pulls' }"
            @click="tab = 'pulls'"
          >
            Pull requests
          </button>
          <button
            type="button"
            class="tab"
            :class="{ active: tab === 'commits' }"
            @click="tab = 'commits'"
          >
            Commits
          </button>
          <button
            type="button"
            class="tab"
            :class="{ active: tab === 'branches' }"
            @click="tab = 'branches'"
          >
            Branches
          </button>
        </div>

        <template v-if="tab === 'pulls'">
          <div class="filters">
            <Select
              v-model="state"
              :options="stateOptions"
              option-label="label"
              option-value="value"
              class="state-select"
            />
          </div>

          <div v-if="github.repoPullsLoading" class="empty">Loading…</div>
          <div v-else-if="github.repoPulls.length === 0" class="empty">
            No pull requests for this filter.
          </div>
          <ul v-else class="list">
            <li v-for="pull in github.repoPulls" :key="String(pull.id)">
              <router-link
                :to="{
                  name: 'github-pull-detail',
                  params: { owner, repo, number: pull.number },
                }"
                class="row"
              >
                <div class="row-main">
                  <strong>{{ pull.title }}</strong>
                  <span v-if="pull.draft" class="draft-chip">Draft</span>
                </div>
                <div class="meta">
                  <span>#{{ pull.number }}</span>
                  <span>{{ pull.state }}</span>
                  <span v-if="pull.merged_at">merged</span>
                  <span>{{ formatDate(pull.updated_at) }}</span>
                </div>
              </router-link>
            </li>
          </ul>
        </template>

        <template v-else-if="tab === 'commits'">
          <div v-if="github.commitsLoading" class="empty">Loading commits…</div>
          <div v-else-if="github.commits.length === 0" class="empty">
            No commits found.
          </div>
          <ul v-else class="list">
            <li v-for="commit in github.commits" :key="String(commit.sha)">
              <a
                v-if="commit.html_url"
                :href="commit.html_url"
                target="_blank"
                rel="noopener noreferrer"
                class="row"
              >
                <strong>{{ commit.message?.split('\n')[0] }}</strong>
                <div class="meta">
                  <span>{{ commit.sha?.slice(0, 7) }}</span>
                  <span>{{ commit.author_name }}</span>
                  <span>{{ formatDate(commit.author_date) }}</span>
                </div>
              </a>
              <div v-else class="row">
                <strong>{{ commit.message?.split('\n')[0] }}</strong>
              </div>
            </li>
          </ul>
        </template>

        <template v-else>
          <div class="branch-toolbar">
            <Button
              label="New branch"
              icon="pi pi-plus"
              size="small"
              @click="showCreateBranch = !showCreateBranch"
            />
          </div>

          <form
            v-if="showCreateBranch"
            class="create-branch"
            @submit.prevent="createBranch"
          >
            <InputText
              v-model="newBranchName"
              placeholder="Branch name"
              class="w-full"
              required
            />
            <Select
              v-model="newBranchFrom"
              :options="branchOptions"
              option-label="label"
              option-value="value"
              placeholder="Base branch"
              class="w-full"
            />
            <Button
              type="submit"
              label="Create"
              size="small"
              :loading="github.writePending"
              :disabled="!newBranchName.trim()"
            />
          </form>

          <div v-if="github.branchesLoading" class="empty">Loading branches…</div>
          <div v-else-if="github.branches.length === 0" class="empty">
            No branches found.
          </div>
          <ul v-else class="list">
            <li v-for="branch in github.branches" :key="branch.name" class="branch-row">
              <div class="branch-main">
                <strong>{{ branch.name }}</strong>
                <span v-if="branch.protected" class="badge">Protected</span>
                <span
                  v-if="branch.name === defaultBranch"
                  class="badge badge-default"
                >
                  Default
                </span>
              </div>
              <Button
                icon="pi pi-trash"
                severity="danger"
                text
                size="small"
                :disabled="branch.name === defaultBranch"
                :loading="github.writePending"
                @click="deleteBranchConfirm($event, branch.name)"
              />
            </li>
          </ul>
        </template>
      </NexusGithubChrome>
    </div>
  </NexusPageWrapper>
</template>

<style scoped>
.github-page {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding-bottom: 2rem;
}

.toolbar-actions {
  display: flex;
  gap: 0.35rem;
  align-items: center;
}

.star-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--github-ink);
}

.tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
}

.tab {
  border: 0;
  background: color-mix(in srgb, var(--lavender-blush) 6%, transparent);
  color: color-mix(in srgb, var(--lavender-blush) 70%, transparent);
  padding: 0.45rem 0.85rem;
  border-radius: 0.65rem;
  font-weight: 600;
  cursor: pointer;
}

.tab.active {
  background: color-mix(in srgb, var(--github-ink) 14%, transparent);
  color: var(--github-ink);
}

.filters {
  margin-top: 0.25rem;
}

.state-select {
  min-width: 10rem;
}

.list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.55rem;
}

.row {
  display: block;
  padding: 0.9rem 1rem;
  border-radius: 0.85rem;
  text-decoration: none;
  color: inherit;
  background: color-mix(in srgb, var(--lavender-blush) 4%, transparent);
  border: 1px solid color-mix(in srgb, var(--lavender-blush) 10%, transparent);
}

.row:hover {
  border-color: color-mix(in srgb, var(--github-ink) 35%, transparent);
}

.row-main {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  align-items: center;
}

.draft-chip {
  font-size: 0.7rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.03em;
  padding: 0.15rem 0.4rem;
  border-radius: 999px;
  color: color-mix(in srgb, var(--lavender-blush) 80%, transparent);
  background: color-mix(in srgb, var(--lavender-blush) 10%, transparent);
}

.meta {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  margin-top: 0.35rem;
  font-size: 0.8rem;
  color: color-mix(in srgb, var(--lavender-blush) 50%, transparent);
}

.branch-toolbar {
  display: flex;
  justify-content: flex-end;
}

.create-branch {
  display: grid;
  gap: 0.65rem;
  max-width: 24rem;
  padding: 0.9rem;
  border-radius: 0.85rem;
  background: var(--github-card-surface);
  border: 1px solid color-mix(in srgb, var(--lavender-blush) 10%, transparent);
}

.branch-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  border-radius: 0.85rem;
  background: color-mix(in srgb, var(--lavender-blush) 4%, transparent);
  border: 1px solid color-mix(in srgb, var(--lavender-blush) 10%, transparent);
}

.branch-main {
  display: flex;
  flex-wrap: wrap;
  gap: 0.45rem;
  align-items: center;
}

.badge {
  font-size: 0.68rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.03em;
  padding: 0.15rem 0.4rem;
  border-radius: 999px;
  color: var(--github-ink);
  background: color-mix(in srgb, var(--github-black) 65%, transparent);
}

.badge-default {
  color: var(--meadow-green);
  background: color-mix(in srgb, var(--meadow-green) 16%, transparent);
}

.empty {
  padding: 1.25rem;
  color: color-mix(in srgb, var(--lavender-blush) 55%, transparent);
}
</style>
