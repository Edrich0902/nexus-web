<script setup lang="ts">
import { computed } from 'vue'

type Stint = {
  driver_number: number
  stint_number: number
  compound: string | null
  lap_start: number | null
  lap_end: number | null
  tyre_age_at_start: number | null
}

/** Tyre strategy chart: one lane per driver, stints as compound-coloured segments. */
const props = defineProps<{
  stints: Array<Record<string, unknown>>
  /** Driver numbers in finishing order; drivers missing here sort last. */
  order: number[]
  label: (driverNumber: number) => string
}>()

const COMPOUNDS: Record<string, { colour: string; short: string }> = {
  SOFT: { colour: '#ff3b30', short: 'S' },
  MEDIUM: { colour: '#ffd12e', short: 'M' },
  HARD: { colour: '#f0efe9', short: 'H' },
  INTERMEDIATE: { colour: '#43b047', short: 'I' },
  WET: { colour: '#2f7fe0', short: 'W' },
}

function compound(name: string | null) {
  return COMPOUNDS[(name ?? '').toUpperCase()] ?? { colour: 'var(--ink-3)', short: '?' }
}

const parsed = computed<Stint[]>(() =>
  props.stints.map((s) => ({
    driver_number: Number(s.driver_number),
    stint_number: Number(s.stint_number ?? 0),
    compound: typeof s.compound === 'string' ? s.compound : null,
    lap_start: s.lap_start == null ? null : Number(s.lap_start),
    lap_end: s.lap_end == null ? null : Number(s.lap_end),
    tyre_age_at_start: s.tyre_age_at_start == null ? null : Number(s.tyre_age_at_start),
  })),
)

const totalLaps = computed(() => Math.max(1, ...parsed.value.map((s) => s.lap_end ?? 0)))

const lanes = computed(() => {
  const byDriver = new Map<number, Stint[]>()
  for (const s of parsed.value) {
    const list = byDriver.get(s.driver_number) ?? []
    list.push(s)
    byDriver.set(s.driver_number, list)
  }
  const rank = (n: number) => {
    const i = props.order.indexOf(n)
    return i === -1 ? Number.MAX_SAFE_INTEGER : i
  }
  return [...byDriver.entries()]
    .sort(([a], [b]) => rank(a) - rank(b) || a - b)
    .map(([driver, stints]) => ({
      driver,
      stints: stints
        .filter((s) => s.lap_start !== null)
        .sort((a, b) => a.stint_number - b.stint_number)
        .map((s) => {
          const start = s.lap_start ?? 1
          const end = s.lap_end ?? start
          const c = compound(s.compound)
          return {
            key: s.stint_number,
            left: ((start - 1) / totalLaps.value) * 100,
            width: ((end - start + 1) / totalLaps.value) * 100,
            colour: c.colour,
            short: c.short,
            title: `${s.compound ?? 'Unknown'} · laps ${start}–${end}${s.tyre_age_at_start ? ` · ${s.tyre_age_at_start} laps old` : ''}`,
          }
        }),
    }))
})

const legend = computed(() => {
  const used = new Set(parsed.value.map((s) => (s.compound ?? '').toUpperCase()))
  return Object.entries(COMPOUNDS).filter(([name]) => used.has(name))
})
</script>

<template>
  <div class="stints">
    <div class="legend">
      <span v-for="[name, c] in legend" :key="name"><i :style="{ background: c.colour }" />{{ name.toLowerCase() }}</span>
      <span class="laps">{{ totalLaps }} laps</span>
    </div>
    <ol>
      <li v-for="lane in lanes" :key="lane.driver" class="lane">
        <span class="who">{{ label(lane.driver) }}</span>
        <span class="track">
          <span
            v-for="s in lane.stints"
            :key="s.key"
            class="seg"
            :style="{ left: `${s.left}%`, width: `${s.width}%`, background: s.colour }"
            :title="s.title"
          >
            <span v-if="s.width > 6" class="c">{{ s.short }}</span>
          </span>
        </span>
      </li>
    </ol>
  </div>
</template>

<style scoped>
.legend {
  display: flex;
  flex-wrap: wrap;
  gap: 6px 16px;
  font-size: 12px;
  color: var(--ink-2);
  text-transform: capitalize;
  margin-bottom: 14px;
}

.legend span {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.legend i {
  width: 10px;
  height: 10px;
  border-radius: 50%;
}

.legend .laps {
  margin-left: auto;
  font-family: var(--font-mono);
  color: var(--ink-3);
  text-transform: none;
}

ol {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.lane {
  display: grid;
  grid-template-columns: 44px minmax(0, 1fr);
  gap: 12px;
  align-items: center;
}

.who {
  font-family: var(--font-mono);
  font-size: 12px;
  color: var(--ink-2);
}

.track {
  position: relative;
  height: 16px;
  border-radius: 4px;
  background: var(--tint);
}

.seg {
  position: absolute;
  top: 0;
  bottom: 0;
  border-radius: 4px;
  border-right: 2px solid var(--amb);
  display: grid;
  place-items: center;
}

.c {
  font-size: 10px;
  font-weight: 700;
  color: #111;
}
</style>
