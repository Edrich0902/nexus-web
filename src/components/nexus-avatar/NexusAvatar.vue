<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref } from 'vue'
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
    /** When true, click opens the account panel */
    menu?: boolean
  }>(),
  {
    user: null,
    size: 'large',
    menu: false,
  },
)

/** An armed sign-out quietly disarms if left alone this long. */
const DISARM_MS = 6000

const auth = useAuthStore()
const router = useRouter()
const panel = ref()
const confirmButton = ref<HTMLButtonElement>()
const signOutButton = ref<HTMLButtonElement>()
const confirmBlock = ref<HTMLElement>()
const open = ref(false)
const armed = ref(false)
const held = ref(false)
const signingOut = ref(false)
let disarmTimer: ReturnType<typeof setTimeout> | undefined

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

const links = computed<{ key: string; label: string; icon: IconName; to: string }[]>(() => {
  const byKey = new Map(secondaryDestinations.map((d) => [d.key, d]))
  const profile = byKey.get('profile')
  return [
    ...(profile ? [{ key: profile.key, label: profile.label, icon: profile.icon, to: profile.to }] : []),
    { key: 'sessions', label: 'Signed-in devices', icon: 'smartphone', to: '/profile/sessions' },
    ...secondaryDestinations
      .filter((d) => d.key !== 'profile')
      .map((d) => ({ key: d.key, label: d.label, icon: d.icon, to: d.to })),
  ]
})

function toggle(event: Event): void {
  if (!props.menu) return
  panel.value?.toggle(event)
}

function clearDisarm(): void {
  if (disarmTimer) clearTimeout(disarmTimer)
  disarmTimer = undefined
}

function disarm(): void {
  clearDisarm()
  armed.value = false
  held.value = false
}

async function arm(): Promise<void> {
  armed.value = true
  held.value = false
  clearDisarm()
  disarmTimer = setTimeout(() => void cancel(), DISARM_MS)
  await nextTick()
  confirmButton.value?.focus()
}

/** Disarm and keep keyboard focus inside the panel. */
async function cancel(): Promise<void> {
  const hadFocus = confirmBlock.value?.contains(document.activeElement) ?? false
  disarm()
  await nextTick()
  if (open.value && hadFocus) signOutButton.value?.focus()
}

function hold(): void {
  held.value = true
  clearDisarm()
}

function go(to: string): void {
  panel.value?.hide()
  void router.push(to)
}

async function signOut(): Promise<void> {
  if (signingOut.value) return
  clearDisarm()
  signingOut.value = true
  try {
    await auth.logout()
    panel.value?.hide()
    await router.replace({ name: 'login' })
  } finally {
    signingOut.value = false
  }
}

function onHide(): void {
  open.value = false
  disarm()
}

onBeforeUnmount(clearDisarm)
</script>

<template>
  <div class="nexus-avatar">
    <component
      :is="menu ? 'button' : 'span'"
      :type="menu ? 'button' : undefined"
      class="face"
      :class="[`s-${size}`, { clickable: menu, open }]"
      :aria-label="menu ? 'Account' : undefined"
      :aria-haspopup="menu ? 'dialog' : undefined"
      :aria-expanded="menu ? open : undefined"
      @click="toggle"
    >
      <NexusImage
        v-if="hasImage && user?.media"
        :media="user.media"
        variant="avatar"
        size="fill"
        fit="cover"
        :alt="menu ? '' : user.name"
      />
      <span v-else aria-hidden="true">{{ initials }}</span>
    </component>

    <Popover
      v-if="menu"
      ref="panel"
      class="nx-account-pop"
      @show="open = true"
      @hide="onHide"
    >
      <div class="account" role="dialog" aria-label="Account">
        <header class="who">
          <span class="face s-large" aria-hidden="true">
            <NexusImage
              v-if="hasImage && user?.media"
              :media="user.media"
              variant="avatar"
              size="fill"
              fit="cover"
            />
            <span v-else>{{ initials }}</span>
          </span>
          <span class="who-text">
            <span class="who-name">{{ user?.name ?? 'Account' }}</span>
            <span v-if="user?.email" class="who-email">{{ user.email }}</span>
          </span>
        </header>

        <nav class="links" aria-label="Account">
          <a
            v-for="link in links"
            :key="link.key"
            :href="router.resolve(link.to).href"
            class="row"
            @click.prevent="go(link.to)"
          >
            <NxIcon :name="link.icon" :size="16" />
            <span>{{ link.label }}</span>
          </a>
        </nav>

        <div class="out">
          <button
            v-if="!armed"
            ref="signOutButton"
            type="button"
            class="row sign-out"
            @click="arm"
          >
            <NxIcon name="log-out" :size="16" />
            <span>Sign out</span>
          </button>
          <div
            v-else
            ref="confirmBlock"
            class="confirm"
            :class="{ held }"
            :style="{ '--disarm': `${DISARM_MS}ms` }"
            @pointerenter="hold"
            @keydown.esc.stop="cancel"
          >
            <p class="confirm-text">Sign out of Nexus on this device?</p>
            <div class="confirm-actions">
              <button type="button" class="pill ghost" :disabled="signingOut" @click="cancel">Stay</button>
              <button
                ref="confirmButton"
                type="button"
                class="pill danger"
                :disabled="signingOut"
                @click="signOut"
              >
                <NxIcon name="log-out" :size="14" />
                {{ signingOut ? 'Signing out…' : 'Sign out' }}
              </button>
            </div>
            <span class="drain" aria-hidden="true" />
          </div>
        </div>
      </div>
    </Popover>
  </div>
</template>

<style scoped>
.nexus-avatar {
  display: inline-flex;
  align-items: center;
}

.face {
  position: relative;
  display: inline-grid;
  place-items: center;
  flex: none;
  padding: 0;
  border: 0;
  border-radius: 50%;
  overflow: hidden;
  background: color-mix(in srgb, var(--acc) 22%, transparent);
  color: var(--acc);
  font: inherit;
  font-weight: 600;
  line-height: 1;
}

.s-normal {
  width: 32px;
  height: 32px;
  font-size: 12.5px;
}

.s-large {
  width: 44px;
  height: 44px;
  font-size: 15px;
}

.s-xlarge {
  width: 64px;
  height: 64px;
  font-size: 22px;
}

.face :deep(.nexus-image) {
  width: 100%;
  height: 100%;
  border-radius: 50%;
}

.clickable {
  cursor: pointer;
  transition: box-shadow 0.2s var(--ease);
}

.clickable:hover,
.clickable.open {
  box-shadow: 0 0 0 2px color-mix(in srgb, var(--acc) 45%, transparent);
}

.clickable:focus-visible {
  outline: 2px solid var(--acc);
  outline-offset: 2px;
}

.account {
  width: 264px;
  display: flex;
  flex-direction: column;
}

.who {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 10px 14px;
}

.who-text {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.who-name {
  font-family: var(--font-serif);
  font-size: 20px;
  line-height: 1.15;
  letter-spacing: -0.01em;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.who-email {
  font-size: 12.5px;
  color: var(--ink-3);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.links {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 6px 0;
  border-top: 1px solid var(--line);
}

.row {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 9px 10px;
  border: 0;
  border-radius: var(--r-sm);
  background: transparent;
  color: var(--ink-2);
  font: inherit;
  font-size: 14px;
  text-align: left;
  text-decoration: none;
  cursor: pointer;
  transition:
    background 0.15s,
    color 0.15s;
}

.row:hover,
.row:focus-visible {
  background: var(--tint-2);
  color: var(--ink);
  outline: none;
}

.out {
  padding-top: 6px;
  border-top: 1px solid var(--line);
}

.sign-out:hover,
.sign-out:focus-visible {
  color: var(--bad);
  background: color-mix(in srgb, var(--bad) 12%, transparent);
}

.confirm {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 12px 10px 14px;
  border-radius: var(--r-md);
  background: color-mix(in srgb, var(--bad) 14%, transparent);
  overflow: hidden;
}

.confirm-text {
  margin: 0;
  font-size: 13.5px;
  color: var(--ink);
}

.confirm-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

.pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 32px;
  padding: 0 14px;
  border: 0;
  border-radius: 999px;
  font: inherit;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition:
    background 0.15s,
    filter 0.15s;
}

.pill:disabled {
  opacity: 0.6;
  cursor: progress;
}

.pill:focus-visible {
  outline: 2px solid var(--ink);
  outline-offset: 2px;
}

.ghost {
  background: transparent;
  color: var(--ink-2);
}

.ghost:hover:not(:disabled) {
  background: var(--tint-2);
  color: var(--ink);
}

.danger {
  background: var(--bad);
  color: color-mix(in srgb, var(--bad) 15%, black);
}

.danger:hover:not(:disabled) {
  filter: brightness(1.08);
}

.drain {
  position: absolute;
  left: 0;
  bottom: 0;
  height: 2px;
  width: 100%;
  background: var(--bad);
  transform-origin: left;
  animation: drain var(--disarm) linear forwards;
}

.held .drain {
  opacity: 0;
  transition: opacity 0.2s;
}

@keyframes drain {
  to {
    transform: scaleX(0);
  }
}

.sign-out,
.confirm {
  animation: swap-in 0.24s var(--ease);
}

@keyframes swap-in {
  from {
    opacity: 0;
    transform: translateY(4px) scale(0.98);
  }
}

:global(.nx-account-pop .p-popover-content) {
  padding: 6px;
}
</style>
