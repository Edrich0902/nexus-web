<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { mediaDeliveryUrl } from '@lib/media'
import type { MediaImage, MediaVariant } from '@/types/media/media'

const props = withDefaults(
  defineProps<{
    visible?: boolean
    src?: string | null
    media?: MediaImage | null
    variant?: MediaVariant | null
    alt?: string
  }>(),
  {
    visible: false,
    src: null,
    media: null,
    variant: 'hero',
    alt: '',
  },
)

const emit = defineEmits<{
  'update:visible': [value: boolean]
}>()

const MIN_ZOOM = 1
const MAX_ZOOM = 4
const ZOOM_STEP = 0.25

const zoom = ref(1)
const offsetX = ref(0)
const offsetY = ref(0)
const dragging = ref(false)
const dragStartX = ref(0)
const dragStartY = ref(0)
const originX = ref(0)
const originY = ref(0)

const resolvedSrc = computed(() => {
  const fromMedia = mediaDeliveryUrl(props.media, props.variant)
  if (fromMedia) return fromMedia
  return props.src || null
})

const imageStyle = computed(() => ({
  transform: `translate(${offsetX.value}px, ${offsetY.value}px) scale(${zoom.value})`,
  cursor: zoom.value > 1 ? (dragging.value ? 'grabbing' : 'grab') : 'default',
}))

function close(): void {
  emit('update:visible', false)
}

function resetView(): void {
  zoom.value = 1
  offsetX.value = 0
  offsetY.value = 0
}

function zoomBy(delta: number): void {
  const next = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, zoom.value + delta))
  zoom.value = Math.round(next * 100) / 100
  if (zoom.value <= 1) {
    offsetX.value = 0
    offsetY.value = 0
  }
}

function onKeydown(event: KeyboardEvent): void {
  if (!props.visible) return
  if (event.key === 'Escape') {
    event.preventDefault()
    close()
  } else if (event.key === '+' || event.key === '=') {
    event.preventDefault()
    zoomBy(ZOOM_STEP)
  } else if (event.key === '-') {
    event.preventDefault()
    zoomBy(-ZOOM_STEP)
  } else if (event.key === '0') {
    event.preventDefault()
    resetView()
  }
}

function onWheel(event: WheelEvent): void {
  event.preventDefault()
  zoomBy(event.deltaY < 0 ? ZOOM_STEP : -ZOOM_STEP)
}

function onPointerDown(event: PointerEvent): void {
  if (zoom.value <= 1) return
  dragging.value = true
  dragStartX.value = event.clientX
  dragStartY.value = event.clientY
  originX.value = offsetX.value
  originY.value = offsetY.value
  ;(event.currentTarget as HTMLElement).setPointerCapture(event.pointerId)
}

function onPointerMove(event: PointerEvent): void {
  if (!dragging.value) return
  offsetX.value = originX.value + (event.clientX - dragStartX.value)
  offsetY.value = originY.value + (event.clientY - dragStartY.value)
}

function onPointerUp(event: PointerEvent): void {
  if (!dragging.value) return
  dragging.value = false
  try {
    ;(event.currentTarget as HTMLElement).releasePointerCapture(event.pointerId)
  } catch {
    // already released
  }
}

function onBackdropClick(event: MouseEvent): void {
  if (event.target === event.currentTarget) close()
}

watch(
  () => props.visible,
  (open) => {
    if (open) {
      resetView()
      document.addEventListener('keydown', onKeydown)
      document.body.style.overflow = 'hidden'
    } else {
      document.removeEventListener('keydown', onKeydown)
      document.body.style.overflow = ''
    }
  },
)

onBeforeUnmount(() => {
  document.removeEventListener('keydown', onKeydown)
  document.body.style.overflow = ''
})
</script>

<template>
  <Teleport to="body">
    <div
      v-if="visible"
      class="viewer"
      role="dialog"
      aria-modal="true"
      :aria-label="alt || 'Image preview'"
      @click="onBackdropClick"
    >
      <div class="toolbar">
        <button type="button" class="tool" aria-label="Zoom out" @click="zoomBy(-ZOOM_STEP)">
          <i class="pi pi-minus" />
        </button>
        <button type="button" class="tool tool--reset" aria-label="Reset zoom" @click="resetView">
          {{ Math.round(zoom * 100) }}%
        </button>
        <button type="button" class="tool" aria-label="Zoom in" @click="zoomBy(ZOOM_STEP)">
          <i class="pi pi-plus" />
        </button>
        <button type="button" class="tool tool--close" aria-label="Close" @click="close">
          <i class="pi pi-times" />
        </button>
      </div>

      <div
        class="stage"
        @wheel.prevent="onWheel"
        @pointerdown="onPointerDown"
        @pointermove="onPointerMove"
        @pointerup="onPointerUp"
        @pointercancel="onPointerUp"
      >
        <img
          v-if="resolvedSrc"
          :src="resolvedSrc"
          :alt="alt"
          :style="imageStyle"
          draggable="false"
        />
        <p v-else class="empty">No image to preview.</p>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.viewer {
  position: fixed;
  inset: 0;
  z-index: 1200;
  display: flex;
  flex-direction: column;
  background: color-mix(in srgb, #050505 88%, transparent);
  backdrop-filter: blur(10px);
  animation: viewer-in 0.2s ease;
}

@keyframes viewer-in {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.toolbar {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 0.4rem;
  padding: 0.75rem 1rem;
}

.tool {
  display: inline-grid;
  place-items: center;
  min-width: 2.4rem;
  width: 2.4rem;
  height: 2.4rem;
  padding: 0;
  border: 0;
  border-radius: 999px;
  color: #f6e8ea;
  background: color-mix(in srgb, #fff 12%, transparent);
  cursor: pointer;
  font-size: 0.85rem;
  line-height: 1;
}

.tool :deep(.pi),
.tool i {
  display: block;
  line-height: 1;
  font-size: 0.95rem;
}

.tool--reset {
  width: auto;
  min-width: 3.25rem;
  padding: 0 0.75rem;
}

.tool:hover {
  background: color-mix(in srgb, #fff 20%, transparent);
}

.tool--close {
  margin-left: 0.35rem;
}

.stage {
  flex: 1;
  display: grid;
  place-items: center;
  overflow: hidden;
  touch-action: none;
  padding: 0.5rem 1rem 1.25rem;
}

.stage img {
  max-width: min(96vw, 1100px);
  max-height: calc(100vh - 5.5rem);
  object-fit: contain;
  user-select: none;
  transform-origin: center center;
  transition: transform 0.05s linear;
}

.empty {
  margin: 0;
  opacity: 0.7;
  color: #f6e8ea;
}
</style>
