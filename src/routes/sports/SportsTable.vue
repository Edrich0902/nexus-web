<script setup lang="ts">
import { computed } from 'vue'
import NexusTeamBadge from '@components/nexus-team-badge/NexusTeamBadge.vue'
import type { SportsStandingBlock } from '@/types/sports/sports'
import { tableRows } from './sports'

/** A league table as hairline rows with recent form. */
const props = defineProps<{
  block: SportsStandingBlock
}>()

const rows = computed(() => tableRows(props.block))

const FORM: Record<string, string> = { W: 'var(--ok)', D: 'var(--ink-3)', L: 'var(--bad)' }
</script>

<template>
  <section class="table">
    <header>
      <h3>{{ block.league }}</h3>
      <span class="season">{{ block.season }}</span>
    </header>
    <div class="grid" role="table" :aria-label="`${block.league ?? 'League'} table`">
      <div class="r head" role="row">
        <span role="columnheader">#</span>
        <span role="columnheader">Club</span>
        <span role="columnheader" class="form-col">Form</span>
        <span role="columnheader" class="n">P</span>
        <span role="columnheader" class="n">GD</span>
        <span role="columnheader" class="n">Pts</span>
      </div>
      <div v-for="row in rows" :key="`${row.rank}-${row.team}`" class="r" role="row" :title="row.note || undefined">
        <span class="rank" role="cell">{{ row.rank }}</span>
        <span class="club" role="cell">
          <NexusTeamBadge :src="row.badge" :label="row.team" :size="22" />
          <span class="name">{{ row.team }}</span>
        </span>
        <span class="form-col form" role="cell">
          <i v-for="(f, i) in row.form" :key="i" :style="{ background: FORM[f] ?? 'var(--ink-4)' }" :title="f" />
        </span>
        <span class="n" role="cell">{{ row.played }}</span>
        <span class="n" role="cell">{{ row.gd }}</span>
        <span class="n pts" role="cell">{{ row.points }}</span>
      </div>
    </div>
  </section>
</template>

<style scoped>
header {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 10px;
}

h3 {
  margin: 0;
  font-family: var(--font-serif);
  font-weight: 400;
  font-size: 24px;
  line-height: 1.1;
}

.season {
  font-family: var(--font-mono);
  font-size: 12px;
  color: var(--ink-3);
}

.r {
  display: grid;
  grid-template-columns: 26px minmax(0, 1fr) 76px 32px 40px 40px;
  gap: 10px;
  align-items: center;
  padding: 9px 0;
  border-top: 1px solid var(--line);
  font-size: 14px;
}

.r.head {
  border-top: 0;
  padding-top: 0;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--ink-3);
}

.rank {
  font-family: var(--font-mono);
  font-size: 12px;
  color: var(--ink-3);
}

.club {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}

.name {
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.form {
  display: flex;
  gap: 4px;
}

.form i {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.n {
  text-align: right;
  font-variant-numeric: tabular-nums;
}

.pts {
  font-weight: 700;
}

@media (max-width: 640px) {
  .r {
    grid-template-columns: 22px minmax(0, 1fr) 28px 36px 36px;
  }

  .form-col {
    display: none;
  }
}
</style>
