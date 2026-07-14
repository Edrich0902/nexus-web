<script setup lang="ts">
import { computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import NexusPageWrapper from '@components/nexus-page-wrapper/NexusPageWrapper.vue'
import NexusImage from '@components/nexus-image/NexusImage.vue'
import NexusSkeletonList from '@components/nexus-skeleton-list/NexusSkeletonList.vue'
import { useF1Store } from '@stores/f1/f1.store'
import { formatDateTime } from '@lib/datetime'

const route = useRoute()
const router = useRouter()
const f1 = useF1Store()

const meetingKey = computed(() => Number(route.params.meetingKey))

onMounted(() => {
  void f1.loadMeeting(meetingKey.value)
})

watch(meetingKey, (key) => {
  void f1.loadMeeting(key)
})

function openSession(sessionKey: number): void {
  void router.push(`/f1/sessions/${sessionKey}`)
}
</script>

<template>
  <NexusPageWrapper
    show-toolbar
    :title="f1.meeting?.meeting_name || 'Weekend'"
  >
    <template #toolbar>
      <Button
        label="Back"
        icon="pi pi-arrow-left"
        text
        severity="secondary"
        @click="router.push('/f1')"
      />
    </template>

    <div v-if="f1.meetingLoading" class="wrap">
      <NexusSkeletonList :count="3" />
    </div>
    <div v-else-if="f1.meeting" class="wrap">
      <header class="hero">
        <NexusImage
          v-if="f1.meeting.circuit_image"
          :src="f1.meeting.circuit_image"
          :alt="f1.meeting.circuit_short_name || ''"
          size="lg"
          rounded
        />
        <div>
          <p class="eyebrow">{{ f1.meeting.country_name }}</p>
          <h2>{{ f1.meeting.meeting_name }}</h2>
          <p class="muted">
            {{ f1.meeting.circuit_short_name || f1.meeting.location }}
            <span v-if="f1.meeting.circuit_type">
              · {{ f1.meeting.circuit_type }}</span
            >
          </p>
        </div>
      </header>

      <section>
        <h3>Sessions</h3>
        <div class="session-list">
          <button
            v-for="s in f1.meeting.sessions ?? []"
            :key="s.session_key"
            type="button"
            class="session-row"
            @click="openSession(s.session_key)"
          >
            <div>
              <strong>{{ s.session_name }}</strong>
              <p class="muted">
                {{ s.date_start ? formatDateTime(s.date_start) : 'TBC' }}
              </p>
            </div>
            <div class="badges">
              <Tag
                v-if="s.detail_synced"
                value="Synced"
                severity="success"
                rounded
              />
              <Tag
                v-else-if="s.historically_available"
                value="Ready to sync"
                severity="info"
                rounded
              />
              <Tag v-else value="Upcoming" severity="secondary" rounded />
              <i class="pi pi-chevron-right" />
            </div>
          </button>
        </div>
      </section>
    </div>
  </NexusPageWrapper>
</template>

<style scoped>
.wrap {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  padding-bottom: 2rem;
}

.hero {
  display: flex;
  gap: 1rem;
  align-items: center;
  padding: 1rem;
  border-radius: 1rem;
  border: 1px solid color-mix(in srgb, var(--sport-f1) 25%, transparent);
  background: color-mix(in srgb, var(--sport-f1) 6%, transparent);
}

.eyebrow {
  margin: 0;
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--sport-f1);
}

h2,
h3 {
  margin: 0;
}

h3 {
  margin-bottom: 0.75rem;
}

.muted {
  margin: 0.2rem 0 0;
  color: var(--p-text-muted-color);
  font-size: 0.9rem;
}

.session-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.session-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  width: 100%;
  text-align: left;
  padding: 0.85rem 1rem;
  border-radius: 0.75rem;
  border: 1px solid var(--p-content-border-color);
  background: transparent;
  color: inherit;
  cursor: pointer;
}

.session-row:hover {
  border-color: color-mix(in srgb, var(--sport-f1) 40%, transparent);
}

.badges {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}
</style>
