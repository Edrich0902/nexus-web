<script setup lang="ts">
import { computed } from 'vue'
import NxIcon from '@design/components/NxIcon.vue'
import type { F1ProviderHealth } from '@/types/f1/f1'

const props = defineProps<{
  health?: F1ProviderHealth | null
}>()

const locked = computed(() => Boolean(props.health?.live_lockout))
const until = computed(() =>
  props.health?.locked_until
    ? new Date(props.health.locked_until).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
    : null,
)
</script>

<template>
  <div v-if="locked" class="lockout" role="status">
    <NxIcon name="clock" :size="18" />
    <div>
      <b>Data paused while a session is live.</b>
      OpenF1's free tier locks during live sessions; syncing resumes on its own
      <template v-if="until"> around {{ until }}</template>.
      <span v-if="health?.reason" class="reason">{{ health.reason }}</span>
    </div>
  </div>
</template>

<style scoped>
.lockout {
  display: flex;
  gap: 12px;
  align-items: flex-start;
  padding: 14px 16px;
  border-radius: var(--r-md);
  background: color-mix(in srgb, var(--warn) 12%, transparent);
  color: var(--ink-2);
  font-size: 14px;
}

.lockout :deep(svg) {
  flex-shrink: 0;
  margin-top: 1px;
  color: var(--warn);
}

b {
  color: var(--ink);
  font-weight: 600;
}

.reason {
  display: block;
  margin-top: 4px;
  font-size: 13px;
  color: var(--ink-3);
}
</style>
