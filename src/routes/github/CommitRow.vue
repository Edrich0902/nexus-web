<script setup lang="ts">
import { relativeTime } from '@lib/datetime'
import type { GithubCommit } from '@/types/github/github'
import { firstLine, shortSha } from './code'

/** A commit as a hairline row: subject line, where and when, and the short SHA. */
defineProps<{
  commit: GithubCommit
  repo?: string | null
}>()
</script>

<template>
  <div class="commit">
    <span class="body">
      <b>{{ firstLine(commit.message) }}</b>
      <span class="meta">
        <span v-if="repo">{{ repo }}</span>
        <span v-if="commit.author_name">{{ commit.author_name }}</span>
        <span v-if="commit.author_date">{{ relativeTime(commit.author_date) }}</span>
      </span>
    </span>
    <a
      v-if="commit.html_url"
      :href="commit.html_url"
      target="_blank"
      rel="noopener noreferrer"
      class="sha"
      :aria-label="`Open commit ${shortSha(commit.sha)} on GitHub`"
      >{{ shortSha(commit.sha) }}</a
    >
    <span v-else class="sha">{{ shortSha(commit.sha) }}</span>
  </div>
</template>

<style scoped>
.commit {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 14px;
  align-items: center;
  padding: 12px 0;
  border-top: 1px solid var(--line);
}

.body {
  display: flex;
  flex-direction: column;
  gap: 3px;
  min-width: 0;
}

b {
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.meta {
  display: flex;
  flex-wrap: wrap;
  gap: 2px 12px;
  font-size: 12px;
  color: var(--ink-3);
}

.sha {
  font-family: var(--font-mono);
  font-size: 12px;
  color: var(--ink-3);
  padding: 2px 8px;
  border-radius: var(--r-xs);
  background: var(--tint);
}

a.sha:hover {
  color: var(--ink);
}
</style>
