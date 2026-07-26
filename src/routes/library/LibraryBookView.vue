<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import NexusPageWrapper from '@components/nexus-page-wrapper/NexusPageWrapper.vue'
import NexusImage from '@components/nexus-image/NexusImage.vue'
import NexusImageUploader from '@components/nexus-image-uploader/NexusImageUploader.vue'
import NexusRatingDisplay from '@components/nexus-rating-display/NexusRatingDisplay.vue'
import NexusRatingInput from '@components/nexus-rating-input/NexusRatingInput.vue'
import NexusSkeletonMedia from '@components/nexus-skeleton-media/NexusSkeletonMedia.vue'
import NexusLibraryMatchDialog from '@components/nexus-library-match-dialog/NexusLibraryMatchDialog.vue'
import { useLibraryStore } from '@stores/library/library.store'
import type { LibraryBookStatus, LibrarySearchResult } from '@/types/library/library'
import type { MediaImage } from '@/types/media/media'

const library = useLibraryStore()
const route = useRoute()
const router = useRouter()
const bookId = computed(() => Number(route.params.bookId))
const showImageUploader = ref(false)
const showMatch = ref(false)
const editing = ref(false)

const form = reactive({
  title: '',
  authors: '',
  isbn: '',
  status: 'want' as LibraryBookStatus,
  rating: null as number | null,
  notes: '',
  started_at: null as Date | null,
  finished_at: null as Date | null,
})

const statusOptions = [
  { label: 'Want to read', value: 'want' },
  { label: 'Reading', value: 'reading' },
  { label: 'Read', value: 'read' },
]

const statusLabel = computed(() => {
  const status = library.book?.status
  return statusOptions.find((o) => o.value === status)?.label ?? status
})

async function load(): Promise<void> {
  if (Number.isFinite(bookId.value)) await library.loadBook(bookId.value)
  syncForm()
}

function syncForm(): void {
  const book = library.book
  if (!book) return
  form.title = book.title
  form.authors = book.authors ?? ''
  form.isbn = book.isbn ?? ''
  form.status = book.status
  form.rating = book.rating
  form.notes = book.notes ?? ''
  form.started_at = book.started_at ? new Date(book.started_at) : null
  form.finished_at = book.finished_at ? new Date(book.finished_at) : null
}

function toDateString(value: Date | null): string | null {
  if (!value) return null
  const y = value.getFullYear()
  const m = String(value.getMonth() + 1).padStart(2, '0')
  const d = String(value.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

onMounted(load)
watch(bookId, load)

async function save(): Promise<void> {
  await library.updateBook(bookId.value, {
    title: form.title.trim(),
    authors: form.authors.trim() || null,
    isbn: form.isbn.trim() || null,
    status: form.status,
    rating: form.rating,
    notes: form.notes || null,
    started_at: toDateString(form.started_at),
    finished_at: toDateString(form.finished_at),
  })
  editing.value = false
  syncForm()
}

async function remove(): Promise<void> {
  if (await library.removeBook(bookId.value)) {
    await router.push({ name: 'library' })
  }
}

function openMatch(): void {
  showMatch.value = true
  void library.fetchCandidates(bookId.value)
}

async function onSearch(query: string): Promise<void> {
  await library.fetchCandidates(bookId.value, query.trim() || undefined)
}

async function onSelect(candidate: LibrarySearchResult): Promise<void> {
  await library.confirmMatch(bookId.value, candidate.ol_work_key)
  showMatch.value = false
  syncForm()
}

async function onNoMatch(): Promise<void> {
  await library.markNoMatch(bookId.value)
  showMatch.value = false
}

function onImageUploaded(image: MediaImage | null): void {
  if (!library.book || !image) return
  library.book.media = image
  library.book.image_url = image.url
}
</script>

<template>
  <NexusPageWrapper show-toolbar title="Book detail">
    <template #toolbar>
      <Button
        label="Back"
        icon="pi pi-arrow-left"
        text
        @click="router.push({ name: 'library' })"
      />
    </template>

    <NexusSkeletonMedia v-if="library.bookLoading" />
    <div v-else-if="library.book" class="detail">
      <header class="hero">
        <div class="hero-media">
          <NexusImage
            :media="library.book.media"
            :src="library.book.image_url"
            :alt="library.book.title"
            variant="hero"
            size="fill"
            fit="cover"
            previewable
          />
        </div>

        <div class="hero-body">
          <div class="hero-info">
            <p class="eyebrow">{{ statusLabel }}</p>
            <h2>{{ library.book.title }}</h2>
            <p class="meta">{{ library.book.authors || 'Unknown author' }}</p>
            <p v-if="library.book.isbn" class="meta">ISBN {{ library.book.isbn }}</p>
            <p v-if="library.book.match_status" class="match">
              Match: {{ library.book.match_status.replaceAll('_', ' ') }}
            </p>
            <NexusRatingDisplay
              :model-value="library.book.rating"
              accent="var(--library-accent, #7a8fbf)"
            />
          </div>

          <div class="hero-actions" role="toolbar" aria-label="Book actions">
            <Button
              v-if="library.book.match_status !== 'matched'"
              icon="pi pi-search"
              severity="secondary"
              text
              rounded
              aria-label="Find match"
              v-tooltip.left="'Find match'"
              @click="openMatch"
            />
            <Button
              icon="pi pi-pencil"
              severity="secondary"
              text
              rounded
              aria-label="Edit book"
              v-tooltip.left="'Edit'"
              @click="editing = !editing"
            />
            <Button
              icon="pi pi-image"
              severity="secondary"
              text
              rounded
              aria-label="Change image"
              v-tooltip.left="'Change image'"
              @click="showImageUploader = true"
            />
            <Button
              icon="pi pi-trash"
              severity="danger"
              text
              rounded
              aria-label="Delete book"
              v-tooltip.left="'Delete'"
              @click="remove"
            />
          </div>
        </div>
      </header>

      <section v-if="editing" class="panel form">
        <h3>Edit</h3>
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
        <label>
          Status
          <Select
            v-model="form.status"
            :options="statusOptions"
            option-label="label"
            option-value="value"
            class="w-full"
          />
        </label>
        <label>
          Rating
          <NexusRatingInput v-model="form.rating" />
        </label>
        <label>
          Started
          <DatePicker v-model="form.started_at" date-format="yy-mm-dd" show-icon class="w-full" />
        </label>
        <label>
          Finished
          <DatePicker v-model="form.finished_at" date-format="yy-mm-dd" show-icon class="w-full" />
        </label>
        <label>
          Notes
          <Textarea v-model="form.notes" rows="4" class="w-full" auto-resize />
        </label>
        <div class="form-actions">
          <Button label="Cancel" severity="secondary" text @click="editing = false; syncForm()" />
          <Button label="Save" :loading="library.saving" @click="save" />
        </div>
      </section>

      <section v-if="library.book.notes && !editing" class="panel">
        <h3>Notes</h3>
        <p>{{ library.book.notes }}</p>
      </section>

      <section v-if="library.book.catalog" class="panel">
        <h3>Catalog</h3>
        <p class="meta">
          {{ library.book.catalog.publish_year || 'Year unknown' }}
          <span v-if="library.book.catalog.page_count">
            · {{ library.book.catalog.page_count }} pages
          </span>
        </p>
        <p v-if="library.book.catalog.description" class="description">
          {{ library.book.catalog.description }}
        </p>
      </section>
    </div>

    <NexusLibraryMatchDialog
      v-model:visible="showMatch"
      :loading="library.candidatesLoading"
      :result="library.candidates"
      @search="onSearch"
      @select="onSelect"
      @no-match="onNoMatch"
    />

    <NexusImageUploader
      v-if="library.book"
      v-model:visible="showImageUploader"
      :model-value="library.book.media ?? null"
      collection="library"
      :attach-to="{ type: 'library_book', id: library.book.id }"
      header="Book cover"
      @update:model-value="onImageUploaded"
    />
  </NexusPageWrapper>
</template>

<style scoped>
.detail {
  display: flex;
  flex-direction: column;
  gap: 1.1rem;
}

.hero {
  display: grid;
  grid-template-columns: minmax(12rem, 16rem) minmax(0, 1fr);
  gap: 1.35rem;
  padding: 1.15rem;
  border-radius: 1.1rem;
  background: var(--library-card-surface);
  align-items: stretch;
}

.hero-media {
  min-height: 18rem;
  border-radius: 0.85rem;
  overflow: hidden;
  background: color-mix(in srgb, var(--library-accent) 18%, transparent);
}

.hero-media :deep(.nexus-image) {
  width: 100%;
  height: 100%;
  min-height: 18rem;
}

.hero-body {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 0.75rem;
  align-items: start;
  min-width: 0;
}

.hero-info {
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
  padding-top: 0.15rem;
  min-width: 0;
}

.eyebrow {
  margin: 0;
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  opacity: 0.65;
}

h2 {
  margin: 0;
  font-size: clamp(1.55rem, 2.6vw, 2rem);
  line-height: 1.15;
  font-weight: 700;
}

.meta,
.match {
  margin: 0;
  opacity: 0.75;
  font-size: 0.92rem;
}

.match {
  text-transform: capitalize;
}

.hero-actions {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
}

.panel {
  padding: 1rem 1.1rem;
  border-radius: 1rem;
  background: var(--library-card-surface);
}

.panel h3 {
  margin: 0 0 0.55rem;
  font-size: 1rem;
}

.panel p {
  margin: 0;
  line-height: 1.5;
}

.description {
  margin-top: 0.65rem !important;
  opacity: 0.85;
  white-space: pre-wrap;
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

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
}

@media (max-width: 720px) {
  .hero {
    grid-template-columns: 1fr;
  }
}
</style>
