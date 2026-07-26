<script setup lang="ts">
import { ref, watch } from 'vue'
import NexusImage from '@components/nexus-image/NexusImage.vue'
import type {
  LibraryCandidatesResponse,
  LibrarySearchResult,
} from '@/types/library/library'

const props = defineProps<{
  visible: boolean
  loading: boolean
  result: LibraryCandidatesResponse | null
}>()

const emit = defineEmits<{
  'update:visible': [value: boolean]
  search: [query: string]
  select: [candidate: LibrarySearchResult]
  'no-match': []
}>()

const query = ref('')

watch(
  () => props.visible,
  (open) => {
    if (open) query.value = ''
  },
)
</script>

<template>
  <Dialog
    :visible="visible"
    modal
    header="Match book in Open Library"
    class="match-dialog"
    style="width: min(560px, 94vw)"
    @update:visible="emit('update:visible', $event)"
  >
    <div class="search-row">
      <InputText
        v-model="query"
        placeholder="Search by title, author, or ISBN…"
        class="w-full"
        @keyup.enter="emit('search', query)"
      />
      <Button
        label="Search"
        icon="pi pi-search"
        :loading="loading"
        @click="emit('search', query)"
      />
    </div>

    <p v-if="result?.from_cache" class="hint">Showing cached results.</p>

    <div v-if="loading" class="loading">
      <ProgressSpinner style="width: 2rem; height: 2rem" />
    </div>

    <ul v-else-if="result?.candidates?.length" class="candidates">
      <li v-for="c in result.candidates" :key="c.ol_work_key">
        <button type="button" class="candidate" @click="emit('select', c)">
          <NexusImage
            :src="c.cover_url"
            :alt="c.title || 'Cover'"
            variant="thumb"
            size="sm"
            fit="cover"
            class="thumb"
          />
          <div class="meta">
            <strong>{{ c.title }}</strong>
            <span>
              {{
                [c.authors?.join(', '), c.publish_year].filter(Boolean).join(' · ')
              }}
            </span>
          </div>
        </button>
      </li>
    </ul>

    <p v-else-if="result" class="empty">No candidates found.</p>

    <template #footer>
      <Button
        label="No match in catalog"
        severity="secondary"
        text
        @click="emit('no-match')"
      />
      <Button
        label="Close"
        severity="secondary"
        @click="emit('update:visible', false)"
      />
    </template>
  </Dialog>
</template>

<style scoped>
.search-row {
  display: flex;
  gap: 0.5rem;
}

.candidates {
  list-style: none;
  margin: 0.75rem 0 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  max-height: 320px;
  overflow: auto;
}

.candidate {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  text-align: left;
  border: 0;
  border-radius: 0.65rem;
  padding: 0.55rem 0.65rem;
  background: color-mix(in srgb, var(--library-accent) 10%, transparent);
  color: inherit;
  cursor: pointer;
}

.candidate:hover {
  background: color-mix(in srgb, var(--library-accent) 22%, transparent);
}

.thumb {
  flex: 0 0 auto;
  width: 2.5rem;
  height: 3.5rem;
  border-radius: 0.35rem;
  overflow: hidden;
}

.meta {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
  min-width: 0;
}

.meta strong {
  font-size: 0.95rem;
}

.meta span {
  font-size: 0.8rem;
  opacity: 0.7;
}

.hint,
.empty {
  margin: 0.75rem 0 0;
  opacity: 0.7;
  font-size: 0.9rem;
}

.loading {
  display: grid;
  place-items: center;
  padding: 1.5rem 0;
}
</style>
