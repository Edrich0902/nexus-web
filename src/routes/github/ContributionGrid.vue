<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import type { GithubContributionWeek } from '@/types/github/github'

/** A year of contributions as accent-tinted cells, one column per week. */
const props = defineProps<{
  weeks: GithubContributionWeek[]
  total?: number
}>()

const scroller = ref<HTMLElement | null>(null)

const max = computed(() => Math.max(1, ...props.weeks.flatMap((w) => w.contribution_days.map((d) => d.count))))

function level(count: number): number {
  if (count <= 0) return 0
  return Math.min(4, Math.ceil((count / max.value) * 4))
}

const dateFmt = new Intl.DateTimeFormat(undefined, { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })

function tip(date: string, count: number): string {
  const parsed = new Date(`${date}T12:00:00`)
  const when = Number.isNaN(parsed.getTime()) ? date : dateFmt.format(parsed)
  return `${count} ${count === 1 ? 'contribution' : 'contributions'} · ${when}`
}

const label = computed(() =>
  props.total != null ? `${props.total} contributions in the last year` : 'Contribution calendar',
)

onMounted(() => {
  const el = scroller.value
  if (el) el.scrollLeft = el.scrollWidth
})
</script>

<template>
  <figure class="contrib">
    <div ref="scroller" class="scroll">
      <div class="grid" role="img" :aria-label="label" :style="{ '--weeks': weeks.length }">
        <template v-for="(week, wi) in weeks" :key="wi">
          <i
            v-for="day in week.contribution_days"
            :key="day.date"
            :class="`l${level(day.count)}`"
            v-tooltip.top="{ value: tip(day.date, day.count), showDelay: 60 }"
          />
        </template>
      </div>
    </div>
    <figcaption>
      Less
      <span class="legend"><i class="l0" /><i class="l1" /><i class="l2" /><i class="l3" /><i class="l4" /></span>
      More
    </figcaption>
  </figure>
</template>

<style scoped>
.contrib {
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.scroll {
  overflow-x: auto;
  scrollbar-width: thin;
}

.grid {
  display: grid;
  grid-auto-flow: column;
  grid-template-rows: repeat(7, auto);
  grid-template-columns: repeat(var(--weeks), minmax(9px, 1fr));
  gap: 3px;
  min-width: calc(var(--weeks) * 12px);
}

i {
  display: block;
  aspect-ratio: 1;
  border-radius: 2px;
  background: var(--tint);
}

.l1 {
  background: color-mix(in srgb, var(--acc) 30%, transparent);
}

.l2 {
  background: color-mix(in srgb, var(--acc) 55%, transparent);
}

.l3 {
  background: color-mix(in srgb, var(--acc) 80%, transparent);
}

.l4 {
  background: var(--acc);
}

figcaption {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
  font-size: 12px;
  color: var(--ink-3);
}

.legend {
  display: inline-flex;
  gap: 3px;
}

.legend i {
  width: 10px;
}
</style>
