<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import IndexTemplate from '@design/templates/IndexTemplate.vue'
import type { ViewState } from '@design/templates/types'
import NxStage from '@design/components/NxStage.vue'
import NxSearchField from '@design/components/NxSearchField.vue'
import NxPillGroup from '@design/components/NxPillGroup.vue'
import NxEmptyState from '@design/components/NxEmptyState.vue'
import NxIcon from '@design/components/NxIcon.vue'
import { usePaletteAmbient } from '@design/usePaletteAmbient'
import NexusImage from '@components/nexus-image/NexusImage.vue'
import NexusRatingInput from '@components/nexus-rating-input/NexusRatingInput.vue'
import CollectionFields from '@routes/collections/CollectionFields.vue'
import type { CollectionField } from '@routes/collections/collectionFields'
import CollectionPrints from '@routes/collections/CollectionPrints.vue'
import { bookPrint } from '@routes/collections/prints'
import { mediaDeliveryUrl } from '@lib/media'
import { useLibraryStore } from '@stores/library/library.store'
import type { LibraryBookStatus, LibrarySearchResult } from '@/types/library/library'
import BookCandidates from './BookCandidates.vue'
import { STATUS_OPTIONS, bookAuthors, isoDay, readableDate, splitBookTitle } from './library'

const library = useLibraryStore()
const router = useRouter()

const status = ref<LibraryBookStatus | 'all'>('all')
const query = ref('')

const filterOptions = [{ value: 'all' as const, label: 'All' }, ...STATUS_OPTIONS]

onMounted(() => {
  void reload()
  void library.loadPulse({ silent: true })
})

watch(status, () => void reload())

function reload(page = 1): Promise<void> {
  return library.loadBooks({
    q: query.value.trim() || undefined,
    status: status.value === 'all' ? undefined : status.value,
    page,
  })
}

const filtered = computed(() => status.value !== 'all' || Boolean(query.value.trim()))

const state = computed<ViewState>(() => {
  if (library.booksLoading && !library.books.length) return 'loading'
  if (library.books.length || filtered.value) return 'ready'
  return 'empty'
})

const hasMore = computed(() => library.books.length < library.booksTotal)
const prints = computed(() => library.books.map(bookPrint))

/* ── Stage: the book you are reading ───────────────────── */

const current = computed(() => library.pulse?.reading[0] ?? null)
const currentTitle = computed(() => splitBookTitle(current.value?.title ?? ''))

usePaletteAmbient(() => mediaDeliveryUrl(current.value?.media, 'thumb') ?? current.value?.image_url ?? null)

const currentLede = computed(() => {
  const b = current.value
  if (!b) return ''
  const started = readableDate(b.started_at)
  return [bookAuthors(b), started ? `started ${started}` : null].filter(Boolean).join(' · ')
})

async function finishCurrent(): Promise<void> {
  const b = current.value
  if (!b) return
  await library.updateBook(b.id, { title: b.title, status: 'read', finished_at: isoDay() })
  await Promise.all([library.loadPulse({ silent: true }), reload()])
}

const fields = computed<CollectionField[]>(() => {
  const c = library.pulse?.counts
  const reading = library.pulse?.reading ?? []
  return [
    { key: 'total', label: 'On the shelf', value: c?.total ?? library.booksTotal, variant: 'solid', span: 4 },
    reading[0]
      ? {
          key: 'reading',
          label: 'Reading now',
          aside: reading.length > 1 ? `+${reading.length - 1} more` : undefined,
          title: reading[0].title,
          variant: 'tint',
          span: 4,
          to: { name: 'library-book', params: { bookId: reading[0].id } },
        }
      : { key: 'reading', label: 'Reading now', title: 'Pick your next book', variant: 'outline', span: 4 },
    { key: 'read', label: 'Read', value: c?.read ?? 0, variant: 'tint', span: 2 },
    { key: 'want', label: 'Want to read', value: c?.want ?? 0, variant: 'outline', span: 2 },
  ]
})

/* ── Add a book ─────────────────────────────────────────── */

const showCreate = ref(false)
const createMode = ref<'catalog' | 'manual'>('catalog')
const catalogQuery = ref('')
const searching = ref(false)

const form = reactive({
  title: '',
  authors: '',
  isbn: '',
  status: 'want' as LibraryBookStatus,
  rating: null as number | null,
  notes: '',
})

function openCreate(): void {
  Object.assign(form, { title: '', authors: '', isbn: '', status: 'want', rating: null, notes: '' })
  catalogQuery.value = ''
  createMode.value = 'catalog'
  library.clearCatalogResults()
  showCreate.value = true
}

async function searchCatalog(): Promise<void> {
  const q = catalogQuery.value.trim()
  if (!q) return
  searching.value = true
  await library.searchCatalog(q)
  searching.value = false
}

async function created(id: number | undefined): Promise<void> {
  if (!id) return
  showCreate.value = false
  void library.loadPulse({ silent: true })
  await router.push({ name: 'library-book', params: { bookId: id } })
}

async function submitManual(): Promise<void> {
  if (!form.title.trim()) return
  const book = await library.createBook({
    title: form.title.trim(),
    authors: form.authors.trim() || null,
    isbn: form.isbn.trim() || null,
    status: form.status,
    rating: form.rating,
    notes: form.notes || null,
  })
  await created(book?.id)
}

async function pickCatalog(result: LibrarySearchResult): Promise<void> {
  const book = await library.createFromCatalog({
    ol_work_key: result.ol_work_key,
    status: form.status,
    rating: form.rating,
    notes: form.notes || null,
  })
  await created(book?.id)
}
</script>

<template>
  <IndexTemplate :state="state">
    <template #stage>
      <NxStage
        v-if="current"
        art="portrait"
        eyebrow="Reading now"
        :title="currentTitle.title"
        :accent="currentTitle.accent"
        :lede="currentLede"
      >
        <template #visual>
          <NexusImage
            :media="current.media"
            :src="current.image_url"
            :alt="current.title"
            variant="hero"
            size="fill"
            fit="cover"
          />
        </template>
        <template #actions>
          <Button rounded severity="contrast" label="Finished it" :loading="library.saving" @click="finishCurrent">
            <template #icon="{ class: iconClass }">
              <NxIcon name="check" :size="16" :class="iconClass" />
            </template>
          </Button>
          <Button
            as="router-link"
            rounded
            severity="secondary"
            label="Open book"
            :to="{ name: 'library-book', params: { bookId: current.id } }"
          />
          <Button rounded severity="secondary" label="Add a book" @click="openCreate">
            <template #icon="{ class: iconClass }">
              <NxIcon name="plus" :size="16" :class="iconClass" />
            </template>
          </Button>
        </template>
      </NxStage>
      <NxStage
        v-else
        size="compact"
        eyebrow="Library"
        title="Your"
        accent="shelf"
        lede="Books you own, are reading or want to read — matched to Open Library for covers and details."
      >
        <template #actions>
          <Button rounded severity="contrast" label="Add a book" @click="openCreate">
            <template #icon="{ class: iconClass }">
              <NxIcon name="plus" :size="16" :class="iconClass" />
            </template>
          </Button>
        </template>
      </NxStage>
    </template>

    <template v-if="library.pulse || state === 'loading'" #fields>
      <CollectionFields section="library" :fields="fields" />
    </template>

    <template #toolbar>
      <NxPillGroup v-model="status" :options="filterOptions" label="Reading status" size="sm" />
      <NxSearchField
        v-model="query"
        class="search"
        placeholder="Search title or author…"
        :debounce="350"
        @search="reload()"
      />
    </template>

    <template #empty>
      <NxEmptyState
        title="No books yet"
        body="Search Open Library to add a book with its cover, or add one by hand."
        icon="library"
      >
        <Button rounded label="Add your first book" @click="openCreate" />
      </NxEmptyState>
    </template>

    <NxEmptyState
      v-if="!library.books.length && !library.booksLoading"
      title="Nothing on this shelf"
      :body="query.trim() ? `No books match “${query.trim()}”.` : 'Try another reading status.'"
      icon="search"
    />
    <template v-else>
      <CollectionPrints :prints="prints" filter-label="Author" :class="{ dim: library.booksLoading }" />
      <div v-if="hasMore" class="more">
        <Button
          rounded
          severity="secondary"
          :label="`Show more · ${library.booksTotal - library.books.length} left`"
          :loading="library.booksLoading"
          @click="reload(library.booksPage + 1)"
        />
      </div>
    </template>
  </IndexTemplate>

  <Dialog v-model:visible="showCreate" modal header="Add a book" style="width: min(540px, 94vw)">
    <form id="add-book" class="nx-form" @submit.prevent="createMode === 'manual' ? submitManual() : searchCatalog()">
      <NxPillGroup
        v-model="createMode"
        :options="[
          { value: 'catalog', label: 'Open Library' },
          { value: 'manual', label: 'By hand' },
        ]"
        label="How to add"
        size="sm"
      />

      <template v-if="createMode === 'catalog'">
        <div class="lookup">
          <InputText v-model="catalogQuery" placeholder="Title, author or ISBN" autofocus />
          <Button type="submit" label="Search" severity="secondary" rounded :loading="searching" />
        </div>
        <BookCandidates v-if="library.catalogResults.length" :items="library.catalogResults" @pick="pickCatalog" />
        <p v-else class="hint">Pick a result to add it with its cover and details.</p>
      </template>

      <template v-else>
        <label class="f">
          <span>Title</span>
          <InputText v-model="form.title" autofocus />
        </label>
        <div class="row">
          <label class="f">
            <span>Authors</span>
            <InputText v-model="form.authors" />
          </label>
          <label class="f">
            <span>ISBN</span>
            <InputText v-model="form.isbn" />
          </label>
        </div>
      </template>

      <div class="row">
        <label class="f">
          <span>Status</span>
          <Select v-model="form.status" :options="STATUS_OPTIONS" option-label="label" option-value="value" />
        </label>
        <div class="f">
          <span>Rating</span>
          <NexusRatingInput v-model="form.rating" />
        </div>
      </div>
      <label class="f">
        <span>Notes</span>
        <Textarea v-model="form.notes" rows="2" auto-resize />
      </label>
    </form>
    <template #footer>
      <Button label="Cancel" text severity="secondary" @click="showCreate = false" />
      <Button
        v-if="createMode === 'manual'"
        type="submit"
        form="add-book"
        rounded
        label="Add book"
        :loading="library.saving"
        :disabled="!form.title.trim()"
      />
    </template>
  </Dialog>
</template>

<style scoped>
.search {
  flex: 1;
  min-width: min(100%, 260px);
}

.dim {
  opacity: 0.55;
  transition: opacity 0.2s;
}

.more {
  display: flex;
  justify-content: center;
  margin-top: 28px;
}

.lookup {
  display: flex;
  gap: 8px;
}

.lookup :deep(.p-inputtext) {
  flex: 1;
}
</style>
