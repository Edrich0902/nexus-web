<script setup lang="ts">
import NxIcon from '@design/components/NxIcon.vue'
import { relativeTime } from '@lib/datetime'
import { languageColour } from './code'

/** A repository as a hairline row: owner/name, description, language and last push. */
defineProps<{
  owner: string | null
  name: string | null
  description?: string | null
  language?: string | null
  isPrivate?: boolean
  starred?: boolean
  pushedAt?: string | null
  stars?: number | null
  href?: string | null
}>()
</script>

<template>
  <component
    :is="owner && name ? 'RouterLink' : 'a'"
    :to="owner && name ? { name: 'github-repo', params: { owner, repo: name } } : undefined"
    :href="owner && name ? undefined : (href ?? undefined)"
    :target="owner && name ? undefined : '_blank'"
    :rel="owner && name ? undefined : 'noopener noreferrer'"
    class="repo"
  >
    <span class="top">
      <span class="name"><span class="owner">{{ owner }}/</span>{{ name }}</span>
      <span v-if="isPrivate" class="vis">Private</span>
      <NxIcon v-if="starred" name="star" :size="14" class="star" />
    </span>
    <span v-if="description" class="desc">{{ description }}</span>
    <span class="meta">
      <span v-if="language" class="lang"><i :style="{ background: languageColour(language) }" />{{ language }}</span>
      <span v-if="stars != null">★ {{ stars }}</span>
      <span v-if="pushedAt">Pushed {{ relativeTime(pushedAt) }}</span>
    </span>
  </component>
</template>

<style scoped>
.repo {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 14px 0;
  border-top: 1px solid var(--line);
  color: inherit;
}

.repo:hover .name {
  text-decoration: underline;
  text-underline-offset: 3px;
}

.top {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}

.name {
  font-weight: 600;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.owner {
  color: var(--ink-3);
  font-weight: 400;
}

.vis {
  flex-shrink: 0;
  padding: 1px 8px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 600;
  color: var(--ink-2);
  background: var(--tint-2);
}

.star {
  flex-shrink: 0;
  color: var(--warn);
}

.desc {
  font-size: 14px;
  color: var(--ink-2);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.meta {
  display: flex;
  flex-wrap: wrap;
  gap: 4px 16px;
  font-size: 12px;
  color: var(--ink-3);
}

.lang {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.lang i {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}
</style>
