<script setup lang="ts">
import {
  computed,
  onMounted,
  onUnmounted,
  ref,
  watch,
} from 'vue'
import type { F1ReplayPayload } from '@/types/f1/f1'

const props = defineProps<{
  payload: F1ReplayPayload | null
  loading?: boolean
}>()

const playing = ref(false)
const scrub = ref(0)
const focusDriver = ref<number | null>(null)
const canvasRef = ref<HTMLCanvasElement | null>(null)
let raf = 0
let lastTs = 0

const times = computed(() => {
  const set = new Set<number>()
  for (const row of props.payload?.location ?? []) {
    if (!row.date) continue
    set.add(Date.parse(row.date))
  }
  return [...set].sort((a, b) => a - b)
})

const maxIndex = computed(() => Math.max(0, times.value.length - 1))

const driverColour = computed(() => {
  const map = new Map<number, string>()
  for (const d of props.payload?.drivers ?? []) {
    const c = d.team_colour
      ? d.team_colour.startsWith('#')
        ? d.team_colour
        : `#${d.team_colour}`
      : '#e8e8e8'
    map.set(d.driver_number, c)
  }
  return map
})

function draw(): void {
  const canvas = canvasRef.value
  const payload = props.payload
  if (!canvas || !payload?.bounds || times.value.length === 0) return

  const ctx = canvas.getContext('2d')
  if (!ctx) return

  const dpr = window.devicePixelRatio || 1
  const w = canvas.clientWidth
  const h = canvas.clientHeight
  canvas.width = Math.floor(w * dpr)
  canvas.height = Math.floor(h * dpr)
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

  ctx.clearRect(0, 0, w, h)
  ctx.fillStyle = '#121418'
  ctx.fillRect(0, 0, w, h)

  const { min_x, max_x, min_y, max_y } = payload.bounds
  const pad = 24
  const sx = (w - pad * 2) / Math.max(1, max_x - min_x)
  const sy = (h - pad * 2) / Math.max(1, max_y - min_y)
  const scale = Math.min(sx, sy)

  const project = (x: number, y: number) => ({
    x: pad + (x - min_x) * scale,
    y: h - pad - (y - min_y) * scale,
  })

  // Track path from first driver with samples
  const firstDriver = payload.drivers[0]?.driver_number
  if (firstDriver != null) {
    const trail = payload.location.filter((r) => r.driver_number === firstDriver)
    ctx.beginPath()
    ctx.strokeStyle = 'rgba(255,255,255,0.18)'
    ctx.lineWidth = 2
    trail.forEach((p, i) => {
      const pt = project(p.x, p.y)
      if (i === 0) ctx.moveTo(pt.x, pt.y)
      else ctx.lineTo(pt.x, pt.y)
    })
    ctx.stroke()
  }

  const t = times.value[scrub.value] ?? times.value[0]
  const byDriver = new Map<number, { x: number; y: number }>()
  for (const row of payload.location) {
    if (!row.date) continue
    const ms = Date.parse(row.date)
    if (ms > t) continue
    byDriver.set(row.driver_number, { x: row.x, y: row.y })
  }

  for (const [num, pos] of byDriver) {
    const pt = project(pos.x, pos.y)
    const colour = driverColour.value.get(num) ?? '#fff'
    const focus = focusDriver.value === num
    ctx.beginPath()
    ctx.fillStyle = colour
    ctx.arc(pt.x, pt.y, focus ? 6 : 4, 0, Math.PI * 2)
    ctx.fill()
    if (focus) {
      ctx.strokeStyle = '#fff'
      ctx.lineWidth = 1.5
      ctx.stroke()
    }
  }
}

function tick(ts: number): void {
  if (!playing.value) return
  if (!lastTs) lastTs = ts
  if (ts - lastTs > 40) {
    lastTs = ts
    if (scrub.value >= maxIndex.value) {
      playing.value = false
      return
    }
    scrub.value += 1
  }
  raf = requestAnimationFrame(tick)
}

function togglePlay(): void {
  playing.value = !playing.value
  if (playing.value) {
    if (scrub.value >= maxIndex.value) scrub.value = 0
    lastTs = 0
    raf = requestAnimationFrame(tick)
  }
}

watch(
  () => [props.payload, scrub.value, focusDriver.value],
  () => draw(),
  { deep: true },
)

onMounted(() => {
  draw()
  window.addEventListener('resize', draw)
})

onUnmounted(() => {
  cancelAnimationFrame(raf)
  window.removeEventListener('resize', draw)
})
</script>

<template>
  <div class="track-replay">
    <div v-if="loading" class="state">Preparing replay…</div>
    <div
      v-else-if="!payload || payload.status !== 'ready'"
      class="state"
    >
      {{ payload?.message || 'Replay not ready yet.' }}
    </div>
    <template v-else>
      <canvas ref="canvasRef" class="map" />
      <div class="controls">
        <Button
          :icon="playing ? 'pi pi-pause' : 'pi pi-play'"
          rounded
          text
          @click="togglePlay"
        />
        <input
          v-model.number="scrub"
          class="scrub"
          type="range"
          min="0"
          :max="maxIndex"
          step="1"
        />
        <Select
          v-model="focusDriver"
          :options="payload.drivers"
          option-label="name_acronym"
          option-value="driver_number"
          placeholder="Focus driver"
          show-clear
          class="driver-select"
        />
      </div>
      <p class="hint">
        Downsampled track map (≈{{ payload.hz ?? 1 }} Hz). Historical only —
        not live timing.
      </p>
    </template>
  </div>
</template>

<style scoped>
.track-replay {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.map {
  width: 100%;
  height: min(52vh, 420px);
  border-radius: 0.75rem;
  border: 1px solid color-mix(in srgb, var(--sport-f1) 30%, transparent);
  background: #121418;
}

.controls {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.scrub {
  flex: 1;
}

.driver-select {
  min-width: 9rem;
}

.state,
.hint {
  margin: 0;
  color: var(--p-text-muted-color);
  font-size: 0.85rem;
}
</style>
