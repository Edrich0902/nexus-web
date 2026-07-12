<script setup lang="ts">
import { computed, ref } from 'vue'
import type { MenuItem } from 'primevue/menuitem'
import { useConfirm } from 'primevue/useconfirm'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@stores/auth/auth.store'
import type { User } from '@/types/user/user'

const props = withDefaults(
  defineProps<{
    user?: User | null
    size?: 'normal' | 'large' | 'xlarge'
    /** When true, click opens Profile + Logout popup menu */
    menu?: boolean
  }>(),
  {
    user: null,
    size: 'large',
    menu: false,
  },
)

const auth = useAuthStore()
const confirm = useConfirm()
const router = useRouter()
const menuRef = ref()

const initials = computed(() => {
  const name = props.user?.name?.trim()
  if (!name) return '?'
  const parts = name.split(/\s+/).filter(Boolean)
  if (parts.length >= 2) {
    return `${parts[0]![0]}${parts[1]![0]}`.toUpperCase()
  }
  return name.slice(0, 2).toUpperCase()
})

/** Reserved for future NexusImage / Cloudinary when profile_public_id is live */
const hasImage = computed(() => false)

const menuItems = ref<MenuItem[]>([
  {
    label: 'Account',
    items: [
      {
        label: 'Profile',
        icon: 'pi pi-user',
        command: () => {
          void router.push({ name: 'profile' })
        },
      },
      {
        label: 'Logout',
        icon: 'pi pi-sign-out',
        command: (event) => {
          void handleSignOut(event)
        },
      },
    ],
  },
])

function onAvatarClick(event: Event): void {
  if (!props.menu) return
  menuRef.value?.toggle(event)
}

async function handleSignOut(event: { originalEvent?: Event }): Promise<void> {
  const target =
    (event.originalEvent?.currentTarget as HTMLElement | undefined) ??
    undefined

  confirm.require({
    target,
    message: 'End this terminal session?',
    icon: 'pi pi-info-circle',
    rejectProps: {
      label: 'Cancel',
      severity: 'secondary',
      outlined: true,
    },
    acceptProps: {
      label: 'Logout',
      severity: 'danger',
    },
    accept: async () => {
      await auth.logout()
      await router.replace({ name: 'login' })
    },
  })
}
</script>

<template>
  <div class="nexus-avatar inline-flex items-center">
    <Avatar
      :label="hasImage ? undefined : initials"
      :size="size"
      shape="circle"
      class="nexus-avatar__face"
      :class="{ 'nexus-avatar__face--clickable': menu }"
      @click="onAvatarClick"
    >
      <!-- Future: <NexusImage v-if="user?.profile_public_id" :public-id="user.profile_public_id" /> -->
      <slot v-if="hasImage" name="image" />
    </Avatar>

    <Menu
      v-if="menu"
      ref="menuRef"
      :model="menuItems"
      :popup="true"
      class="nexus-avatar__menu"
    />
  </div>
</template>

<style scoped>
.nexus-avatar__face {
  background: color-mix(in srgb, var(--bubblegum-pink) 22%, transparent);
  color: var(--bubblegum-pink);
  font-weight: 600;
  overflow: hidden;
}

.nexus-avatar__face--clickable {
  cursor: pointer;
}

.nexus-avatar__face--clickable:hover {
  box-shadow: 0 0 0 2px color-mix(in srgb, var(--bubblegum-pink) 45%, transparent);
}

.nexus-avatar__img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
</style>
