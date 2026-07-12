<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useGithubStore } from '@stores/github/github.store'
import NexusGithubIcon from '@components/nexus-github-icon/NexusGithubIcon.vue'
import type { GithubInboxPull, GithubPulseCommit } from '@/types/github/github'

const github = useGithubStore()
const router = useRouter()

onMounted(() => {
  void github.loadPulse()
})

const openPulls = computed(() => github.pulse?.open_pulls ?? [])
const mergedPulls = computed(() => github.pulse?.merged_pulls ?? [])
const recentCommits = computed(() => github.pulse?.commits ?? [])

const hasActivity = computed(
  () =>
    openPulls.value.length > 0 ||
    mergedPulls.value.length > 0 ||
    recentCommits.value.length > 0,
)

const mode = computed<'connect' | 'loading' | 'empty' | 'list'>(() => {
  if (!github.connected && !github.statusLoading) return 'connect'
  if (github.pulseLoading || github.statusLoading) return 'loading'
  if (!hasActivity.value) return 'empty'
  return 'list'
})

function openPull(pull: GithubInboxPull): void {
  if (!pull.repository.owner || !pull.repository.name || pull.number == null) {
    return
  }
  void router.push({
    name: 'github-pull-detail',
    params: {
      owner: pull.repository.owner,
      repo: pull.repository.name,
      number: pull.number,
    },
  })
}

function openCommit(commit: GithubPulseCommit): void {
  if (commit.html_url) {
    window.open(commit.html_url, '_blank', 'noopener,noreferrer')
    return
  }
  void router.push({
    name: 'github-repo',
    params: {
      owner: commit.repository.owner,
      repo: commit.repository.name,
    },
  })
}

function formatRelative(value: string | null): string {
  if (!value) return ''
  const at = Date.parse(value)
  if (!Number.isFinite(at)) return ''
  const diffMs = Date.now() - at
  const minutes = Math.floor(diffMs / 60_000)
  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d ago`
  return new Date(at).toLocaleDateString()
}

function commitSubject(message: string | null): string {
  if (!message) return 'Commit'
  return message.split('\n')[0]?.trim() || 'Commit'
}
</script>

<template>
  <article class="pulse-card">
    <header class="pulse-head">
      <div class="pulse-brand">
        <NexusGithubIcon :size="22" />
        <div>
          <h3>GitHub pulse</h3>
          <p class="subtitle">
            <template v-if="mode === 'connect'">
              Connect to see where you left off
            </template>
            <template v-else-if="mode === 'loading'">Loading…</template>
            <template v-else>
              {{ openPulls.length }} open
              <router-link :to="{ name: 'github-pulls' }" class="inbox-link">
                View PRs
              </router-link>
            </template>
          </p>
        </div>
      </div>
      <Button
        v-if="mode === 'connect'"
        label="Connect"
        icon="pi pi-link"
        size="small"
        @click.stop="github.connect()"
      />
      <Button
        v-else
        label="Hub"
        icon="pi pi-arrow-right"
        size="small"
        severity="secondary"
        text
        @click.stop="router.push({ name: 'github' })"
      />
    </header>

    <div v-if="mode === 'connect'" class="pulse-empty">
      Open PRs, recent merges, and latest commits across your repos.
    </div>
    <div v-else-if="mode === 'loading'" class="pulse-empty">
      Fetching your GitHub snapshot…
    </div>
    <div v-else-if="mode === 'empty'" class="pulse-empty">
      Nothing recent yet. Sync from the GitHub hub after connecting.
    </div>

    <template v-else>
      <section v-if="openPulls.length" class="pulse-section">
        <h4>Open pull requests</h4>
        <ul class="pulse-list">
          <li v-for="pull in openPulls" :key="`open-${pull.id}`">
            <button type="button" class="pulse-row" @click="openPull(pull)">
              <span class="pulse-title">{{ pull.title }}</span>
              <span class="pulse-meta">
                {{ pull.repository.full_name }} · #{{ pull.number }}
                <span v-if="pull.draft" class="chip">draft</span>
              </span>
            </button>
          </li>
        </ul>
      </section>

      <section v-if="mergedPulls.length" class="pulse-section">
        <h4>Recently merged</h4>
        <ul class="pulse-list">
          <li v-for="pull in mergedPulls" :key="`merged-${pull.id}`">
            <button type="button" class="pulse-row" @click="openPull(pull)">
              <span class="pulse-title">{{ pull.title }}</span>
              <span class="pulse-meta">
                {{ pull.repository.full_name }} · #{{ pull.number }}
                <span class="chip chip-merged">merged</span>
                <span class="pulse-time">{{
                  formatRelative(pull.updated_at)
                }}</span>
              </span>
            </button>
          </li>
        </ul>
      </section>

      <section v-if="recentCommits.length" class="pulse-section">
        <h4>Recent commits</h4>
        <ul class="pulse-list">
          <li
            v-for="commit in recentCommits"
            :key="`${commit.repository.full_name}-${commit.sha}`"
          >
            <button type="button" class="pulse-row" @click="openCommit(commit)">
              <span class="pulse-title">{{
                commitSubject(commit.message)
              }}</span>
              <span class="pulse-meta">
                {{ commit.repository.full_name }} ·
                {{ commit.sha?.slice(0, 7) }}
                <span class="pulse-time">{{
                  formatRelative(commit.author_date)
                }}</span>
              </span>
            </button>
          </li>
        </ul>
      </section>
    </template>
  </article>
</template>

<style scoped>
.pulse-card {
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
  padding: 1rem 1.1rem;
  border-radius: 1rem;
  background: var(--github-card-surface);
  border: 1px solid color-mix(in srgb, var(--lavender-blush) 10%, transparent);
  color: var(--github-ink);
}

.pulse-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.75rem;
}

.pulse-brand {
  display: flex;
  gap: 0.75rem;
  align-items: flex-start;
  min-width: 0;
}

.pulse-brand h3 {
  margin: 0;
  font-size: 1.05rem;
  color: var(--lavender-blush);
}

.subtitle {
  margin: 0.2rem 0 0;
  font-size: 0.85rem;
  color: color-mix(in srgb, var(--lavender-blush) 60%, transparent);
}

.inbox-link {
  margin-left: 0.35rem;
  color: var(--github-ink);
  text-decoration: none;
  font-weight: 600;
}

.pulse-empty {
  padding: 0.35rem 0 0.15rem;
  color: color-mix(in srgb, var(--lavender-blush) 58%, transparent);
  font-size: 0.92rem;
  line-height: 1.4;
}

.pulse-section h4 {
  margin: 0 0 0.45rem;
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: color-mix(in srgb, var(--lavender-blush) 55%, transparent);
}

.pulse-section + .pulse-section {
  margin-top: 0.35rem;
  padding-top: 0.65rem;
  border-top: 1px solid color-mix(in srgb, var(--lavender-blush) 8%, transparent);
}

.pulse-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.pulse-row {
  width: 100%;
  text-align: left;
  border: 0;
  cursor: pointer;
  padding: 0.5rem 0.6rem;
  border-radius: 0.6rem;
  background: color-mix(in srgb, var(--lavender-blush) 4%, transparent);
  color: inherit;
}

.pulse-row:hover {
  background: color-mix(in srgb, var(--github-black) 45%, transparent);
}

.pulse-title {
  display: block;
  font-weight: 600;
  font-size: 0.92rem;
  color: var(--lavender-blush);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.pulse-meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.35rem;
  margin-top: 0.15rem;
  font-size: 0.76rem;
  color: color-mix(in srgb, var(--lavender-blush) 52%, transparent);
}

.pulse-time {
  margin-left: auto;
  color: color-mix(in srgb, var(--lavender-blush) 45%, transparent);
}

.chip {
  font-size: 0.65rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.03em;
  padding: 0.1rem 0.35rem;
  border-radius: 999px;
  color: color-mix(in srgb, var(--lavender-blush) 80%, transparent);
  background: color-mix(in srgb, var(--lavender-blush) 10%, transparent);
}

.chip-merged {
  color: var(--meadow-green);
  background: color-mix(in srgb, var(--meadow-green) 16%, transparent);
}
</style>
