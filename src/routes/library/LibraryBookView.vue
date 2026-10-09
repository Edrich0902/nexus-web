<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useConfirm } from 'primevue/useconfirm'
import DetailTemplate from '@design/templates/DetailTemplate.vue'
import type { ViewState } from '@design/templates/types'
import NxStage from '@design/components/NxStage.vue'
import NxPanel from '@design/components/NxPanel.vue'
import NxFacts from '@design/components/NxFacts.vue'
import NxRating from '@design/components/NxRating.vue'
import NxIcon from '@design/components/NxIcon.vue'
import NxIconButton from '@design/components/NxIconButton.vue'
import { usePaletteAmbient } from '@design/usePaletteAmbient'
import NexusImage from '@components/nexus-image/NexusImage.vue'
import NexusImageUploader from '@components/nexus-image-uploader/NexusImageUploader.vue'
import NexusRatingInput from '@components/nexus-rating-input/NexusRatingInput.vue'
import { mediaDeliveryUrl } from '@lib/media'
import { useLibraryStore } from '@stores/library/library.store'
import type { LibraryBookStatus, LibrarySearchResult } from '@/types/library/library'
import type { MediaImage } from '@/types/media/media'
import LibraryMatchDialog from './LibraryMatchDialog.vue'
import { STATUS_LABEL, STATUS_OPTIONS, bookAuthors, isoDay, readableDate, splitBookTitle } from './library'

const library = useLibraryStore()
const route = useRoute()
const router = useRouter()
const confirm = useConfirm()

const bookId = computed(() => Number(route.params.bookId))
const showUploader = ref(false)
const showMatch = ref(false)
const showEdit = ref(false)

watch(
  bookId,
  (id) => {
    if (Number.isFinite(id)) void library.loadBook(id)
  },
  { immediate: true },
)

const book = computed(() => (library.book?.id === bookId.value ? library.book : null))

const state = computed<ViewState>(() => {
  if (!book.value) return library.bookLoading ? 'loading' : 'error'
  return 'ready'
})

usePaletteAmbient(() => mediaDeliveryUrl(book.value?.media, 'thumb') ?? book.value?.image_url ?? null)

const heading = computed(() => splitBookTitle(book.value?.title ?? ''))
const hasArt = computed(() => Boolean(book.value?.media || book.value?.image_url))

const eyebrow = computed(() => {
  const b = book.value
  if (!b) return ''
  if (b.status === 'reading') {
    const since = readableDate(b.started_at)
    return since ? `Reading since ${since}` : 'Reading'
  }
  if (b.status === 'read') {
    const done = readableDate(b.finished_at)
    return done ? `Finished ${done}` : 'Read'
  }
  return STATUS_LABEL[b.status]
})

const lede = computed(() => {
  const b = book.value
  if (!b) return ''
  const c = b.catalog
  return [bookAuthors(b), c?.publish_year, c?.page_count ? `${c.page_count} pages` : null].filter(Boolean).join(' · ')
})

const facts = computed(() => {
  const b = book.value
  if (!b) return []
  return [
    { label: 'Status', value: STATUS_LABEL[b.status] },
    { label: 'Published', value: b.catalog?.publish_year },
    { label: 'Pages', value: b.catalog?.page_count },
    { label: 'ISBN', value: b.isbn || b.catalog?.isbn_13 || b.catalog?.isbn_10 },
    { label: 'Started', value: readableDate(b.started_at) },
    { label: 'Finished', value: readableDate(b.finished_at) },
  ]
})

const MATCH_LABEL = { matched: 'Matched to Open Library', no_match: 'Not in Open Library', unmatched: 'Not matched yet' }

/** The one next step for this book, shown as the primary action. */
const nextStep = computed<{ label: string; status: LibraryBookStatus; date: 'started_at' | 'finished_at' } | null>(() => {
  if (book.value?.status === 'want') return { label: 'Start reading', status: 'reading', date: 'started_at' }
  if (book.value?.status === 'reading') return { label: 'Finished it', status: 'read', date: 'finished_at' }
  return null
})

async function advance(): Promise<void> {
  const b = book.value
  const step = nextStep.value
  if (!b || !step) return
  await library.updateBook(b.id, { title: b.title, status: step.status, [step.date]: isoDay() })
}

/* ── Edit ───────────────────────────────────────────────── */

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

function openEdit(): void {
  const b = book.value
  if (!b) return
  Object.assign(form, {
    title: b.title,
    authors: b.authors ?? '',
    isbn: b.isbn ?? '',
    status: b.status,
    rating: b.rating,
    notes: b.notes ?? '',
    started_at: b.started_at ? new Date(b.started_at) : null,
    finished_at: b.finished_at ? new Date(b.finished_at) : null,
  })
  showEdit.value = true
}

async function save(): Promise<void> {
  if (!form.title.trim()) return
  await library.updateBook(bookId.value, {
    title: form.title.trim(),
    authors: form.authors.trim() || null,
    isbn: form.isbn.trim() || null,
    status: form.status,
    rating: form.rating,
    notes: form.notes || null,
    started_at: isoDay(form.started_at),
    finished_at: isoDay(form.finished_at),
  })
  showEdit.value = false
}

function askRemove(event: MouseEvent): void {
  confirm.require({
    target: event.currentTarget as HTMLElement,
    message: 'Remove this book from your library?',
    acceptLabel: 'Remove',
    rejectLabel: 'Keep',
    acceptProps: { severity: 'danger', size: 'small' },
    rejectProps: { severity: 'secondary', text: true, size: 'small' },
    accept: async () => {
      if (await library.removeBook(bookId.value)) await router.push({ name: 'library' })
    },
  })
}

/* ── Open Library match ─────────────────────────────────── */

function openMatch(): void {
  showMatch.value = true
  void library.fetchCandidates(bookId.value)
}

async function onSelect(candidate: LibrarySearchResult): Promise<void> {
  await library.confirmMatch(bookId.value, candidate.ol_work_key)
  showMatch.value = false
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
  <DetailTemplate
    :state="state"
    :back-to="{ name: 'library' }"
    back-label="Library"
    error-title="This book could not be loaded"
  >
    <template #stage>
      <NxStage art="portrait" :eyebrow="eyebrow" :title="heading.title" :accent="heading.accent" :lede="lede">
        <template #visual>
          <NexusImage
            v-if="hasArt"
            :media="book?.media"
            :src="book?.image_url"
            :alt="book?.title ?? ''"
            variant="hero"
            size="fill"
            fit="cover"
            previewable
          />
          <button v-else type="button" class="add-art" @click="showUploader = true">
            <NxIcon name="image" :size="26" />
            <span>Add a cover</span>
          </button>
        </template>
        <template #actions>
          <Button
            v-if="nextStep"
            rounded
            severity="contrast"
            :label="nextStep.label"
            :loading="library.saving"
            @click="advance"
          />
          <Button rounded severity="secondary" label="Edit" @click="openEdit">
            <template #icon="{ class: iconClass }">
              <NxIcon name="edit" :size="16" :class="iconClass" />
            </template>
          </Button>
          <NxIconButton
            v-if="book?.match_status !== 'matched'"
            icon="search"
            label="Match in Open Library"
            variant="tint"
            @click="openMatch"
          />
          <NxIconButton icon="image" :label="hasArt ? 'Change cover' : 'Add a cover'" variant="tint" @click="showUploader = true" />
          <NxIconButton icon="trash" label="Remove book" variant="tint" @click="askRemove" />
        </template>
      </NxStage>
    </template>

    <NxPanel v-if="book?.catalog?.description" title="About the book" variant="flush">
      <p class="prose">{{ book.catalog.description }}</p>
    </NxPanel>

    <NxPanel title="Your notes" variant="flush">
      <p v-if="book?.notes" class="prose">{{ book.notes }}</p>
      <button v-else type="button" class="add-note" @click="openEdit">Add a note about this book</button>
    </NxPanel>

    <template #aside>
      <NxPanel title="At a glance">
        <div class="glance">
          <NxRating :value="book?.rating" size="lg" />
          <NxFacts :items="facts" :cols="2" />
          <p class="match">{{ book ? MATCH_LABEL[book.match_status] : '' }}</p>
        </div>
      </NxPanel>
    </template>
  </DetailTemplate>

  <LibraryMatchDialog
    v-model:visible="showMatch"
    :loading="library.candidatesLoading"
    :result="library.candidates"
    @search="(q) => library.fetchCandidates(bookId, q.trim() || undefined)"
    @select="onSelect"
    @no-match="onNoMatch"
  />

  <NexusImageUploader
    v-if="book"
    v-model:visible="showUploader"
    :model-value="book.media ?? null"
    collection="library"
    :attach-to="{ type: 'library_book', id: book.id }"
    :header="`${book.title} · cover`"
    @update:model-value="onImageUploaded"
  />

  <Dialog v-model:visible="showEdit" modal header="Edit book" style="width: min(540px, 94vw)">
    <form id="edit-book" class="nx-form" @submit.prevent="save">
      <label class="f">
        <span>Title</span>
        <InputText v-model="form.title" />
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
      <div class="row">
        <label class="f">
          <span>Started</span>
          <DatePicker v-model="form.started_at" date-format="d M yy" show-button-bar />
        </label>
        <label class="f">
          <span>Finished</span>
          <DatePicker v-model="form.finished_at" date-format="d M yy" show-button-bar />
        </label>
      </div>
      <label class="f">
        <span>Notes</span>
        <Textarea v-model="form.notes" rows="4" auto-resize />
      </label>
    </form>
    <template #footer>
      <Button label="Cancel" text severity="secondary" @click="showEdit = false" />
      <Button
        type="submit"
        form="edit-book"
        rounded
        label="Save"
        :loading="library.saving"
        :disabled="!form.title.trim()"
      />
    </template>
  </Dialog>
</template>

<style scoped>
.add-art {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  border: 1px dashed var(--line-strong);
  border-radius: inherit;
  background: transparent;
  color: var(--ink-3);
  font: inherit;
  font-size: 13px;
  cursor: pointer;
}

.add-art:hover {
  color: var(--ink);
  border-color: var(--acc);
}

.add-art :deep(svg) {
  color: var(--acc);
}

.prose {
  margin: 0;
  font-size: 16px;
  line-height: 1.7;
  color: var(--ink-2);
  white-space: pre-line;
  max-width: 68ch;
}

.add-note {
  padding: 0;
  border: 0;
  background: none;
  color: var(--acc);
  font: inherit;
  font-size: 14px;
  cursor: pointer;
}

.glance {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.match {
  margin: 0;
  font-size: 13px;
  color: var(--ink-3);
}
</style>
