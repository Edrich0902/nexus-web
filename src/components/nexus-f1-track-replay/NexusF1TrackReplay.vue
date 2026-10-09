<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import NxIconButton from '@design/components/NxIconButton.vue'
import type { F1ReplayPayload } from '@/types/f1/f1'

const props = defineProps<{
  payload: F1ReplayPayload | null
  loading?: boolean
}>()

/** Highlighted car; also drives which driver's telemetry the page loads. */
const focus = defineModel<number | undefined>('focus')

type Sample = { t: number; x: number; y: number }

const playing = ref(false)
const scrub = ref(0)
const canvasRef = ref<HTMLCanvasElement | null>(null)
const frameRef = ref<HTMLDivElement | null>(null)
let raf = 0
let lastTs = 0
let resizeObserver: ResizeObserver | null = null

/** Samples per driver, sorted by time, so each frame is a binary search per car. */
const tracks = computed(() => {
  const map = new Map<number, Sample[]>()
  for (const row of props.payload?.location ?? []) {
    if (!row.date) continue
    const t = Date.parse(row.date)
    if (Number.isNaN(t)) continue
    const list = map.get(row.driver_number) ?? []
    list.push({ t, x: row.x, y: row.y })
    map.set(row.driver_number, list)
  }
  for (const list of map.values()) list.sort((a, b) => a.t - b.t)
  return map
})

const times = computed(() => {
  const set = new Set<number>()
  for (const list of tracks.value.values()) for (const s of list) set.add(s.t)
  return [...set].sort((a, b) => a - b)
})

const maxIndex = computed(() => Math.max(0, times.value.length - 1))

const drivers = computed(() =>
  (props.payload?.drivers ?? [])
    .filter((d) => tracks.value.has(d.driver_number))
    .map((d) => ({
      number: d.driver_number,
      code: d.name_acronym ?? `#${d.driver_number}`,
      colour: d.team_colour ? `#${d.team_colour.replace(/^#/, '')}` : '#e8e8e8',
    })),
)

const colourOf = computed(() => new Map(drivers.value.map((d) => [d.number, d.colour])))

const clock = computed(() => {
  const t = times.value[scrub.value]
  if (t === undefined) return '—'
  return new Date(t).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', second: '2-digit' })
})

function positionAt(list: Sample[], t: number): Sample | null {
  let lo = 0
  let hi = list.length - 1
  let found = -1
  while (lo <= hi) {
    const mid = (lo + hi) >> 1
    if ((list[mid]?.t ?? Infinity) <= t) {
      found = mid
      lo = mid + 1
    } else {
      hi = mid - 1
    }
  }
  return found >= 0 ? (list[found] ?? null) : null
}

function draw(): void {
  const canvas = canvasRef.value
  const bounds = props.payload?.bounds
  if (!canvas || !bounds || times.value.length === 0) return
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  const dpr = window.devicePixelRatio || 1
  const w = canvas.clientWidth
  const h = canvas.clientHeight
  if (canvas.width !== Math.floor(w * dpr) || canvas.height !== Math.floor(h * dpr)) {
    canvas.width = Math.floor(w * dpr)
    canvas.height = Math.floor(h * dpr)
  }
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  ctx.clearRect(0, 0, w, h)

  const ink = getComputedStyle(canvas).color
  const pad = 28
  const scale = Math.min(
    (w - pad * 2) / Math.max(1, bounds.max_x - bounds.min_x),
    (h - pad * 2) / Math.max(1, bounds.max_y - bounds.min_y),
  )
  const offX = (w - (bounds.max_x - bounds.min_x) * scale) / 2
  const offY = (h - (bounds.max_y - bounds.min_y) * scale) / 2
  const project = (x: number, y: number) => ({
    x: offX + (x - bounds.min_x) * scale,
    y: h - offY - (y - bounds.min_y) * scale,
  })

  const outline = [...tracks.value.values()].sort((a, b) => b.length - a.length)[0] ?? []
  ctx.save()
  ctx.globalAlpha = 0.22
  ctx.strokeStyle = ink
  ctx.lineWidth = 3
  ctx.lineJoin = 'round'
  ctx.beginPath()
  outline.forEach((p, i) => {
    const pt = project(p.x, p.y)
    if (i === 0) ctx.moveTo(pt.x, pt.y)
    else ctx.lineTo(pt.x, pt.y)
  })
  ctx.stroke()
  ctx.restore()

  const t = times.value[scrub.value] ?? times.value[0] ?? 0
  ctx.font = '600 11px "JetBrains Mono", ui-monospace, monospace'
  const focused: Array<() => void> = []
  for (const [num, list] of tracks.value) {
    const pos = positionAt(list, t)
    if (!pos) continue
    const pt = project(pos.x, pos.y)
    const isFocus = focus.value === num
    const paint = () => {
      ctx.beginPath()
      ctx.fillStyle = colourOf.value.get(num) ?? ink
      ctx.globalAlpha = focus.value === undefined || isFocus ? 1 : 0.45
      ctx.arc(pt.x, pt.y, isFocus ? 7 : 5, 0, Math.PI * 2)
      ctx.fill()
      ctx.globalAlpha = 1
      if (isFocus) {
        ctx.strokeStyle = ink
        ctx.lineWidth = 2
        ctx.stroke()
        ctx.fillStyle = ink
        ctx.fillText(drivers.value.find((d) => d.number === num)?.code ?? '', pt.x + 11, pt.y + 4)
      }
    }
    if (isFocus) focused.push(paint)
    else paint()
  }
  focused.forEach((paint) => paint())
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
  } else {
    cancelAnimationFrame(raf)
  }
}

function toggleFocus(num: number): void {
  focus.value = focus.value === num ? undefined : num
}

watch([tracks, scrub, focus], () => draw(), { flush: 'post' })
watch(
  canvasRef,
  (el) => {
    resizeObserver?.disconnect()
    if (el && frameRef.value) {
      resizeObserver = new ResizeObserver(() => draw())
      resizeObserver.observe(frameRef.value)
      draw()
    }
  },
  { flush: 'post' },
)

onMounted(draw)

onUnmounted(() => {
  cancelAnimationFrame(raf)
  resizeObserver?.disconnect()
})
</script>

<template>
  <div class="track-replay">
    <div v-if="loading" class="state">Preparing the replay…</div>
    <div v-else-if="!payload || payload.status !== 'ready' || !times.length" class="state">
      {{ payload?.message || 'The replay is not ready yet.' }}
    </div>
    <template v-else>
      <div ref="frameRef" class="frame">
        <canvas ref="canvasRef" class="map" role="img" aria-label="Track map with car positions" />
        <span class="clock">{{ clock }}</span>
      </div>
      <div class="controls">
        <NxIconButton
          :icon="playing ? 'pause' : 'play'"
          :label="playing ? 'Pause' : 'Play'"
          variant="ink"
          @click="togglePlay"
        />
        <input
          v-model.number="scrub"
          class="scrub"
          type="range"
          min="0"
          :max="maxIndex"
          step="1"
          aria-label="Replay position"
        />
      </div>
      <div class="cars" role="group" aria-label="Focus a car">
        <button
          v-for="d in drivers"
          :key="d.number"
          type="button"
          class="car"
          :class="{ on: focus === d.number }"
          :aria-pressed="focus === d.number"
          @click="toggleFocus(d.number)"
        >
          <i :style="{ background: d.colour }" />{{ d.code }}
        </button>
      </div>
    </template>
  </div>
</template>

<style scoped>
.track-replay {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.frame {
  position: relative;
  border-radius: var(--r-xl);
  background: var(--surface);
  overflow: hidden;
}

.map {
  display: block;
  width: 100%;
  height: min(56vh, 480px);
  color: var(--ink);
}

.clock {
  position: absolute;
  top: 14px;
  right: 16px;
  font-family: var(--font-mono);
  font-size: 12px;
  color: var(--ink-3);
}

.controls {
  display: flex;
  align-items: center;
  gap: 14px;
}

.scrub {
  flex: 1;
  accent-color: var(--acc);
}

.cars {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.car {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 5px 11px;
  border: 0;
  border-radius: 999px;
  background: var(--tint);
  color: var(--ink-2);
  font-family: var(--font-mono);
  font-size: 12px;
  cursor: pointer;
}

.car:hover {
  color: var(--ink);
}

.car.on {
  background: var(--ink);
  color: var(--amb);
}

.car i {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.state {
  padding: 48px 20px;
  border-radius: var(--r-xl);
  background: var(--surface);
  color: var(--ink-3);
  text-align: center;
  font-size: 14px;
}

@media (max-width: 640px) {
  .map {
    height: 300px;
  }
}
</style>
