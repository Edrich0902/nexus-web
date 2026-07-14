<script setup lang="ts">
import { onMounted } from 'vue'
import NexusPageWrapper from '@components/nexus-page-wrapper/NexusPageWrapper.vue'
import NexusF1Icon from '@components/nexus-f1-icon/NexusF1Icon.vue'
import NexusF1MeetingCard from '@components/nexus-f1-meeting-card/NexusF1MeetingCard.vue'
import NexusF1Standings from '@components/nexus-f1-standings/NexusF1Standings.vue'
import NexusSkeletonList from '@components/nexus-skeleton-list/NexusSkeletonList.vue'
import { useF1Store } from '@stores/f1/f1.store'

const f1 = useF1Store()

onMounted(() => {
  void f1.loadSeason()
  void f1.loadHome()
})
</script>

<template>
  <NexusPageWrapper show-toolbar title="Formula 1">
    <template #toolbar>
      <Button
        label="Sync"
        icon="pi pi-sync"
        severity="secondary"
        text
        :loading="f1.syncPending"
        @click="f1.syncNow('all')"
      />
    </template>

    <div class="f1-page">
      <header class="hero">
        <div class="glow" aria-hidden="true" />
        <div class="hero-main">
          <div class="icon-wrap">
            <NexusF1Icon :size="32" />
          </div>
          <div>
            <p class="eyebrow">Sports Hub</p>
            <h2>Formula 1</h2>
            <p class="muted">
              Season calendar, standings, and post-session race analysis via
              OpenF1 (historical free tier — no live tracking).
            </p>
          </div>
        </div>
        <div class="stats">
          <div class="stat">
            <strong>{{ f1.season?.meetings.length ?? 0 }}</strong>
            <span>Meetings</span>
          </div>
          <div class="stat">
            <strong>{{ f1.home?.session_count ?? '—' }}</strong>
            <span>Sessions</span>
          </div>
          <div class="stat">
            <strong>{{ f1.season?.year ?? new Date().getFullYear() }}</strong>
            <span>Season</span>
          </div>
        </div>
      </header>

      <Message
        severity="info"
        :closable="false"
        class="note"
      >
        Live race timing requires a paid OpenF1 subscription. Nexus serves
        historical data and prepares session detail ≈35 minutes after the
        chequered flag.
      </Message>

      <section v-if="f1.seasonLoading">
        <NexusSkeletonList :count="4" />
      </section>

      <template v-else>
        <section>
          <div class="section-head">
            <h3>Championship</h3>
          </div>
          <NexusF1Standings
            :drivers="f1.standings?.drivers ?? []"
            :teams="f1.standings?.teams ?? []"
          />
        </section>

        <section>
          <div class="section-head">
            <h3>Calendar</h3>
            <span class="muted">{{ f1.season?.year }}</span>
          </div>
          <div class="meeting-grid">
            <NexusF1MeetingCard
              v-for="m in f1.season?.meetings ?? []"
              :key="m.meeting_key"
              :meeting="m"
            />
          </div>
          <p
            v-if="!(f1.season?.meetings.length)"
            class="muted empty"
          >
            No meetings yet — run Sync to pull the OpenF1 season calendar.
          </p>
        </section>
      </template>
    </div>
  </NexusPageWrapper>
</template>

<style scoped>
.f1-page {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  padding-bottom: 2rem;
  --f1-accent: var(--sport-f1);
}

.hero {
  position: relative;
  overflow: hidden;
  border-radius: 1rem;
  border: 1px solid color-mix(in srgb, var(--f1-accent) 28%, transparent);
  padding: 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  background: color-mix(in srgb, var(--f1-accent) 6%, transparent);
}

.glow {
  position: absolute;
  inset: -40% auto auto -10%;
  width: 60%;
  height: 120%;
  background: radial-gradient(
    closest-side,
    color-mix(in srgb, var(--f1-accent) 35%, transparent),
    transparent
  );
  pointer-events: none;
}

.hero-main {
  position: relative;
  display: flex;
  gap: 1rem;
  align-items: flex-start;
}

.icon-wrap {
  width: 3.25rem;
  height: 3.25rem;
  border-radius: 0.85rem;
  display: grid;
  place-items: center;
  background: color-mix(in srgb, var(--f1-accent) 18%, transparent);
}

.eyebrow {
  margin: 0;
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--f1-accent);
}

h2,
h3 {
  margin: 0;
}

h2 {
  font-size: clamp(1.45rem, 2.5vw, 1.85rem);
}

.muted {
  color: var(--p-text-muted-color);
  font-size: 0.9rem;
}

.stats {
  position: relative;
  display: flex;
  gap: 1.25rem;
  flex-wrap: wrap;
}

.stat {
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
}

.stat strong {
  font-size: 1.25rem;
}

.stat span {
  font-size: 0.75rem;
  color: var(--p-text-muted-color);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.section-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  margin-bottom: 0.75rem;
}

.meeting-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(18rem, 1fr));
  gap: 0.75rem;
}

.empty {
  margin-top: 0.5rem;
}

.note :deep(.p-message-text) {
  font-size: 0.85rem;
}
</style>
