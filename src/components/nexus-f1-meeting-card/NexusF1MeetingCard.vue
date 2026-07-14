<script setup lang="ts">
import { useRouter } from 'vue-router'
import NexusImage from '@components/nexus-image/NexusImage.vue'
import type { F1MeetingSummary } from '@/types/f1/f1'
import { formatDate } from '@lib/datetime'

const props = defineProps<{
  meeting: F1MeetingSummary
}>()

const router = useRouter()

function open(): void {
  void router.push(`/f1/meetings/${props.meeting.meeting_key}`)
}
</script>

<template>
  <button type="button" class="meeting-card" @click="open">
    <div class="media">
      <NexusImage
        v-if="meeting.circuit_image"
        :src="meeting.circuit_image"
        :alt="meeting.circuit_short_name || meeting.meeting_name"
        size="lg"
      />
      <div v-else class="media-fallback" />
    </div>
    <div class="copy">
      <p class="eyebrow">{{ meeting.country_name || 'Grand Prix' }}</p>
      <h3>{{ meeting.meeting_name }}</h3>
      <p class="muted">
        {{ meeting.circuit_short_name || meeting.location }}
        <span v-if="meeting.date_start">
          · {{ formatDate(meeting.date_start) }}</span
        >
      </p>
      <p v-if="meeting.sessions?.length" class="sessions">
        {{ meeting.sessions.length }} sessions
      </p>
    </div>
  </button>
</template>

<style scoped>
.meeting-card {
  display: grid;
  grid-template-columns: 5.5rem 1fr;
  gap: 0.85rem;
  align-items: center;
  width: 100%;
  text-align: left;
  border: 1px solid color-mix(in srgb, var(--sport-f1) 22%, transparent);
  background: color-mix(in srgb, var(--sport-f1) 6%, transparent);
  border-radius: 0.75rem;
  padding: 0.75rem;
  cursor: pointer;
  color: inherit;
  transition: border-color 0.15s ease, background 0.15s ease;
}

.meeting-card:hover {
  border-color: color-mix(in srgb, var(--sport-f1) 45%, transparent);
  background: color-mix(in srgb, var(--sport-f1) 12%, transparent);
}

.media,
.media-fallback {
  width: 5.5rem;
  height: 4rem;
  border-radius: 0.5rem;
  overflow: hidden;
  background: color-mix(in srgb, var(--sport-f1) 18%, #111);
}

.copy {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
  min-width: 0;
}

.eyebrow {
  margin: 0;
  font-size: 0.65rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--sport-f1);
}

h3 {
  margin: 0;
  font-size: 1rem;
  font-weight: 700;
}

.muted,
.sessions {
  margin: 0;
  font-size: 0.8rem;
  color: var(--p-text-muted-color);
}
</style>
