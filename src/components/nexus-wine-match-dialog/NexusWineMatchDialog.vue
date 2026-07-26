<script setup lang="ts">
import { ref, watch } from 'vue'
import type {
  WineCandidatesResponse,
  WineMatchCandidate,
} from '@/types/food-drink/cellar'

const props = defineProps<{
  visible: boolean
  loading: boolean
  result: WineCandidatesResponse | null
}>()

const emit = defineEmits<{
  'update:visible': [value: boolean]
  search: [query: string]
  select: [candidate: WineMatchCandidate]
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
    header="Match wine in WineAPI"
    class="match-dialog"
    style="width: min(560px, 94vw)"
    @update:visible="emit('update:visible', $event)"
  >
    <div class="search-row">
      <InputText
        v-model="query"
        placeholder="Search by name, winery, vintage…"
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

    <Message
      v-if="result?.message"
      severity="warn"
      :closable="false"
      class="mt"
    >
      {{ result.message }}
    </Message>

    <p v-if="result?.from_cache" class="hint">Showing cached results.</p>

    <div v-if="loading" class="loading">
      <ProgressSpinner style="width: 2rem; height: 2rem" />
    </div>

    <ul v-else-if="result?.candidates?.length" class="candidates">
      <li v-for="c in result.candidates" :key="c.wineapi_id">
        <button type="button" class="candidate" @click="emit('select', c)">
          <div>
            <strong>{{ c.name }}</strong>
            <span>
              {{ [c.winery, c.vintage, c.region].filter(Boolean).join(' · ') }}
            </span>
          </div>
          <Tag
            v-if="c.confidence != null"
            :value="`${Math.round(c.confidence * 100)}%`"
            severity="info"
            rounded
          />
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
  justify-content: space-between;
  align-items: center;
  gap: 0.75rem;
  text-align: left;
  padding: 0.7rem 0.8rem;
  border-radius: 0.6rem;
  border: 1px solid color-mix(in srgb, var(--lavender-blush) 12%, transparent);
  background: color-mix(in srgb, var(--coffee-bean-panel) 80%, transparent);
  color: inherit;
  cursor: pointer;
}

.candidate:hover {
  border-color: var(--wine-accent);
}

.candidate strong {
  display: block;
}

.candidate span {
  display: block;
  font-size: 0.8rem;
  opacity: 0.7;
  margin-top: 0.15rem;
}

.hint,
.empty {
  font-size: 0.85rem;
  opacity: 0.7;
  margin: 0.6rem 0 0;
}

.mt {
  margin-top: 0.75rem;
}

.loading {
  display: flex;
  justify-content: center;
  padding: 1.5rem;
}
</style>
