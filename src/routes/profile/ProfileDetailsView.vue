<script setup lang="ts">
import { ref, watch } from 'vue'
import NexusAvatar from '@components/nexus-avatar/NexusAvatar.vue'
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

async function onSave(): Promise<void> {
  const trimmed = name.value.trim()
  if (!trimmed) return
  await users.updateProfile({ name: trimmed })
}
</script>

<template>
  <div class="flex flex-col gap-6 max-w-xl">
    <section class="flex items-center gap-4">
      <NexusAvatar :user="auth.user" size="xlarge" />
      <div class="flex flex-col gap-2 min-w-0">
        <p class="m-0 text-sm text-surface-400">
          Profile photo upload will arrive with Cloudinary.
        </p>
        <Button
          label="Upload photo"
          icon="pi pi-camera"
          severity="secondary"
          outlined
          disabled
          size="small"
        />
      </div>
    </section>

    <form class="flex flex-col gap-4" @submit.prevent="onSave">
      <div class="flex flex-col gap-2">
        <label for="profile-name" class="text-sm text-surface-300">Name</label>
        <InputText
          id="profile-name"
          v-model="name"
          class="w-full"
          fluid
          autocomplete="name"
        />
      </div>

      <div class="flex flex-col gap-2">
        <label for="profile-email" class="text-sm text-surface-300">Email</label>
        <InputText
          id="profile-email"
          :model-value="auth.user?.email ?? ''"
          class="w-full"
          fluid
          disabled
        />
        <span class="text-xs text-surface-500"
          >Email changes are not available yet.</span
        >
      </div>

      <Message
        v-if="users.message && users.status === Status.ERROR"
        severity="error"
        :closable="false"
      >
        {{ users.message }}
      </Message>

      <div>
        <Button
          type="submit"
          label="Save changes"
          icon="pi pi-check"
          :loading="users.status === Status.LOADING"
          :disabled="!name.trim() || name.trim() === auth.user?.name"
        />
      </div>
    </form>
  </div>
</template>
