<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import NexusLibraryIcon from '@components/nexus-library-icon/NexusLibraryIcon.vue'
import NexusImage from '@components/nexus-image/NexusImage.vue'
import NexusRatingDisplay from '@components/nexus-rating-display/NexusRatingDisplay.vue'
import { useLibraryStore } from '@stores/library/library.store'
import type { LibraryBook } from '@/types/library/library'

const library = useLibraryStore()
const router = useRouter()

onMounted(() => {
  void library.loadPulse()
})

const mode = computed<'loading' | 'empty' | 'ready'>(() => {
  if (library.pulseLoading && !library.pulse) return 'loading'
  if (!library.pulse) return 'empty'
  if (library.pulse.counts.total === 0) return 'empty'
  return 'ready'
})

const counts = computed(() => library.pulse?.counts)
const currentlyReading = computed(() => library.pulse?.reading?.[0] ?? null)
const gallery = computed(() => library.pulse?.recent?.slice(0, 4) ?? [])

function openHub(): void {
  void router.push({ name: 'library' })
}

function openBook(book: LibraryBook): void {
  void router.push({ name: 'library-book', params: { bookId: book.id } })
}

function bookImage(book: LibraryBook): string | null | undefined {
  return book.image_url ?? book.catalog?.cover_url
}
</script>

<template>
  <article class="pulse-card" :class="`is-${mode}`">
    <header class="pulse-head">
      <div class="pulse-brand">
        <NexusLibraryIcon :size="22" />
        <div>
          <h3>Library</h3>
          <p class="subtitle">
            <Skeleton
              v-if="mode === 'loading'"
              width="7rem"
              height="0.75rem"
            />
            <template v-else-if="mode === 'empty'">
              Log books and track what you’re reading
            </template>
            <template v-else>
              {{ counts?.total ?? 0 }} on shelf
              <span v-if="counts?.reading">
                · {{ counts.reading }} reading
              </span>
            </template>
          </p>
        </div>
      </div>
      <Button
        label="Hub"
        icon="pi pi-arrow-right"
        size="small"
        severity="secondary"
        text
        @click.stop="openHub"
      />
    </header>

    <div v-if="mode === 'loading'" class="pulse-skel">
      <div class="metrics">
        <Skeleton v-for="n in 3" :key="n" height="2.5rem" border-radius="0.7rem" />
      </div>
      <Skeleton height="4.4rem" border-radius="0.75rem" />
    </div>

    <div v-else-if="mode === 'empty'" class="pulse-empty">
      <p>Add a title manually or match one from Open Library to start your shelf.</p>
      <Button label="Open library" size="small" @click.stop="openHub" />
    </div>

    <template v-else>
      <div class="metrics" role="navigation" aria-label="Library status">
        <button type="button" class="metric" @click.stop="openHub">
          <span class="metric-value">{{ counts?.want ?? 0 }}</span>
          <span class="metric-label">Want</span>
        </button>
        <button type="button" class="metric" @click.stop="openHub">
          <span class="metric-value">{{ counts?.reading ?? 0 }}</span>
          <span class="metric-label">Reading</span>
        </button>
        <button type="button" class="metric" @click.stop="openHub">
          <span class="metric-value">{{ counts?.read ?? 0 }}</span>
          <span class="metric-label">Read</span>
        </button>
      </div>

      <button
        v-if="currentlyReading"
        type="button"
        class="spotlight"
        @click.stop="openBook(currentlyReading)"
      >
        <div class="spotlight-media">
          <NexusImage
            :media="currentlyReading.media"
            :src="bookImage(currentlyReading)"
            :alt="currentlyReading.title"
            variant="thumb"
            size="fill"
            fit="cover"
          />
        </div>
        <div class="spotlight-body">
          <p class="eyebrow">Currently reading</p>
          <strong>{{ currentlyReading.title }}</strong>
          <p class="meta">{{ currentlyReading.authors || 'Unknown author' }}</p>
          <NexusRatingDisplay
            v-if="currentlyReading.rating != null"
            :model-value="currentlyReading.rating"
            accent="var(--library-accent)"
          />
        </div>
      </button>

      <div v-if="gallery.length" class="gallery">
        <button
          v-for="book in gallery"
          :key="book.id"
          type="button"
          class="gallery-item"
          :aria-label="book.title"
          @click.stop="openBook(book)"
        >
          <NexusImage
            :media="book.media"
            :src="bookImage(book)"
            :alt="book.title"
            variant="thumb"
            size="fill"
            fit="cover"
          />
        </button>
      </div>
    </template>
  </article>
</template>

<style scoped>
.pulse-card {
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
  padding: 1rem 1.1rem;
  border-radius: 1rem;
  background: var(--library-card-surface);
  border: 1px solid color-mix(in srgb, var(--library-accent) 18%, transparent);
}

.pulse-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.75rem;
}

.pulse-brand {
  display: flex;
  align-items: flex-start;
  gap: 0.65rem;
  min-width: 0;
  color: var(--library-accent);
}

.pulse-brand h3 {
  margin: 0;
  font-size: 1rem;
  font-weight: 700;
  color: inherit;
}

.subtitle {
  margin: 0.2rem 0 0;
  font-size: 0.8rem;
  opacity: 0.72;
  color: var(--p-text-color);
}

.pulse-skel,
.pulse-empty {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.pulse-empty p {
  margin: 0;
  font-size: 0.88rem;
  line-height: 1.45;
  opacity: 0.78;
}

.metrics {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.45rem;
}

.metric {
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
  padding: 0.55rem 0.6rem;
  border: 0;
  border-radius: 0.7rem;
  text-align: left;
  cursor: pointer;
  color: inherit;
  background: color-mix(in srgb, var(--library-accent) 12%, transparent);
  transition: background 0.18s ease;
}

.metric:hover {
  background: color-mix(in srgb, var(--library-accent) 22%, transparent);
}

.metric-value {
  font-size: 1.05rem;
  font-weight: 700;
  line-height: 1.1;
}

.metric-label {
  font-size: 0.68rem;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  opacity: 0.7;
}

.spotlight {
  width: 100%;
  display: grid;
  grid-template-columns: 3.6rem minmax(0, 1fr);
  gap: 0.75rem;
  align-items: center;
  padding: 0.55rem;
  border: 0;
  border-radius: 0.8rem;
  text-align: left;
  cursor: pointer;
  color: inherit;
  background: color-mix(in srgb, var(--library-accent) 10%, transparent);
  transition: background 0.18s ease;
}

.spotlight:hover {
  background: color-mix(in srgb, var(--library-accent) 18%, transparent);
}

.spotlight-media {
  width: 3.6rem;
  height: 4.6rem;
  border-radius: 0.55rem;
  overflow: hidden;
  background: color-mix(in srgb, var(--library-accent) 16%, transparent);
}

.spotlight-media :deep(.nexus-image) {
  width: 100%;
  height: 100%;
}

.spotlight-body {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
  min-width: 0;
}

.eyebrow {
  margin: 0;
  font-size: 0.65rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--library-accent);
}

.spotlight-body strong {
  font-size: 0.95rem;
  line-height: 1.25;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.meta {
  margin: 0;
  font-size: 0.8rem;
  opacity: 0.72;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.gallery {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 0.4rem;
}

.gallery-item {
  aspect-ratio: 2 / 3;
  border: 0;
  padding: 0;
  border-radius: 0.55rem;
  overflow: hidden;
  cursor: pointer;
  background: color-mix(in srgb, var(--library-accent) 14%, transparent);
}

.gallery-item :deep(.nexus-image) {
  width: 100%;
  height: 100%;
}
</style>
