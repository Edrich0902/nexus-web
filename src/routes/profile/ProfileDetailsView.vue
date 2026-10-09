<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import NxPanel from '@design/components/NxPanel.vue'
import NxFacts from '@design/components/NxFacts.vue'
import NxIcon from '@design/components/NxIcon.vue'
import { formatDateTime } from '@lib/datetime'
import { useAuthStore } from '@stores/auth/auth.store'
import { useUsersStore } from '@stores/users/users.store'
import { Status } from '@/types/status'

const auth = useAuthStore()
const users = useUsersStore()

const name = ref(auth.user?.name ?? '')

watch(
  () => auth.user?.name,
  (value) => {
    if (value !== undefined) name.value = value
  },
)

onMounted(() => {
  if (!auth.sessions.length) void auth.fetchSessions()
})

const dirty = computed(() => Boolean(name.value.trim()) && name.value.trim() !== auth.user?.name)

async function onSave(): Promise<void> {
  if (!dirty.value) return
  await users.updateProfile({ name: name.value.trim() })
}

const facts = computed(() => [
  { label: 'Email', value: auth.user?.email ?? '—' },
  { label: 'Member since', value: formatDateTime(auth.user?.created_at ?? null) },
  { label: 'Last updated', value: formatDateTime(auth.user?.updated_at ?? null) },
  { label: 'Signed-in devices', value: auth.sessions.length ? String(auth.sessions.length) : '—' },
])
</script>

<template>
  <div class="details">
    <NxPanel title="Your details">
      <form id="profile-form" class="nx-form" @submit.prevent="onSave">
        <label class="f">
          <span>Name</span>
          <InputText v-model="name" autocomplete="name" />
        </label>
        <label class="f">
          <span>Email</span>
          <InputText :model-value="auth.user?.email ?? ''" disabled />
          <small class="hint">Email changes are not available yet.</small>
        </label>
        <p v-if="users.message && users.status === Status.ERROR" class="error" role="alert">{{ users.message }}</p>
        <div>
          <Button type="submit" rounded label="Save changes" :loading="users.status === Status.LOADING" :disabled="!dirty">
            <template #icon="{ class: iconClass }">
              <NxIcon name="check" :size="16" :class="iconClass" />
            </template>
          </Button>
        </div>
      </form>
    </NxPanel>

    <NxPanel title="Account" variant="flush">
      <NxFacts :items="facts" :cols="1" />
    </NxPanel>
  </div>
</template>

<style scoped>
.details {
  display: grid;
  grid-template-columns: minmax(0, 1.3fr) minmax(0, 1fr);
  gap: 40px;
  align-items: start;
}

.error {
  margin: 0;
  font-size: 14px;
  color: var(--bad);
}

@media (max-width: 960px) {
  .details {
    grid-template-columns: minmax(0, 1fr);
  }
}
</style>
