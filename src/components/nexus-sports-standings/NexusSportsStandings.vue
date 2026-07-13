<script setup lang="ts">
import { computed } from 'vue'
import NexusTeamBadge from '@components/nexus-team-badge/NexusTeamBadge.vue'
import type { SportsStandingBlock } from '@/types/sports/sports'

const props = defineProps<{
  block: SportsStandingBlock
}>()

const rows = computed(() =>
  (props.block.rows ?? []).slice(0, 20).map((row, index) => ({
    rank: Number(row.intRank ?? index + 1),
    team: String(row.strTeam ?? row.name ?? '—'),
    badge: typeof row.strBadge === 'string' ? row.strBadge : null,
    played: row.intPlayed ?? '—',
    won: row.intWin ?? '—',
    draw: row.intDraw ?? '—',
    loss: row.intLoss ?? '—',
    gd: row.intGoalDifference ?? '—',
    points: row.intPoints ?? '—',
    form: typeof row.strForm === 'string' ? row.strForm : '',
    description:
      typeof row.strDescription === 'string' ? row.strDescription : '',
  })),
)

function rankClass(rank: number): string {
  if (rank <= 4) return 'zone-cl'
  if (rank <= 6) return 'zone-el'
  if (rank >= rows.value.length - 2 && rows.value.length > 8) return 'zone-rel'
  return ''
}
</script>

<template>
  <section class="standings-card">
    <header class="standings-head">
      <div>
        <h4>{{ block.league }}</h4>
        <p>{{ block.season }}</p>
      </div>
      <Tag value="Table" severity="secondary" />
    </header>

    <div class="standings-table" role="table">
      <div class="standings-row head" role="row">
        <span>#</span>
        <span>Club</span>
        <span>P</span>
        <span class="hide-sm">W</span>
        <span class="hide-sm">D</span>
        <span class="hide-sm">L</span>
        <span class="hide-sm">GD</span>
        <span>Pts</span>
      </div>

      <div
        v-for="row in rows"
        :key="`${row.rank}-${row.team}`"
        class="standings-row"
        :class="rankClass(row.rank)"
        role="row"
      >
        <span class="rank">{{ row.rank }}</span>
        <div class="club">
          <NexusTeamBadge :src="row.badge" :label="row.team" size="sm" />
          <div class="club-copy">
            <span class="club-name">{{ row.team }}</span>
            <span v-if="row.description" class="club-note">{{
              row.description
            }}</span>
          </div>
        </div>
        <span>{{ row.played }}</span>
        <span class="hide-sm">{{ row.won }}</span>
        <span class="hide-sm">{{ row.draw }}</span>
        <span class="hide-sm">{{ row.loss }}</span>
        <span class="hide-sm">{{ row.gd }}</span>
        <span class="pts">{{ row.points }}</span>
      </div>
    </div>
  </section>
</template>

<style scoped>
.standings-card {
  border-radius: 1rem;
  overflow: hidden;
  border: 1px solid color-mix(in srgb, var(--sports-accent) 24%, transparent);
  background:
    radial-gradient(
      circle at top right,
      color-mix(in srgb, var(--sports-accent) 18%, transparent),
      transparent 45%
    ),
    color-mix(in srgb, var(--coffee-bean-panel) 94%, black);
}

.standings-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  padding: 0.95rem 1rem 0.75rem;
  border-bottom: 1px solid color-mix(in srgb, var(--lavender-blush) 10%, transparent);
}

.standings-head h4 {
  margin: 0;
  font-size: 1rem;
  color: var(--lavender-blush);
}

.standings-head p {
  margin: 0.15rem 0 0;
  font-size: 0.78rem;
  color: color-mix(in srgb, var(--lavender-blush) 55%, transparent);
}

.standings-table {
  display: flex;
  flex-direction: column;
}

.standings-row {
  display: grid;
  grid-template-columns: 2rem minmax(0, 1.8fr) 2rem 2rem 2rem 2rem 2.4rem 2.6rem;
  gap: 0.35rem;
  align-items: center;
  padding: 0.55rem 0.85rem;
  font-size: 0.8rem;
  color: color-mix(in srgb, var(--lavender-blush) 82%, transparent);
  border-left: 3px solid transparent;
}

.standings-row.head {
  font-size: 0.68rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: color-mix(in srgb, var(--lavender-blush) 48%, transparent);
  background: color-mix(in srgb, var(--lavender-blush) 4%, transparent);
}

.standings-row:not(.head):nth-child(even) {
  background: color-mix(in srgb, var(--lavender-blush) 3%, transparent);
}

.standings-row.zone-cl {
  border-left-color: #5ecf8a;
  background: color-mix(in srgb, #5ecf8a 8%, transparent);
}

.standings-row.zone-el {
  border-left-color: #3d9b8f;
  background: color-mix(in srgb, #3d9b8f 7%, transparent);
}

.standings-row.zone-rel {
  border-left-color: #d4706a;
  background: color-mix(in srgb, #d4706a 8%, transparent);
}

.rank {
  font-variant-numeric: tabular-nums;
  font-weight: 700;
  color: var(--lavender-blush);
}

.club {
  display: flex;
  align-items: center;
  gap: 0.55rem;
  min-width: 0;
}

.club-copy {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.club-name {
  font-weight: 600;
  color: var(--lavender-blush);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.club-note {
  font-size: 0.68rem;
  color: color-mix(in srgb, var(--lavender-blush) 48%, transparent);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.pts {
  font-weight: 700;
  color: var(--lavender-blush);
  font-variant-numeric: tabular-nums;
}

@media (max-width: 760px) {
  .standings-row {
    grid-template-columns: 2rem minmax(0, 1fr) 2.2rem 2.6rem;
  }

  .hide-sm {
    display: none;
  }
}
</style>
