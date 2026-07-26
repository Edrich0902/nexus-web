<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import NexusImageViewer from '@components/nexus-image-viewer/NexusImageViewer.vue'
import { mediaDeliveryUrl } from '@lib/media'
import type { MediaImage, MediaVariant } from '@/types/media/media'

const props = withDefaults(
  defineProps<{
    src?: string | null
    media?: MediaImage | null
    variant?: MediaVariant | null
    alt?: string
    size?: 'sm' | 'md' | 'lg' | 'fill'
    rounded?: boolean
    fit?: 'contain' | 'cover'
    /** Click opens a zoomable lightbox when an image is available. */
    previewable?: boolean
    /** Transform used inside the lightbox (defaults to hero for sharper preview). */
    previewVariant?: MediaVariant | null
  }>(),
  {
    src: null,
    media: null,
    variant: null,
    alt: '',
    size: 'md',
    rounded: false,
    fit: 'contain',
    previewable: false,
    previewVariant: 'hero',
  },
)

const broken = ref(false)
const previewOpen = ref(false)

const resolvedSrc = computed(() => {
  if (broken.value) return null
  const fromMedia = mediaDeliveryUrl(props.media, props.variant)
  if (fromMedia) return fromMedia
  return props.src || null
})

const canPreview = computed(
  () => props.previewable && Boolean(resolvedSrc.value),
)

watch(
  () => [props.src, props.media?.public_id, props.variant] as const,
  () => {
    broken.value = false
  },
)

function openPreview(event?: Event): void {
  if (!canPreview.value) return
  event?.preventDefault()
  event?.stopPropagation()
  previewOpen.value = true
}
</script>

<template>
  <div
    class="nexus-image"
    :class="[
      `nexus-image--${size}`,
      `nexus-image--fit-${fit}`,
      {
        'nexus-image--rounded': rounded,
        'nexus-image--previewable': canPreview,
      },
    ]"
    :role="canPreview ? 'button' : undefined"
    :tabindex="canPreview ? 0 : undefined"
    :aria-label="canPreview ? `Preview ${alt || 'image'}` : undefined"
    @click="openPreview"
    @keydown.enter.prevent="openPreview()"
    @keydown.space.prevent="openPreview()"
  >
    <img
      v-if="resolvedSrc"
      :src="resolvedSrc"
      :alt="alt"
      loading="lazy"
      @error="broken = true"
    />
    <div v-else class="nexus-image__fallback" aria-hidden="true" />
  </div>

  <NexusImageViewer
    v-if="previewable"
    v-model:visible="previewOpen"
    :media="media"
    :src="src"
    :variant="previewVariant ?? 'hero'"
    :alt="alt"
  />
</template>

<style scoped>
.nexus-image {
  overflow: hidden;
  background: color-mix(in srgb, var(--p-content-border-color) 40%, transparent);
  display: flex;
  align-items: center;
  justify-content: center;
}

.nexus-image--previewable {
  cursor: zoom-in;
}

.nexus-image--sm {
  width: 2.5rem;
  height: 2.5rem;
}

.nexus-image--md {
  width: 4rem;
  height: 3rem;
}

.nexus-image--lg {
  width: 5.5rem;
  height: 4rem;
}

.nexus-image--fill {
  width: 100%;
  height: 100%;
}

.nexus-image--rounded {
  border-radius: 0.5rem;
}

.nexus-image img {
  width: 100%;
  height: 100%;
  display: block;
}

.nexus-image--fit-contain img {
  object-fit: contain;
}

.nexus-image--fit-cover img {
  object-fit: cover;
}

.nexus-image__fallback {
  width: 100%;
  height: 100%;
  background: linear-gradient(
    135deg,
    color-mix(in srgb, var(--kitchen-accent, #6a9e6e) 28%, transparent),
    transparent
  );
}
</style>
