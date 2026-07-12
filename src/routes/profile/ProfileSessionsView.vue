<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useConfirm } from 'primevue/useconfirm'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@stores/auth/auth.store'
import { Status } from '@/types/status'
import type { DeviceSession } from '@/types/auth/device-session'

const auth = useAuthStore()
const confirm = useConfirm()
const router = useRouter()

const loading = computed(() => auth.sessionsStatus === Status.LOADING)
const otherCount = computed(
  () => auth.sessions.filter((s) => !s.is_current).length,
)

onMounted(() => {
  void auth.fetchSessions()
})

function formatDate(value: string | null): string {
  if (!value) return '—'
  try {
    return new Date(value).toLocaleString()
  } catch {
    return value
  }
}

function shortAgent(value: string | null): string {
  if (!value) return 'Unknown client'
  return value.length > 72 ? `${value.slice(0, 72)}…` : value
}

function confirmRevoke(session: DeviceSession, event: Event): void {
  confirm.require({
    target: event.currentTarget as HTMLElement,
    message: session.is_current
      ? 'Revoke this device and sign out now?'
      : 'Revoke access for this device?',
    icon: 'pi pi-exclamation-triangle',
    rejectProps: {
      label: 'Cancel',
      severity: 'secondary',
      outlined: true,
    },
    acceptProps: {
      label: 'Revoke',
      severity: 'danger',
    },
    accept: async () => {
      const result = await auth.revokeSession(session.id)
      if (result === 'signed-out') {
        await router.replace({ name: 'login' })
      }
    },
  })
}

function confirmRevokeOthers(event: Event): void {
  confirm.require({
    target: event.currentTarget as HTMLElement,
    message: `Sign out of ${otherCount.value} other session${otherCount.value === 1 ? '' : 's'}? This device stays signed in.`,
    icon: 'pi pi-info-circle',
    rejectProps: {
      label: 'Cancel',
      severity: 'secondary',
      outlined: true,
    },
    acceptProps: {
      label: 'Sign out others',
      severity: 'danger',
    },
    accept: async () => {
      await auth.revokeOtherSessions()
    },
  })
}
</script>

<template>
  <div class="flex flex-col gap-4">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <p class="m-0 text-sm text-surface-400 max-w-xl">
        Devices and browsers currently authorized for your Nexus Hub account.
      </p>
      <Button
        label="Sign out other sessions"
        icon="pi pi-sign-out"
        severity="secondary"
        outlined
        size="small"
        :disabled="otherCount === 0 || loading"
        @click="confirmRevokeOthers"
      />
    </div>

    <div v-if="loading && auth.sessions.length === 0" class="py-8 text-surface-400">
      Loading sessions…
    </div>

    <div v-else-if="auth.sessions.length === 0" class="py-8 text-surface-400">
      No active sessions found.
    </div>

    <ul v-else class="flex flex-col gap-3 list-none m-0 p-0">
      <li
        v-for="session in auth.sessions"
        :key="session.id"
        class="session-card"
      >
        <div class="flex flex-col sm:flex-row sm:items-start gap-3 justify-between">
          <div class="flex flex-col gap-1 min-w-0">
            <div class="flex items-center gap-2 flex-wrap">
              <span class="font-medium text-[var(--lavender-blush)]">{{
                session.device.name || session.name
              }}</span>
              <Tag
                v-if="session.is_current"
                value="Current"
                severity="success"
                rounded
              />
              <Tag
                v-if="session.remember"
                value="Remembered"
                severity="secondary"
                rounded
              />
            </div>
            <span class="text-xs text-surface-500 break-all">{{
              shortAgent(session.device.user_agent)
            }}</span>
            <div
              class="flex flex-wrap gap-x-4 gap-y-1 text-xs text-surface-400 mt-1"
            >
              <span>IP: {{ session.device.ip_address || '—' }}</span>
              <span>Last used: {{ formatDate(session.last_used_at) }}</span>
              <span>Expires: {{ formatDate(session.expires_at) }}</span>
            </div>
          </div>
          <Button
            label="Revoke"
            icon="pi pi-times"
            severity="danger"
            outlined
            size="small"
            class="shrink-0"
            @click="confirmRevoke(session, $event)"
          />
        </div>
      </li>
    </ul>
  </div>
</template>

<style scoped>
.session-card {
  padding: 1rem;
  border-radius: 0.75rem;
  background: var(--coffee-bean-panel);
  border: 1px solid color-mix(in srgb, var(--lavender-blush) 10%, transparent);
}
</style>
