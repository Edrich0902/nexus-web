<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import NexusF1Icon from '@components/nexus-f1-icon/NexusF1Icon.vue'
import { useF1Store } from '@stores/f1/f1.store'
import { formatDate } from '@lib/datetime'

const f1 = useF1Store()
const router = useRouter()

onMounted(() => {
  void f1.loadHome()
})

const mode = computed<'loading' | 'empty' | 'ready'>(() => {
  if (f1.homeLoading && !f1.home) return 'loading'
  if (!f1.home) return 'empty'
  if (f1.home.next_meeting || f1.home.last_meeting) return 'ready'
  return 'empty'
})

const focus = computed(
  () => f1.home?.next_meeting ?? f1.home?.last_meeting ?? null,
)

const topDrivers = computed(() => f1.home?.standings_drivers_top?.slice(0, 3) ?? [])

function open(): void {
  void router.push('/f1')
}
</script>

<template>
  <article class="f1-pulse" :class="`is-${mode}`" @click="open">
    <header class="head">
      <div class="title-row">
        <NexusF1Icon :size="20" />
        <h3>Formula 1</h3>
      </div>
      <Tag value="Historical" severity="secondary" rounded />
    </header>

    <div v-if="mode === 'loading'" class="body muted">Loading weekend…</div>
    <div v-else-if="mode === 'empty'" class="body muted">
      Sync the season to populate the F1 calendar.
    </div>
    <div v-else class="body">
      <p class="eyebrow">
        {{ f1.home?.next_meeting ? 'Next weekend' : 'Last weekend' }}
      </p>
      <h4>{{ focus?.meeting_name }}</h4>
      <p class="muted">
        {{ focus?.circuit_short_name || focus?.location }}
        <span v-if="focus?.date_start"> · {{ formatDate(focus.date_start) }}</span>
      </p>
      <ul v-if="topDrivers.length" class="standings">
        <li v-for="d in topDrivers" :key="d.driver_number">
          <span class="pos">{{ d.position }}</span>
          <span>{{ d.name_acronym || d.name || `#${d.driver_number}` }}</span>
          <span class="pts">{{ d.points }}</span>
        </li>
      </ul>
    </div>
  </article>
</template>

<style scoped>
.f1-pulse {
  border: 1px solid color-mix(in srgb, var(--sport-f1) 28%, transparent);
  background:
    radial-gradient(
      120% 80% at 0% 0%,
      color-mix(in srgb, var(--sport-f1) 18%, transparent),
      transparent 55%
    ),
    color-mix(in srgb, var(--sport-f1) 5%, var(--p-content-background));
  border-radius: 1rem;
  padding: 1rem 1.1rem;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
}

.title-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

h3,
h4 {
  margin: 0;
}

h3 {
  font-size: 1rem;
}

h4 {
  font-size: 1.05rem;
}

.eyebrow {
  margin: 0;
  font-size: 0.65rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--sport-f1);
}

.muted {
  color: var(--p-text-muted-color);
  font-size: 0.85rem;
}

.body {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.standings {
  list-style: none;
  margin: 0.5rem 0 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.standings li {
  display: grid;
  grid-template-columns: 1.5rem 1fr auto;
  gap: 0.5rem;
  font-size: 0.85rem;
}

.pos,
.pts {
  color: var(--p-text-muted-color);
}
</style>
