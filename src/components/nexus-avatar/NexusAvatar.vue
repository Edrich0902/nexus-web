<script setup lang="ts">
import { computed, ref } from 'vue'
import type { MenuItem } from 'primevue/menuitem'
import { useConfirm } from 'primevue/useconfirm'
import { useRouter } from 'vue-router'
import NexusImage from '@components/nexus-image/NexusImage.vue'
import NxIcon from '@design/components/NxIcon.vue'
import type { IconName } from '@design/icons'
import { secondaryDestinations } from '@design/navigation'
import { useAuthStore } from '@stores/auth/auth.store'
import type { User } from '@/types/user/user'

const props = withDefaults(
  defineProps<{
    user?: User | null
    size?: 'normal' | 'large' | 'xlarge'
    /** When true, click opens the account menu */
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
const faceRef = ref()

const initials = computed(() => {
  const name = props.user?.name?.trim()
  if (!name) return '?'
  const parts = name.split(/\s+/).filter(Boolean)
  if (parts.length >= 2) {
    return `${parts[0]![0]}${parts[1]![0]}`.toUpperCase()
  }
  return name.slice(0, 2).toUpperCase()
})

const hasImage = computed(() => Boolean(props.user?.media?.public_id))

const menuItems = computed<(MenuItem & { nxIcon?: IconName })[]>(() => [
  {
    label: props.user?.name ?? 'Account',
    items: [
      ...secondaryDestinations.map((dest) => ({
        label: dest.label,
        nxIcon: dest.icon,
        command: () => {
          void router.push(dest.to)
        },
      })),
      { separator: true },
      {
        label: 'Sign out',
        nxIcon: 'log-out' as const,
        command: () => handleSignOut(),
      },
    ],
  },
])

function onAvatarClick(event: Event): void {
  if (!props.menu) return
  menuRef.value?.toggle(event)
}

function handleSignOut(): void {
  confirm.require({
    target: (faceRef.value?.$el as HTMLElement | undefined) ?? undefined,
    message: 'Sign out of Nexus on this device?',
    rejectProps: { label: 'Cancel', severity: 'secondary' },
    acceptProps: { label: 'Sign out', severity: 'danger' },
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
      ref="faceRef"
      :label="hasImage ? undefined : initials"
      :size="size"
      shape="circle"
      class="nexus-avatar__face"
      :class="{ 'nexus-avatar__face--clickable': menu }"
      :role="menu ? 'button' : undefined"
      :tabindex="menu ? 0 : undefined"
      :aria-label="menu ? 'Account menu' : undefined"
      aria-haspopup="menu"
      @click="onAvatarClick"
      @keydown.enter.prevent="onAvatarClick"
      @keydown.space.prevent="onAvatarClick"
    >
      <NexusImage
        v-if="hasImage && user?.media"
        :media="user.media"
        variant="avatar"
        size="fill"
        fit="cover"
        :alt="user.name"
      />
    </Avatar>

    <Menu v-if="menu" ref="menuRef" :model="menuItems" :popup="true" class="nexus-avatar__menu">
      <template #item="{ item, props: itemProps }">
        <a class="nexus-avatar__item" v-bind="itemProps.action">
          <NxIcon v-if="item.nxIcon" :name="item.nxIcon" :size="16" />
          <span>{{ item.label }}</span>
        </a>
      </template>
    </Menu>
  </div>
</template>

<style scoped>
.nexus-avatar__face {
  background: color-mix(in srgb, var(--acc) 22%, transparent);
  color: var(--acc);
  font-weight: 600;
  overflow: hidden;
}

.nexus-avatar__face--clickable {
  cursor: pointer;
}

.nexus-avatar__face--clickable:hover {
  box-shadow: 0 0 0 2px color-mix(in srgb, var(--acc) 45%, transparent);
}

.nexus-avatar :deep(.nexus-image) {
  width: 100%;
  height: 100%;
  border-radius: 999px;
}

.nexus-avatar__item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 12px;
  color: var(--ink);
  cursor: pointer;
}
</style>
