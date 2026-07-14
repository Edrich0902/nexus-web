<script setup lang="ts">
import { computed } from 'vue'
import type { F1StandingDriver, F1StandingTeam } from '@/types/f1/f1'

const props = defineProps<{
  drivers: F1StandingDriver[]
  teams: F1StandingTeam[]
  compact?: boolean
}>()

const driverRows = computed(() =>
  props.compact ? props.drivers.slice(0, 5) : props.drivers,
)
const teamRows = computed(() =>
  props.compact ? props.teams.slice(0, 5) : props.teams,
)

function colour(hex?: string | null): string {
  if (!hex) return 'var(--sport-f1)'
  return hex.startsWith('#') ? hex : `#${hex}`
}
</script>

<template>
  <div class="f1-standings" :class="{ compact }">
    <section>
      <h3>Drivers</h3>
      <DataTable :value="driverRows" size="small" striped-rows>
        <Column field="position" header="Pos" style="width: 3rem" />
        <Column header="Driver">
          <template #body="{ data }">
            <div class="driver-cell">
              <span
                class="team-dot"
                :style="{ background: colour(data.team_colour) }"
              />
              <span>{{ data.name_acronym || data.name || `#${data.driver_number}` }}</span>
              <span v-if="!compact && data.team_name" class="muted">{{
                data.team_name
              }}</span>
            </div>
          </template>
        </Column>
        <Column field="points" header="Pts" style="width: 4rem" />
      </DataTable>
    </section>
    <section>
      <h3>Constructors</h3>
      <DataTable :value="teamRows" size="small" striped-rows>
        <Column field="position" header="Pos" style="width: 3rem" />
        <Column field="team_name" header="Team" />
        <Column field="points" header="Pts" style="width: 4rem" />
      </DataTable>
    </section>
  </div>
</template>

<style scoped>
.f1-standings {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1rem;
}

.f1-standings.compact {
  grid-template-columns: 1fr;
}

h3 {
  margin: 0 0 0.5rem;
  font-size: 0.85rem;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--p-text-muted-color);
}

.driver-cell {
  display: flex;
  align-items: center;
  gap: 0.45rem;
}

.team-dot {
  width: 0.55rem;
  height: 0.55rem;
  border-radius: 999px;
  flex-shrink: 0;
}

.muted {
  color: var(--p-text-muted-color);
  font-size: 0.8rem;
}

@media (max-width: 720px) {
  .f1-standings:not(.compact) {
    grid-template-columns: 1fr;
  }
}
</style>
