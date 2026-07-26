<script setup lang="ts">
import { computed, ref } from 'vue'
import { RouterLink } from 'vue-router'
import NexusImage from '@components/nexus-image/NexusImage.vue'
import NexusImageViewer from '@components/nexus-image-viewer/NexusImageViewer.vue'
import NexusRatingDisplay from '@components/nexus-rating-display/NexusRatingDisplay.vue'
import type { LibraryBook } from '@/types/library/library'

const props = defineProps<{ book: LibraryBook }>()

const previewOpen = ref(false)

const canPreview = computed(() => Boolean(props.book.media || props.book.image_url))

const statusLabel = computed(() => {
  switch (props.book.status) {
    case 'want':
      return 'Want to read'
    case 'reading':
      return 'Reading'
    case 'read':
      return 'Read'
    default:
      return props.book.status
  }
})

function openPreview(event: Event): void {
  event.preventDefault()
  event.stopPropagation()
  if (!canPreview.value) return
  previewOpen.value = true
}
</script>

<template>
  <RouterLink
    :to="{ name: 'library-book', params: { bookId: book.id } }"
    class="book-card"
  >
    <div class="cover">
      <NexusImage
        :media="book.media"
        :src="book.image_url"
        :alt="book.title"
        variant="card"
        size="fill"
        fit="cover"
      />
      <button
        v-if="canPreview"
        type="button"
        class="expand"
        aria-label="View cover larger"
        @click="openPreview"
      >
        <i class="pi pi-search-plus" />
      </button>
      <div class="scrim">
        <h3>{{ book.title }}</h3>
        <p class="meta">{{ book.authors || 'Unknown author' }}</p>
      </div>
    </div>
    <div class="body">
      <p class="status">{{ statusLabel }}</p>
      <NexusRatingDisplay
        :model-value="book.rating"
        accent="var(--library-accent, #7a8fbf)"
      />
    </div>
  </RouterLink>

  <NexusImageViewer
    v-model:visible="previewOpen"
    :media="book.media"
    :src="book.image_url"
    :alt="book.title"
    variant="hero"
  />
</template>

<style scoped>
.book-card {
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border-radius: 0.9rem;
  background: var(--library-card-surface);
  text-decoration: none;
  color: inherit;
  transition:
    transform 0.22s ease,
    box-shadow 0.22s ease;
}

.book-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 12px 28px color-mix(in srgb, #000 35%, transparent);
}

.cover {
  position: relative;
  aspect-ratio: 2 / 3;
  overflow: hidden;
  background: color-mix(in srgb, var(--library-accent) 18%, transparent);
}

.cover :deep(.nexus-image) {
  width: 100%;
  height: 100%;
}

.cover :deep(img) {
  transition: transform 0.35s ease;
}

.book-card:hover .cover :deep(img) {
  transform: scale(1.04);
}

.scrim {
  position: absolute;
  inset: auto 0 0;
  padding: 1.4rem 0.85rem 0.75rem;
  background: linear-gradient(
    transparent,
    color-mix(in srgb, #0c1018 92%, transparent)
  );
}

h3 {
  margin: 0;
  font-size: 1.05rem;
  font-weight: 650;
  line-height: 1.25;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.meta {
  margin: 0.2rem 0 0;
  font-size: 0.8rem;
  opacity: 0.78;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.expand {
  position: absolute;
  top: 0.55rem;
  right: 0.55rem;
  z-index: 2;
  width: 2rem;
  height: 2rem;
  border: 0;
  border-radius: 999px;
  display: grid;
  place-items: center;
  cursor: pointer;
  color: #fff;
  background: color-mix(in srgb, #000 45%, transparent);
  backdrop-filter: blur(6px);
  opacity: 0;
  transition: opacity 0.2s ease;
}

.book-card:hover .expand,
.expand:focus-visible {
  opacity: 1;
}

.body {
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
  padding: 0.75rem 0.85rem 0.9rem;
}

.status {
  margin: 0;
  font-size: 0.78rem;
  opacity: 0.65;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
