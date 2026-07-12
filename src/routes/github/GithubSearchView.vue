<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import NexusPageWrapper from '@components/nexus-page-wrapper/NexusPageWrapper.vue'
import NexusGithubChrome from '@components/nexus-github-chrome/NexusGithubChrome.vue'
import { useGithubStore } from '@stores/github/github.store'
import type {
  GithubSearchCodeHit,
  GithubSearchIssueHit,
  GithubSearchRepoHit,
  GithubSearchType,
} from '@/types/github/github'

const github = useGithubStore()
const router = useRouter()

const query = ref('')
const type = ref<GithubSearchType>('repositories')
let debounceTimer: number | null = null

const tabs: { label: string; value: GithubSearchType }[] = [
  { label: 'Repositories', value: 'repositories' },
  { label: 'Issues & PRs', value: 'issues' },
  { label: 'Code', value: 'code' },
]

const repoHits = computed(
  () => github.searchResults as GithubSearchRepoHit[],
)
const issueHits = computed(
  () => github.searchResults as GithubSearchIssueHit[],
)
const codeHits = computed(
  () => github.searchResults as GithubSearchCodeHit[],
)

async function runSearch(): Promise<void> {
  const q = query.value.trim()
  if (!q) {
    await github.search('', type.value)
    return
  }
  await github.search(q, type.value)
}

function scheduleSearch(): void {
  if (debounceTimer !== null) {
    window.clearTimeout(debounceTimer)
  }
  debounceTimer = window.setTimeout(() => {
    void runSearch()
  }, 350)
}

onMounted(async () => {
  await github.loadHub()
  if (!github.connected) {
    await router.replace({ name: 'github' })
  }
})

onUnmounted(() => {
  if (debounceTimer !== null) {
    window.clearTimeout(debounceTimer)
  }
})

watch([query, type], () => {
  scheduleSearch()
})
</script>

<template>
  <NexusPageWrapper show-toolbar title="Search">
    <div class="github-page">
      <NexusGithubChrome>
        <div class="search-bar">
          <InputText
            v-model="query"
            class="w-full"
            placeholder="Search your GitHub…"
            autofocus
          />
        </div>

        <div class="tabs">
          <button
            v-for="tab in tabs"
            :key="tab.value"
            type="button"
            class="tab"
            :class="{ active: type === tab.value }"
            @click="type = tab.value"
          >
            {{ tab.label }}
          </button>
        </div>

        <p v-if="query.trim()" class="result-meta">
          <template v-if="github.searchLoading">Searching…</template>
          <template v-else>
            {{ github.searchTotal }} result{{
              github.searchTotal === 1 ? '' : 's'
            }}
          </template>
        </p>

        <div v-if="!query.trim()" class="empty">
          Search only your account — repositories you own, plus issues, PRs, and
          code in those repos.
        </div>
        <div v-else-if="github.searchLoading" class="empty">Searching…</div>
        <div
          v-else-if="github.searchResults.length === 0"
          class="empty"
        >
          No results.
        </div>

        <ul v-else-if="type === 'repositories'" class="list">
          <li v-for="hit in repoHits" :key="String(hit.id)">
            <router-link
              v-if="hit.owner && hit.name"
              :to="{
                name: 'github-repo',
                params: { owner: hit.owner, repo: hit.name },
              }"
              class="row"
            >
              <strong>{{ hit.full_name }}</strong>
              <p v-if="hit.description" class="desc">{{ hit.description }}</p>
              <div class="meta">
                <span v-if="hit.language">{{ hit.language }}</span>
                <span v-if="hit.stargazers_count != null">
                  ★ {{ hit.stargazers_count }}
                </span>
              </div>
            </router-link>
            <a
              v-else-if="hit.html_url"
              :href="hit.html_url"
              target="_blank"
              rel="noopener noreferrer"
              class="row"
            >
              <strong>{{ hit.full_name }}</strong>
            </a>
          </li>
        </ul>

        <ul v-else-if="type === 'issues'" class="list">
          <li v-for="hit in issueHits" :key="String(hit.id)">
            <router-link
              v-if="
                hit.is_pull_request &&
                hit.repository.owner &&
                hit.repository.name &&
                hit.number
              "
              :to="{
                name: 'github-pull-detail',
                params: {
                  owner: hit.repository.owner,
                  repo: hit.repository.name,
                  number: hit.number,
                },
              }"
              class="row"
            >
              <strong>{{ hit.title }}</strong>
              <div class="meta">
                <span>{{ hit.repository.full_name }}</span>
                <span>#{{ hit.number }}</span>
                <span>PR</span>
                <span>{{ hit.state }}</span>
              </div>
            </router-link>
            <a
              v-else-if="hit.html_url"
              :href="hit.html_url"
              target="_blank"
              rel="noopener noreferrer"
              class="row"
            >
              <strong>{{ hit.title }}</strong>
              <div class="meta">
                <span>{{ hit.repository.full_name }}</span>
                <span>#{{ hit.number }}</span>
                <span>Issue</span>
                <span>{{ hit.state }}</span>
              </div>
            </a>
          </li>
        </ul>

        <ul v-else class="list">
          <li v-for="(hit, index) in codeHits" :key="`${hit.sha}-${index}`">
            <a
              v-if="hit.html_url"
              :href="hit.html_url"
              target="_blank"
              rel="noopener noreferrer"
              class="row"
            >
              <strong>{{ hit.path }}</strong>
              <div class="meta">
                <span>{{ hit.repository.full_name }}</span>
                <span>{{ hit.name }}</span>
              </div>
            </a>
          </li>
        </ul>
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

.search-bar {
  max-width: 36rem;
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

.result-meta {
  margin: 0;
  font-size: 0.85rem;
  color: color-mix(in srgb, var(--lavender-blush) 55%, transparent);
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

.desc {
  margin: 0.35rem 0 0;
  color: color-mix(in srgb, var(--lavender-blush) 60%, transparent);
  font-size: 0.9rem;
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
