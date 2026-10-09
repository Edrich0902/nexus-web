<script setup lang="ts">
import { computed, ref } from 'vue'
import { RouterView } from 'vue-router'
import NxStage from '@design/components/NxStage.vue'
import NxPillNav, { type PillNavItem } from '@design/components/NxPillNav.vue'
import NxIcon from '@design/components/NxIcon.vue'
import NexusImage from '@components/nexus-image/NexusImage.vue'
import NexusImageUploader from '@components/nexus-image-uploader/NexusImageUploader.vue'
import { useAuthStore } from '@stores/auth/auth.store'
import type { MediaImage } from '@/types/media/media'

const auth = useAuthStore()
const uploaderOpen = ref(false)

const nav: PillNavItem[] = [
  { key: 'details', label: 'Details', to: { name: 'profile' } },
  { key: 'sessions', label: 'Sessions', to: { name: 'profile-sessions' } },
]

const nameParts = computed(() => {
  const parts = (auth.user?.name ?? '').trim().split(/\s+/).filter(Boolean)
  if (parts.length < 2) return { title: parts[0] ?? 'Your', accent: parts.length ? '' : 'profile' }
  return { title: parts.slice(0, -1).join(' '), accent: parts[parts.length - 1] }
})

const initials = computed(() => {
  const parts = (auth.user?.name ?? '').trim().split(/\s+/).filter(Boolean)
  return (parts.length >= 2 ? `${parts[0]![0]}${parts[1]![0]}` : (parts[0] ?? '?').slice(0, 2)).toUpperCase()
})

const eyebrow = computed(() => {
  const since = auth.user?.created_at ? new Date(auth.user.created_at) : null
  if (!since || Number.isNaN(since.getTime())) return 'Profile'
  return `Profile · member since ${new Intl.DateTimeFormat(undefined, { month: 'long', year: 'numeric' }).format(since)}`
})

function onAvatar(image: MediaImage | null): void {
  if (!auth.user || !image) return
  auth.setUser({ ...auth.user, media: image })
}
</script>

<template>
  <div class="profile">
    <NxStage art="square" :eyebrow="eyebrow" :title="nameParts.title" :accent="nameParts.accent" :lede="auth.user?.email">
      <template #visual>
        <NexusImage
          v-if="auth.user?.media"
          :media="auth.user.media"
          variant="avatar"
          size="fill"
          fit="cover"
          :alt="auth.user.name"
        />
        <span v-else class="initials" aria-hidden="true">{{ initials }}</span>
      </template>
      <template #actions>
        <Button rounded severity="secondary" :label="auth.user?.media ? 'Change photo' : 'Add a photo'" @click="uploaderOpen = true">
          <template #icon="{ class: iconClass }">
            <NxIcon name="image" :size="16" :class="iconClass" />
          </template>
        </Button>
      </template>
    </NxStage>

    <NxPillNav :items="nav" label="Profile" />

    <RouterView />

    <NexusImageUploader
      v-model:visible="uploaderOpen"
      :model-value="auth.user?.media ?? null"
      collection="avatar"
      :attach-to="auth.user ? { type: 'user', id: auth.user.id } : null"
      header="Profile photo"
      @update:model-value="onAvatar"
    />
  </div>
</template>

<style scoped>
.profile {
  display: flex;
  flex-direction: column;
  gap: 36px;
}

.initials {
  display: grid;
  place-items: center;
  width: 100%;
  height: 100%;
  font-family: var(--font-serif);
  font-size: clamp(48px, 8vw, 96px);
  color: var(--amb);
  background: var(--acc);
}

@media (max-width: 640px) {
  .profile {
    gap: 24px;
  }

  .initials {
    font-size: 40px;
  }
}
</style>
