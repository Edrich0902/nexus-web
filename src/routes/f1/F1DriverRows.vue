<script setup lang="ts">
import type { F1StandingDriver } from '@/types/f1/f1'
import { driverName, teamColour } from './f1'

/** Driver standings as hairline rows: position, team bar, name, points, gap. */
defineProps<{
  drivers: F1StandingDriver[]
  leaderPoints: number
}>()
</script>

<template>
  <ol class="drivers">
    <li v-for="d in drivers" :key="d.driver_number" class="row">
      <span class="p">P{{ d.position ?? '–' }}</span>
      <span class="tb" :style="{ background: teamColour(d.team_colour) }" aria-hidden="true" />
      <span class="who">
        <b>{{ driverName(d.name, `#${d.driver_number}`) }}</b>
        <span v-if="d.team_name" class="team"> · {{ d.team_name }}</span>
      </span>
      <span class="pts num">{{ d.points ?? 0 }}</span>
      <span class="gap num">{{ leaderPoints - (d.points ?? 0) > 0 ? `−${leaderPoints - (d.points ?? 0)}` : '' }}</span>
    </li>
  </ol>
</template>

<style scoped>
.drivers {
  list-style: none;
  margin: 0;
  padding: 0;
}

.row {
  display: grid;
  grid-template-columns: 34px 4px minmax(0, 1fr) auto 48px;
  gap: 12px;
  align-items: center;
  padding: 10px 0;
  border-top: 1px solid var(--line);
}

.row:first-child {
  border-top: 0;
}

.p,
.gap {
  font-family: var(--font-mono);
  font-size: 12px;
  color: var(--ink-3);
}

.gap {
  text-align: right;
}

.tb {
  width: 4px;
  height: 18px;
  border-radius: 2px;
}

.who {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

b {
  font-weight: 600;
}

.team {
  color: var(--ink-3);
}

.pts {
  font-weight: 600;
}

@media (max-width: 640px) {
  .row {
    grid-template-columns: 30px 4px minmax(0, 1fr) auto 40px;
    gap: 10px;
  }

  .team {
    display: none;
  }
}
</style>
