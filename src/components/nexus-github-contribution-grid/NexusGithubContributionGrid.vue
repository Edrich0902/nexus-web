<script setup lang="ts">
import { computed } from 'vue'
import type { GithubContributionWeek } from '@/types/github/github'

const props = defineProps<{
  weeks: GithubContributionWeek[]
}>()

const levels = computed(() => {
  const all = props.weeks.flatMap((w) => w.contribution_days.map((d) => d.count))
  const max = Math.max(0, ...all)
  return { max: max || 1 }
})

function levelClass(count: number): string {
  if (count <= 0) return 'l0'
  const ratio = count / levels.value.max
  if (ratio <= 0.25) return 'l1'
  if (ratio <= 0.5) return 'l2'
  if (ratio <= 0.75) return 'l3'
  return 'l4'
}

function formatDate(iso: string): string {
  const parsed = new Date(`${iso}T12:00:00`)
  if (Number.isNaN(parsed.getTime())) return iso
  return parsed.toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function tooltipFor(date: string, count: number): string {
  const noun = count === 1 ? 'contribution' : 'contributions'
  return `${count} ${noun}<br>${formatDate(date)}`
}
</script>

<template>
  <div class="contrib-grid" role="img" aria-label="Contribution calendar">
    <div v-for="(week, wi) in weeks" :key="wi" class="week">
      <button
        v-for="day in week.contribution_days"
        :key="day.date"
        type="button"
        class="day"
        :class="levelClass(day.count)"
        :style="day.color ? { backgroundColor: day.color } : undefined"
        :aria-label="tooltipFor(day.date, day.count)"
        v-tooltip.top="{
          value: tooltipFor(day.date, day.count),
          showDelay: 80,
          hideDelay: 0,
          escape: false,
        }"
      />
    </div>
  </div>
</template>

<style scoped>
.contrib-grid {
  display: flex;
  gap: 3px;
  overflow-x: auto;
  padding: 0.15rem 0 0.35rem;
}

.week {
  display: grid;
  grid-template-rows: repeat(7, 12px);
  gap: 3px;
}

.day {
  width: 12px;
  height: 12px;
  padding: 0;
  border: 0;
  border-radius: 2px;
  background: color-mix(in srgb, var(--lavender-blush) 10%, transparent);
  cursor: default;
  transition:
    outline-color 0.12s ease,
    transform 0.12s ease;
}

.day:hover,
.day:focus-visible {
  outline: 1px solid color-mix(in srgb, var(--lavender-blush) 70%, transparent);
  outline-offset: 1px;
  transform: scale(1.15);
  z-index: 1;
}

.day.l0 {
  background: color-mix(in srgb, var(--lavender-blush) 8%, transparent);
}

.day.l1 {
  background: #0e4429;
}

.day.l2 {
  background: #006d32;
}

.day.l3 {
  background: #26a641;
}

.day.l4 {
  background: #39d353;
}
</style>
