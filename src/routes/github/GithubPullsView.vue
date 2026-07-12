<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import NexusPageWrapper from '@components/nexus-page-wrapper/NexusPageWrapper.vue'
import NexusGithubChrome from '@components/nexus-github-chrome/NexusGithubChrome.vue'
import { useGithubStore } from '@stores/github/github.store'
import type { GithubPullStateFilter } from '@/types/github/github'

const github = useGithubStore()
const router = useRouter()
const state = ref<GithubPullStateFilter>('open')

const stateOptions = [
  { label: 'Open', value: 'open' },
  { label: 'Closed', value: 'closed' },
  { label: 'Merged', value: 'merged' },
  { label: 'All', value: 'all' },
]

onMounted(async () => {
  await github.loadHub()
  if (!github.connected) {
    await router.replace({ name: 'github' })
    return
  }
  await github.loadInbox(state.value)
})

watch(state, (value) => {
  void github.loadInbox(value)
})

function formatDate(value: string | null): string {
  if (!value) return '—'
  return new Date(value).toLocaleString()
}
</script>

<template>
  <NexusPageWrapper show-toolbar title="Pull requests">
    <div class="github-page">
      <NexusGithubChrome>
        <div class="filters">
          <Select
            v-model="state"
            :options="stateOptions"
            option-label="label"
            option-value="value"
            class="state-select"
          />
        </div>

        <div v-if="github.inboxLoading" class="empty">Loading pull requests…</div>
        <div v-else-if="github.inbox.length === 0" class="empty">
          No pull requests found for this filter.
        </div>
        <ul v-else class="pull-list">
          <li v-for="pull in github.inbox" :key="String(pull.id)">
            <router-link
              v-if="pull.repository.owner && pull.repository.name && pull.number"
              :to="{
                name: 'github-pull-detail',
                params: {
                  owner: pull.repository.owner,
                  repo: pull.repository.name,
                  number: pull.number,
                },
              }"
              class="pull-row"
            >
              <div class="pull-main">
                <strong>{{ pull.title }}</strong>
                <span class="badge">#{{ pull.number }}</span>
                <span v-if="pull.draft" class="draft-chip">Draft</span>
              </div>
              <div class="pull-meta">
                <span>{{ pull.repository.full_name }}</span>
                <span>{{ pull.state }}</span>
                <span>Updated {{ formatDate(pull.updated_at) }}</span>
              </div>
            </router-link>
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

.filters {
  display: flex;
  gap: 0.75rem;
}

.state-select {
  min-width: 10rem;
}

.pull-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.55rem;
}

.pull-row {
  display: block;
  padding: 0.9rem 1rem;
  border-radius: 0.85rem;
  text-decoration: none;
  color: inherit;
  background: color-mix(in srgb, var(--lavender-blush) 4%, transparent);
  border: 1px solid color-mix(in srgb, var(--lavender-blush) 10%, transparent);
}

.pull-row:hover {
  border-color: color-mix(in srgb, var(--github-ink) 35%, transparent);
}

.pull-main {
  display: flex;
  gap: 0.5rem;
  align-items: center;
  flex-wrap: wrap;
}

.badge {
  font-size: 0.75rem;
  color: var(--github-ink);
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

.pull-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  margin-top: 0.4rem;
  font-size: 0.8rem;
  color: color-mix(in srgb, var(--lavender-blush) 50%, transparent);
}

.empty {
  padding: 1.25rem;
  color: color-mix(in srgb, var(--lavender-blush) 55%, transparent);
}
</style>
