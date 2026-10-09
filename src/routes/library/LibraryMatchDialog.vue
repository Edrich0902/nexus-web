<script setup lang="ts">
import { ref, watch } from 'vue'
import NxSkeletonRows from '@design/components/skeletons/NxSkeletonRows.vue'
import type { LibraryCandidatesResponse, LibrarySearchResult } from '@/types/library/library'
import BookCandidates from './BookCandidates.vue'

defineProps<{
  loading: boolean
  result: LibraryCandidatesResponse | null
}>()

const visible = defineModel<boolean>('visible', { required: true })

const emit = defineEmits<{
  search: [query: string]
  select: [candidate: LibrarySearchResult]
  'no-match': []
}>()

const query = ref('')

watch(visible, (open) => {
  if (open) query.value = ''
})
</script>

<template>
  <Dialog v-model:visible="visible" modal header="Match in Open Library" style="width: min(560px, 94vw)">
    <form class="nx-form" @submit.prevent="emit('search', query)">
      <div class="lookup">
        <InputText v-model="query" placeholder="Title, author or ISBN" autofocus />
        <Button type="submit" label="Search" severity="secondary" rounded :loading="loading" />
      </div>
      <NxSkeletonRows v-if="loading" :rows="4" />
      <BookCandidates
        v-else-if="result?.candidates?.length"
        :items="result.candidates"
        @pick="emit('select', $event)"
      />
      <p v-else-if="result" class="hint">{{ result.message || 'No matches found. Try the author or ISBN.' }}</p>
      <p v-if="result?.from_cache && !loading" class="hint">Showing cached results.</p>
    </form>
    <template #footer>
      <Button label="It is not listed" text severity="secondary" @click="emit('no-match')" />
      <Button label="Close" rounded severity="secondary" @click="visible = false" />
    </template>
  </Dialog>
</template>

<style scoped>
.lookup {
  display: flex;
  gap: 8px;
}

.lookup :deep(.p-inputtext) {
  flex: 1;
}
</style>
