<script setup lang="ts">
import { computed } from 'vue'
import type { RouteLocationRaw } from 'vue-router'
import NexusImage from '@components/nexus-image/NexusImage.vue'
import NxIcon from './NxIcon.vue'
import type { IconName } from '../icons'
import type { MediaImage } from '@/types/media/media'

/**
 * A collection item: artwork on top, title and a quiet meta line beneath.
 * Used for bottles, recipes, books and albums alike.
 */
const props = withDefaults(
  defineProps<{
    title: string
    sub?: string | null
    meta?: string | null
    to?: RouteLocationRaw
    media?: MediaImage | null
    src?: string | null
    rating?: number | null
    /** Small label pinned to the artwork (status, format). */
    badge?: string | null
    favourite?: boolean
    /** `circle` is a square crop with round corners all the way (artists, people). */
    aspect?: 'portrait' | 'square' | 'landscape' | 'circle'
    /** Shown when there is no artwork. */
    icon?: IconName
  }>(),
  {
    sub: null,
    meta: null,
    to: undefined,
    media: null,
    src: null,
    rating: null,
    badge: null,
    favourite: false,
    aspect: 'portrait',
    icon: 'glass',
  },
)

defineEmits<{ click: [] }>()

const hasArt = computed(() => Boolean(props.media || props.src))
</script>

<template>
  <component
    :is="to ? 'RouterLink' : 'button'"
    :to="to"
    :type="to ? undefined : 'button'"
    class="nx-cover"
    @click="!to && $emit('click')"
  >
    <div class="art" :class="`a-${aspect}`">
      <NexusImage
        v-if="hasArt"
        :media="media"
        :src="src"
        :alt="''"
        variant="card"
        size="fill"
        fit="cover"
      />
      <div v-else class="fallback" aria-hidden="true">
        <NxIcon :name="icon" :size="28" />
      </div>
      <span v-if="badge" class="badge">{{ badge }}</span>
      <span v-if="favourite" class="fav" aria-label="Favourite">
        <NxIcon name="heart" :size="14" />
      </span>
    </div>
    <div class="copy">
      <div class="title">{{ title }}</div>
      <div v-if="sub || rating != null" class="sub">
        <span v-if="sub" class="sub-text">{{ sub }}</span>
        <span v-if="rating != null" class="rating num">
          <NxIcon name="star" :size="12" />{{ rating.toFixed(1) }}
        </span>
      </div>
      <div v-if="meta" class="meta">{{ meta }}</div>
    </div>
  </component>
</template>

<style scoped>
.nx-cover {
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-width: 0;
  padding: 0;
  border: 0;
  background: none;
  color: inherit;
  text-align: left;
  font: inherit;
  cursor: pointer;
}

.art {
  position: relative;
  overflow: hidden;
  border-radius: var(--r-lg);
  background: var(--surface-2);
  transition:
    transform 0.35s var(--ease),
    box-shadow 0.35s var(--ease);
}

.a-portrait {
  aspect-ratio: 4 / 5;
}

.a-square {
  aspect-ratio: 1;
}

.a-landscape {
  aspect-ratio: 4 / 3;
}

.a-circle {
  aspect-ratio: 1;
  border-radius: 50%;
}

.nx-cover:has(.a-circle) .copy {
  align-items: center;
  text-align: center;
}

.art :deep(.nexus-image) {
  background: transparent;
}

.art :deep(img) {
  transition: transform 0.5s var(--ease);
}

.nx-cover:hover .art {
  transform: translateY(-3px);
  box-shadow: 0 18px 40px -18px rgb(0 0 0 / 0.6);
}

.nx-cover:hover .art :deep(img) {
  transform: scale(1.04);
}

.fallback {
  width: 100%;
  height: 100%;
  display: grid;
  place-items: center;
  color: var(--acc);
  background: radial-gradient(circle at 30% 20%, var(--tint-2), transparent 70%);
}

.badge {
  position: absolute;
  left: 10px;
  top: 10px;
  padding: 4px 9px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 600;
  color: var(--ink);
  background: color-mix(in srgb, var(--amb) 72%, transparent);
  backdrop-filter: blur(8px);
}

.fav {
  position: absolute;
  right: 10px;
  top: 10px;
  width: 26px;
  height: 26px;
  display: grid;
  place-items: center;
  border-radius: 50%;
  color: var(--acc);
  background: color-mix(in srgb, var(--amb) 72%, transparent);
  backdrop-filter: blur(8px);
}

.fav :deep(svg) {
  fill: currentColor;
}

.copy {
  display: flex;
  flex-direction: column;
  gap: 3px;
  min-width: 0;
  padding: 0 2px;
}

.title {
  font-size: 15px;
  font-weight: 600;
  line-height: 1.3;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.sub {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  font-size: 13px;
  color: var(--ink-3);
  min-width: 0;
}

.sub-text {
  min-width: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.rating {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  flex-shrink: 0;
  color: var(--ink-2);
  font-weight: 600;
}

.rating :deep(svg) {
  color: var(--acc);
  fill: currentColor;
}

.meta {
  font-size: 12px;
  color: var(--ink-4);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
