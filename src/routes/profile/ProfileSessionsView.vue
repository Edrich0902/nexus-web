<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useConfirm } from 'primevue/useconfirm'
import { useRouter } from 'vue-router'
import NxPanel from '@design/components/NxPanel.vue'
import NxEmptyState from '@design/components/NxEmptyState.vue'
import NxSkeletonRows from '@design/components/skeletons/NxSkeletonRows.vue'
import { plural } from '@routes/collections/collectionFields'
import { formatDateTime, relativeTime } from '@lib/datetime'
import { useAuthStore } from '@stores/auth/auth.store'
import { Status } from '@/types/status'
import type { DeviceSession } from '@/types/auth/device-session'
import { describeAgent } from './sessions'

const auth = useAuthStore()
const confirm = useConfirm()
const router = useRouter()

const loading = computed(() => auth.sessionsStatus === Status.LOADING)
const sessions = computed(() => [...auth.sessions].sort((a, b) => Number(b.is_current) - Number(a.is_current)))
const otherCount = computed(() => auth.sessions.filter((s) => !s.is_current).length)

onMounted(() => void auth.fetchSessions())

function confirmRevoke(session: DeviceSession, event: Event): void {
  confirm.require({
    target: event.currentTarget as HTMLElement,
    message: session.is_current ? 'Revoke this device and sign out now?' : 'Revoke access for this device?',
    acceptLabel: 'Revoke',
    rejectLabel: 'Cancel',
    acceptProps: { severity: 'danger', size: 'small' },
    rejectProps: { severity: 'secondary', text: true, size: 'small' },
    accept: async () => {
      const result = await auth.revokeSession(session.id)
      if (result === 'signed-out') await router.replace({ name: 'login' })
    },
  })
}

function confirmRevokeOthers(event: Event): void {
  confirm.require({
    target: event.currentTarget as HTMLElement,
    message: `Sign out of ${plural(otherCount.value, 'other session')}? This device stays signed in.`,
    acceptLabel: 'Sign out others',
    rejectLabel: 'Cancel',
    acceptProps: { severity: 'danger', size: 'small' },
    rejectProps: { severity: 'secondary', text: true, size: 'small' },
    accept: () => auth.revokeOtherSessions(),
  })
}
</script>

<template>
  <NxPanel :title="`Signed-in devices · ${auth.sessions.length}`" variant="flush">
    <template #action>
      <Button
        rounded
        size="small"
        severity="secondary"
        label="Sign out everywhere else"
        :disabled="otherCount === 0 || loading"
        @click="confirmRevokeOthers"
      />
    </template>

    <NxSkeletonRows v-if="loading && !auth.sessions.length" :rows="3" />
    <NxEmptyState v-else-if="!auth.sessions.length" title="No active sessions" body="Sign in on a device to see it here." />
    <div v-else>
      <div v-for="s in sessions" :key="s.id" class="session" :class="{ current: s.is_current }">
        <span class="dot" />
        <div class="body">
          <div class="head">
            <b>{{ describeAgent(s.device.user_agent) ?? s.device.name ?? s.name }}</b>
            <span v-if="s.is_current" class="tag on">This device</span>
            <span v-if="s.remember" class="tag">Remembered</span>
          </div>
          <div class="meta">
            <span v-if="s.device.ip_address" class="mono">{{ s.device.ip_address }}</span>
            <span>Active {{ relativeTime(s.last_used_at ?? s.created_at) }}</span>
            <span v-if="s.expires_at">Expires {{ formatDateTime(s.expires_at) }}</span>
          </div>
        </div>
        <Button
          rounded
          size="small"
          text
          severity="danger"
          :label="s.is_current ? 'Sign out' : 'Revoke'"
          @click="confirmRevoke(s, $event)"
        />
      </div>
    </div>
    <p class="note">
      Sessions are bearer tokens tied to a device. Revoke any you do not recognise — they stop working immediately.
    </p>
  </NxPanel>
</template>

<style scoped>
.session {
  display: grid;
  grid-template-columns: 10px minmax(0, 1fr) auto;
  gap: 14px;
  align-items: center;
  padding: 14px 0;
  border-top: 1px solid var(--line);
}

.dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: var(--ink-4);
}

.current .dot {
  background: var(--ok);
  box-shadow: 0 0 0 4px color-mix(in srgb, var(--ok) 22%, transparent);
}

.body {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}

.head {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px 10px;
}

b {
  font-weight: 600;
}

.tag {
  padding: 1px 8px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 600;
  color: var(--ink-2);
  background: var(--tint-2);
}

.tag.on {
  color: var(--ok);
  background: color-mix(in srgb, var(--ok) 16%, transparent);
}

.meta {
  display: flex;
  flex-wrap: wrap;
  gap: 2px 14px;
  font-size: 12px;
  color: var(--ink-3);
}

.mono {
  font-family: var(--font-mono);
}

.note {
  margin: 20px 0 0;
  font-size: 13px;
  color: var(--ink-3);
}
</style>
