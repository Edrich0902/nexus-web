<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import IndexTemplate from '@design/templates/IndexTemplate.vue'
import type { ViewState } from '@design/templates/types'
import NxStage from '@design/components/NxStage.vue'
import NxPillGroup from '@design/components/NxPillGroup.vue'
import NxSearchField from '@design/components/NxSearchField.vue'
import NxEmptyState from '@design/components/NxEmptyState.vue'
import NxIcon from '@design/components/NxIcon.vue'
import NxSkeletonRows from '@design/components/skeletons/NxSkeletonRows.vue'
import { useGithubStore } from '@stores/github/github.store'
import type {
  GithubSearchCodeHit,
  GithubSearchIssueHit,
  GithubSearchRepoHit,
  GithubSearchType,
} from '@/types/github/github'
import CodeNav from './CodeNav.vue'
import RepoRow from './RepoRow.vue'
import PullRow from './PullRow.vue'

const github = useGithubStore()
const router = useRouter()

const query = ref('')
const searched = ref('')
const type = ref<GithubSearchType>('repositories')
const ready = ref(false)

const types: { value: GithubSearchType; label: string }[] = [
  { value: 'repositories', label: 'Repositories' },
  { value: 'issues', label: 'Issues & PRs' },
  { value: 'code', label: 'Code' },
]

const repoHits = computed(() => github.searchResults as GithubSearchRepoHit[])
const issueHits = computed(() => github.searchResults as GithubSearchIssueHit[])
const codeHits = computed(() => github.searchResults as GithubSearchCodeHit[])

onMounted(async () => {
  await github.loadHub()
  if (!github.connected) {
    await router.replace({ name: 'github' })
    return
  }
  ready.value = true
})

async function run(q = query.value.trim()): Promise<void> {
  searched.value = q
  await github.search(q, type.value)
}

watch(type, () => {
  if (searched.value) void run()
})

const state = computed<ViewState>(() => (ready.value ? 'ready' : 'loading'))
</script>

<template>
  <IndexTemplate :state="state">
    <template #stage>
      <NxStage
        size="compact"
        eyebrow="Code"
        title="Search"
        accent="GitHub"
        lede="Repositories, issues, pull requests and code across everything you can see."
      />
    </template>

    <template #toolbar>
      <CodeNav />
    </template>

    <div class="search">
      <div class="controls">
        <NxSearchField
          v-model="query"
          class="field"
          placeholder="Search GitHub…"
          :debounce="350"
          autofocus
          @search="run"
        />
        <NxPillGroup v-model="type" :options="types" label="Search in" size="sm" />
      </div>

      <NxSkeletonRows v-if="github.searchLoading" :rows="6" />
      <NxEmptyState
        v-else-if="!searched"
        title="Start typing"
        body="GitHub search qualifiers work too — try user:, repo:, is:pr or language:."
        icon="search"
      />
      <NxEmptyState
        v-else-if="!github.searchResults.length"
        title="No results"
        :body="`Nothing matched “${searched}”.`"
        icon="search"
      />
      <template v-else>
        <p class="count">{{ github.searchTotal.toLocaleString() }} results</p>

        <div v-if="type === 'repositories'" class="hits">
          <RepoRow
            v-for="hit in repoHits"
            :key="hit.id ?? hit.full_name ?? ''"
            :owner="hit.owner"
            :name="hit.name"
            :description="hit.description"
            :language="hit.language"
            :is-private="hit.private"
            :stars="hit.stargazers_count"
            :href="hit.html_url"
          />
        </div>

        <div v-else-if="type === 'issues'">
          <template v-for="hit in issueHits" :key="hit.id ?? hit.html_url ?? ''">
            <PullRow
              v-if="hit.is_pull_request"
              :owner="hit.repository.owner"
              :repo="hit.repository.name"
              :number="hit.number"
              :title="hit.title"
              :state="hit.state"
              :href="hit.html_url"
              show-repo
            />
            <a v-else :href="hit.html_url ?? undefined" target="_blank" rel="noopener noreferrer" class="hit">
              <span class="issue" :class="{ closed: hit.state === 'closed' }" />
              <span class="body">
                <b>{{ hit.title }}</b>
                <span class="meta">{{ hit.repository.full_name }} · issue #{{ hit.number }} · {{ hit.state }}</span>
              </span>
              <NxIcon name="external-link" :size="14" class="ext" />
            </a>
          </template>
        </div>

        <div v-else>
          <a
            v-for="hit in codeHits"
            :key="`${hit.repository.full_name}-${hit.path}-${hit.sha}`"
            :href="hit.html_url ?? undefined"
            target="_blank"
            rel="noopener noreferrer"
            class="hit"
          >
            <NxIcon name="code" :size="16" class="file" />
            <span class="body">
              <b class="mono">{{ hit.path }}</b>
              <span class="meta">{{ hit.repository.full_name }}</span>
            </span>
            <NxIcon name="external-link" :size="14" class="ext" />
          </a>
        </div>
      </template>
    </div>
  </IndexTemplate>
</template>

<style scoped>
.search {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.controls {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px;
}

.field {
  flex: 1;
  min-width: min(100%, 280px);
}

.count {
  margin: 0;
  font-size: 13px;
  color: var(--ink-3);
}

.hits {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  column-gap: 40px;
}

.hit {
  display: grid;
  grid-template-columns: 16px minmax(0, 1fr) auto;
  gap: 14px;
  align-items: center;
  padding: 13px 0;
  border-top: 1px solid var(--line);
  color: inherit;
}

.hit:hover b {
  text-decoration: underline;
  text-underline-offset: 3px;
}

.issue {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  border: 2px solid var(--ok);
  justify-self: center;
}

.issue.closed {
  border-color: var(--ink-3);
}

.file,
.ext {
  color: var(--ink-3);
}

.body {
  display: flex;
  flex-direction: column;
  gap: 3px;
  min-width: 0;
}

b {
  font-weight: 600;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.mono {
  font-family: var(--font-mono);
  font-weight: 500;
  font-size: 14px;
}

.meta {
  font-size: 12px;
  color: var(--ink-3);
}

@media (max-width: 960px) {
  .hits {
    grid-template-columns: minmax(0, 1fr);
  }
}
</style>
