<script setup lang="ts">
import NexusImage from '@components/nexus-image/NexusImage.vue'
import type { LibrarySearchResult } from '@/types/library/library'

/** Open Library search results as pickable rows with a small cover. */
defineProps<{
  items: LibrarySearchResult[]
}>()

defineEmits<{ pick: [item: LibrarySearchResult] }>()
</script>

<template>
  <ul class="candidates">
    <li v-for="c in items" :key="c.ol_work_key">
      <button type="button" @click="$emit('pick', c)">
        <NexusImage :src="c.cover_url" :alt="''" variant="thumb" size="sm" fit="cover" class="cover" />
        <span class="copy">
          <b>{{ c.title }}</b>
          <span>{{ [c.authors?.join(', '), c.publish_year].filter(Boolean).join(' · ') }}</span>
        </span>
      </button>
    </li>
  </ul>
</template>

<style scoped>
.candidates {
  list-style: none;
  margin: 0;
  padding: 4px;
  max-height: 300px;
  overflow: auto;
  border-radius: var(--r-md);
  background: var(--surface);
}

button {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 10px;
  border: 0;
  border-radius: var(--r-sm);
  background: transparent;
  color: inherit;
  font: inherit;
  text-align: left;
  cursor: pointer;
}

button:hover {
  background: var(--tint-2);
}

.cover {
  flex: 0 0 auto;
  width: 36px;
  height: 54px;
  border-radius: 4px;
  overflow: hidden;
}

.copy {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

b {
  font-weight: 600;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.copy span {
  font-size: 13px;
  color: var(--ink-3);
}
</style>
