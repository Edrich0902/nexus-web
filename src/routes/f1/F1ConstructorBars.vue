<script setup lang="ts">
import { computed } from 'vue'
import type { F1StandingTeam } from '@/types/f1/f1'

/** Constructor standings as bars in team colours, scaled to the leader. */
const props = defineProps<{
  teams: F1StandingTeam[]
  colours: Map<string, string>
}>()

const max = computed(() => Math.max(1, ...props.teams.map((t) => t.points ?? 0)))
</script>

<template>
  <ol class="cons">
    <li v-for="t in teams" :key="t.team_name" class="row">
      <span class="name">{{ t.team_name }}</span>
      <span class="tr" aria-hidden="true">
        <i
          :style="{
            width: `${((t.points ?? 0) / max) * 100}%`,
            background: colours.get(t.team_name) ?? 'var(--ink-3)',
          }"
        />
      </span>
      <span class="pts num">{{ t.points ?? 0 }}</span>
    </li>
  </ol>
</template>

<style scoped>
.cons {
  list-style: none;
  margin: 0;
  padding: 0;
}

.row {
  display: grid;
  grid-template-columns: 132px minmax(0, 1fr) 44px;
  gap: 14px;
  align-items: center;
  padding: 9px 0;
}

.name {
  font-size: 14px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.tr {
  height: 8px;
  border-radius: 4px;
  background: var(--tint);
  overflow: hidden;
}

.tr i {
  display: block;
  height: 100%;
  border-radius: 4px;
}

.pts {
  text-align: right;
  font-weight: 600;
}

@media (max-width: 640px) {
  .row {
    grid-template-columns: 104px minmax(0, 1fr) 40px;
    gap: 10px;
  }
}
</style>
