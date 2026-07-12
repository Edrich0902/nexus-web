<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import NexusPageWrapper from '@components/nexus-page-wrapper/NexusPageWrapper.vue'
import NexusGithubChrome from '@components/nexus-github-chrome/NexusGithubChrome.vue'
import { useGithubStore } from '@stores/github/github.store'
import type { GithubPullStateFilter } from '@/types/github/github'

const github = useGithubStore()
const route = useRoute()
const router = useRouter()

const owner = computed(() => String(route.params.owner ?? ''))
const repo = computed(() => String(route.params.repo ?? ''))
const tab = ref<'pulls' | 'commits'>('pulls')
const state = ref<GithubPullStateFilter>('open')

const stateOptions = [
  { label: 'Open', value: 'open' },
  { label: 'Merged', value: 'merged' },
  { label: 'Closed', value: 'closed' },
  { label: 'All', value: 'all' },
]

const title = computed(() => `${owner.value}/${repo.value}`)

async function load(): Promise<void> {
  await github.loadHub()
  if (!github.connected) {
    await router.replace({ name: 'github' })
    return
  }
  if (tab.value === 'pulls') {
    await github.loadRepoPulls(owner.value, repo.value, state.value)
  } else {
    await github.loadCommits(owner.value, repo.value)
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
</script>

<template>
  <NexusPageWrapper show-toolbar :title="title">
    <template #toolbar>
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
                <strong>{{ pull.title }}</strong>
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

        <template v-else>
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

.tabs {
  display: flex;
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

.meta {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  margin-top: 0.35rem;
  font-size: 0.8rem;
  color: color-mix(in srgb, var(--lavender-blush) 50%, transparent);
}

.empty {
  padding: 1.25rem;
  color: color-mix(in srgb, var(--lavender-blush) 55%, transparent);
}
</style>
