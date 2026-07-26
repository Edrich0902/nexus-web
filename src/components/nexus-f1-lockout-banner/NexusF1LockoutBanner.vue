<script setup lang="ts">
import { computed } from 'vue'
import type { F1ProviderHealth } from '@/types/f1/f1'

const props = defineProps<{
  health?: F1ProviderHealth | null
}>()

const locked = computed(() => Boolean(props.health?.live_lockout))
</script>

<template>
  <Message v-if="locked" severity="warn" :closable="false" class="lockout">
    OpenF1 free API is locked during a live F1 session. Syncs will resume
    automatically after the session ends
    <span v-if="health?.locked_until">
      (retry around {{ new Date(health.locked_until).toLocaleString() }})
    </span>
    .
    <span v-if="health?.reason" class="reason">{{ health.reason }}</span>
  </Message>
</template>

<style scoped>
.lockout {
  margin: 0;
}

.reason {
  display: block;
  margin-top: 0.35rem;
  opacity: 0.85;
  font-size: 0.85rem;
}
</style>
