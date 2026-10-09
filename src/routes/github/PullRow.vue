<script setup lang="ts">
import { computed } from 'vue'
import { relativeTime } from '@lib/datetime'
import type { GithubPullUser } from '@/types/github/github'
import { PULL_STATE_LABEL, pullState } from './code'

/** A pull request as a hairline row with a state dot; links to the in-app detail. */
const props = defineProps<{
  owner: string | null
  repo: string | null
  number: number | null
  title: string | null
  state: string | null
  draft?: boolean
  merged?: boolean
  mergedAt?: string | null
  updatedAt?: string | null
  user?: GithubPullUser | null
  /** Show "owner/repo" in the meta line (inbox views spanning repos). */
  showRepo?: boolean
  href?: string | null
}>()

const kind = computed(() =>
  pullState({ state: props.state, draft: props.draft, merged: props.merged, merged_at: props.mergedAt }),
)
const linkable = computed(() => Boolean(props.owner && props.repo && props.number))
</script>

<template>
  <component
    :is="linkable ? 'RouterLink' : 'a'"
    :to="linkable ? { name: 'github-pull-detail', params: { owner, repo, number } } : undefined"
    :href="linkable ? undefined : (href ?? undefined)"
    :target="linkable ? undefined : '_blank'"
    :rel="linkable ? undefined : 'noopener noreferrer'"
    class="pull"
  >
    <span class="dot" :class="`k-${kind}`" :title="PULL_STATE_LABEL[kind]" />
    <span class="body">
      <b>{{ title }}</b>
      <span class="meta">
        <span v-if="showRepo && owner && repo">{{ owner }}/{{ repo }}</span>
        <span class="mono">#{{ number }}</span>
        <span v-if="kind !== 'open'">{{ PULL_STATE_LABEL[kind] }}</span>
        <span v-if="user?.login">by {{ user.login }}</span>
        <span v-if="updatedAt">updated {{ relativeTime(updatedAt) }}</span>
      </span>
    </span>
    <img v-if="user?.avatar_url" :src="user.avatar_url" alt="" class="avatar" loading="lazy" />
  </component>
</template>

<style scoped>
.pull {
  display: grid;
  grid-template-columns: 10px minmax(0, 1fr) auto;
  gap: 14px;
  align-items: center;
  padding: 13px 0;
  border-top: 1px solid var(--line);
  color: inherit;
}

.pull:hover b {
  text-decoration: underline;
  text-underline-offset: 3px;
}

.dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  align-self: start;
  margin-top: 6px;
}

.k-open {
  background: var(--ok);
}

.k-draft {
  background: transparent;
  border: 2px solid var(--ink-3);
}

.k-merged {
  background: #b58cff;
}

.k-closed {
  background: var(--bad);
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

.meta {
  display: flex;
  flex-wrap: wrap;
  gap: 2px 12px;
  font-size: 12px;
  color: var(--ink-3);
}

.mono {
  font-family: var(--font-mono);
}

.avatar {
  width: 24px;
  height: 24px;
  border-radius: 50%;
}

@media (max-width: 640px) {
  .avatar {
    display: none;
  }
}
</style>
