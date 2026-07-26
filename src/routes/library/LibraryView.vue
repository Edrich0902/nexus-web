<script setup lang="ts">
import { onMounted, reactive, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import NexusPageWrapper from '@components/nexus-page-wrapper/NexusPageWrapper.vue'
import NexusLibraryIcon from '@components/nexus-library-icon/NexusLibraryIcon.vue'
import NexusLibraryCard from '@components/nexus-library-card/NexusLibraryCard.vue'
import NexusRatingInput from '@components/nexus-rating-input/NexusRatingInput.vue'
import NexusSkeletonCards from '@components/nexus-skeleton-cards/NexusSkeletonCards.vue'
import NexusImage from '@components/nexus-image/NexusImage.vue'
import { useLibraryStore } from '@stores/library/library.store'
import type {
  LibraryBookStatus,
  LibrarySearchResult,
} from '@/types/library/library'

const library = useLibraryStore()
const router = useRouter()

const statusFilter = ref<LibraryBookStatus | ''>('')
const searchQ = ref('')
const showCreate = ref(false)
const createTab = ref<'manual' | 'catalog'>('manual')
const catalogQuery = ref('')

const form = reactive({
  title: '',
  authors: '',
  isbn: '',
  status: 'want' as LibraryBookStatus,
  rating: null as number | null,
  notes: '',
})

const statusOptions = [
  { label: 'All', value: '' },
  { label: 'Want to read', value: 'want' },
  { label: 'Reading', value: 'reading' },
  { label: 'Read', value: 'read' },
]

const createStatusOptions = [
  { label: 'Want to read', value: 'want' },
  { label: 'Reading', value: 'reading' },
  { label: 'Read', value: 'read' },
]

onMounted(() => {
  void reload()
})

watch(statusFilter, () => {
  void reload()
})

async function reload(): Promise<void> {
  await library.loadBooks({
    q: searchQ.value.trim() || undefined,
    status: statusFilter.value || undefined,
  })
}

function resetCreateForm(): void {
  form.title = ''
  form.authors = ''
  form.isbn = ''
  form.status = 'want'
  form.rating = null
  form.notes = ''
  catalogQuery.value = ''
  createTab.value = 'manual'
  library.clearCatalogResults()
}

function openCreate(): void {
  resetCreateForm()
  showCreate.value = true
}

async function searchCatalog(): Promise<void> {
  if (catalogQuery.value.trim()) {
    await library.searchCatalog(catalogQuery.value.trim())
  }
}

async function submitManual(): Promise<void> {
  if (!form.title.trim()) return
  const created = await library.createBook({
    title: form.title.trim(),
    authors: form.authors.trim() || null,
    isbn: form.isbn.trim() || null,
    status: form.status,
    rating: form.rating,
    notes: form.notes || null,
  })
  if (created) {
    showCreate.value = false
    await router.push({ name: 'library-book', params: { bookId: created.id } })
  }
}

async function pickCatalog(result: LibrarySearchResult): Promise<void> {
  const created = await library.createFromCatalog({
    ol_work_key: result.ol_work_key,
    status: form.status,
    rating: form.rating,
    notes: form.notes || null,
  })
  if (created) {
    showCreate.value = false
    await router.push({ name: 'library-book', params: { bookId: created.id } })
  }
}
</script>

<template>
  <NexusPageWrapper show-toolbar title="Library">
    <template #toolbar>
      <Button label="Add book" icon="pi pi-plus" @click="openCreate" />
    </template>

    <div class="library-page">
      <header class="hero">
        <div class="icon-wrap"><NexusLibraryIcon :size="28" /></div>
        <div>
          <p class="eyebrow">Collections</p>
          <h1>Library</h1>
          <p class="lede">
            Log books on your shelf, track reading status, and match titles to
            Open Library for covers and metadata.
          </p>
        </div>
      </header>

      <div class="filters">
        <SelectButton
          v-model="statusFilter"
          :options="statusOptions"
          option-label="label"
          option-value="value"
          :allow-empty="false"
        />
        <div class="search">
          <InputText
            v-model="searchQ"
            placeholder="Search title or author…"
            class="w-full"
            @keyup.enter="reload"
          />
          <Button icon="pi pi-search" :loading="library.booksLoading" @click="reload" />
        </div>
      </div>

      <NexusSkeletonCards v-if="library.booksLoading" />
      <div v-else-if="library.books.length" class="grid">
        <NexusLibraryCard
          v-for="book in library.books"
          :key="book.id"
          :book="book"
        />
      </div>
      <p v-else class="empty">No books on this shelf yet.</p>
    </div>

    <Dialog
      v-model:visible="showCreate"
      modal
      header="Add book"
      style="width: min(520px, 94vw)"
    >
      <SelectButton
        v-model="createTab"
        :options="[
          { label: 'Manual', value: 'manual' },
          { label: 'Open Library', value: 'catalog' },
        ]"
        option-label="label"
        option-value="value"
        :allow-empty="false"
        class="mb"
      />

      <div class="form">
        <label>
          Status
          <Select
            v-model="form.status"
            :options="createStatusOptions"
            option-label="label"
            option-value="value"
            class="w-full"
          />
        </label>

        <template v-if="createTab === 'manual'">
          <label>
            Title
            <InputText v-model="form.title" class="w-full" />
          </label>
          <label>
            Authors
            <InputText v-model="form.authors" class="w-full" />
          </label>
          <label>
            ISBN
            <InputText v-model="form.isbn" class="w-full" />
          </label>
        </template>

        <template v-else>
          <div class="search">
            <InputText
              v-model="catalogQuery"
              placeholder="Search Open Library…"
              class="w-full"
              @keyup.enter="searchCatalog"
            />
            <Button icon="pi pi-search" @click="searchCatalog" />
          </div>
          <ul v-if="library.catalogResults.length" class="catalog-results">
            <li v-for="r in library.catalogResults" :key="r.ol_work_key">
              <button type="button" class="catalog-row" @click="pickCatalog(r)">
                <NexusImage
                  :src="r.cover_url"
                  :alt="r.title || 'Cover'"
                  variant="thumb"
                  size="sm"
                  fit="cover"
                  class="thumb"
                />
                <div>
                  <strong>{{ r.title }}</strong>
                  <span>
                    {{
                      [r.authors?.join(', '), r.publish_year]
                        .filter(Boolean)
                        .join(' · ')
                    }}
                  </span>
                </div>
              </button>
            </li>
          </ul>
        </template>

        <label>
          Rating
          <NexusRatingInput v-model="form.rating" />
        </label>
        <label>
          Notes
          <Textarea v-model="form.notes" rows="3" class="w-full" auto-resize />
        </label>
      </div>

      <template #footer>
        <Button
          label="Cancel"
          severity="secondary"
          text
          @click="showCreate = false"
        />
        <Button
          v-if="createTab === 'manual'"
          label="Save"
          :loading="library.saving"
          @click="submitManual"
        />
      </template>
    </Dialog>
  </NexusPageWrapper>
</template>

<style scoped>
.library-page {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.hero {
  display: flex;
  gap: 1rem;
  align-items: flex-start;
  padding: 1.1rem 1.2rem;
  border-radius: 1.1rem;
  background: var(--library-card-surface);
}

.icon-wrap {
  display: grid;
  place-items: center;
  width: 3rem;
  height: 3rem;
  border-radius: 0.85rem;
  background: color-mix(in srgb, var(--library-accent) 22%, transparent);
  color: var(--library-accent);
}

.eyebrow {
  margin: 0;
  color: var(--library-accent);
  font-size: 0.9rem;
  font-weight: 600;
}

h1 {
  margin: 0.15rem 0 0.35rem;
  font-size: clamp(1.6rem, 3vw, 2rem);
}

.lede {
  margin: 0;
  opacity: 0.75;
  max-width: 42rem;
}

.filters {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  align-items: center;
  justify-content: space-between;
}

.search {
  display: flex;
  gap: 0.45rem;
  min-width: min(100%, 18rem);
  flex: 1;
}

.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(11.5rem, 1fr));
  gap: 1rem;
}

.empty {
  margin: 0;
  opacity: 0.7;
}

.mb {
  margin-bottom: 0.85rem;
}

.form {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.form label {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  font-size: 0.85rem;
}

.catalog-results {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  max-height: 240px;
  overflow: auto;
}

.catalog-row {
  width: 100%;
  display: flex;
  gap: 0.65rem;
  align-items: center;
  text-align: left;
  border: 0;
  border-radius: 0.65rem;
  padding: 0.45rem 0.55rem;
  background: color-mix(in srgb, var(--library-accent) 12%, transparent);
  color: inherit;
  cursor: pointer;
}

.catalog-row:hover {
  background: color-mix(in srgb, var(--library-accent) 22%, transparent);
}

.catalog-row strong,
.catalog-row span {
  display: block;
}

.catalog-row span {
  font-size: 0.8rem;
  opacity: 0.7;
}

.thumb {
  width: 2.4rem;
  height: 3.3rem;
  border-radius: 0.3rem;
  overflow: hidden;
  flex: 0 0 auto;
}
</style>
