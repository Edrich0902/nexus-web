<script setup lang="ts">
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@stores/auth/auth.store'
import { Status } from '@/types/status'

const auth = useAuthStore()
const router = useRouter()
const route = useRoute()

const email = ref('')
const password = ref('')
const remember = ref(false)

const submitting = ref(false)

async function onSubmit(): Promise<void> {
  if (!email.value.trim() || !password.value) return

  submitting.value = true
  try {
    const success = await auth.login({
      email: email.value.trim(),
      password: password.value,
      remember: remember.value,
    })

    if (success) {
      const redirect =
        typeof route.query.redirect === 'string' ? route.query.redirect : null
      if (redirect && redirect.startsWith('/') && !redirect.startsWith('//')) {
        await router.replace(redirect)
      } else {
        await router.replace({ name: 'home' })
      }
    }
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <div class="login-terminal relative flex flex-col min-h-full w-full">
    <div class="login-terminal__atmosphere" aria-hidden="true" />
    <div class="login-terminal__grid" aria-hidden="true" />

    <header class="relative z-10 flex items-center gap-2 px-5 pt-4 text-sm text-surface-400">
      <span class="pi pi-window-maximize text-xs" />
      <span>Login Terminal</span>
    </header>

    <div class="relative z-10 flex flex-1 items-center justify-center px-4 py-10">
      <div class="login-card relative w-full max-w-md">
        <div class="login-card__wireframes" aria-hidden="true">
          <span class="wire wire--a" />
          <span class="wire wire--b" />
          <span class="wire wire--c" />
        </div>

        <div class="login-card__body">
          <div class="mb-8">
            <div class="flex items-center gap-2 mb-3">
              <span class="pi pi-code text-primary text-lg" />
              <h1 class="text-2xl font-semibold tracking-tight text-primary m-0">
                Nexus Hub
              </h1>
            </div>
            <p class="text-surface-0 text-base m-0 mb-1">Command Access</p>
            <p
              class="text-xs uppercase tracking-[0.14em] text-surface-400 m-0 font-mono"
            >
              Authorize terminal session
            </p>
          </div>

          <form class="flex flex-col gap-5" @submit.prevent="onSubmit">
            <div class="flex flex-col gap-2">
              <label
                for="email"
                class="flex items-center gap-2 text-sm text-surface-300"
              >
                <span class="pi pi-at text-xs" />
                Username / Email
              </label>
              <InputText
                id="email"
                v-model="email"
                type="email"
                autocomplete="username"
                placeholder="operator@nexus.hub"
                class="w-full"
                fluid
              />
            </div>

            <div class="flex flex-col gap-2">
              <label
                for="password"
                class="flex items-center gap-2 text-sm text-surface-300"
              >
                <span class="pi pi-key text-xs" />
                Secret Key
              </label>
              <Password
                id="password"
                v-model="password"
                :feedback="false"
                toggle-mask
                input-class="w-full"
                placeholder="•••••••••••"
                fluid
                autocomplete="current-password"
              />
            </div>

            <div class="flex items-center gap-2">
              <Checkbox
                v-model="remember"
                input-id="remember"
                binary
              />
              <label for="remember" class="text-sm text-surface-300 cursor-pointer">
                Persist Session
              </label>
            </div>

            <Message
              v-if="auth.message && auth.status === Status.ERROR"
              severity="error"
              :closable="false"
              class="w-full"
            >
              {{ auth.message }}
            </Message>

            <Button
              type="submit"
              label="Access Terminal"
              icon="pi pi-sign-in"
              icon-pos="right"
              class="login-card__submit w-full"
              :loading="submitting || auth.status === Status.LOADING"
            />
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.login-terminal {
  background: var(--coffee-bean);
}

.login-terminal__atmosphere {
  position: absolute;
  inset: 0;
  background:
    radial-gradient(
      ellipse 55% 45% at 50% 42%,
      color-mix(in srgb, var(--meadow-green) 18%, transparent),
      transparent 70%
    ),
    radial-gradient(
      ellipse 80% 60% at 50% 50%,
      color-mix(in srgb, #3a1020 55%, transparent),
      var(--coffee-bean) 75%
    );
  pointer-events: none;
}

.login-terminal__grid {
  position: absolute;
  inset: 0;
  background-image: radial-gradient(
    color-mix(in srgb, var(--lavender-blush) 16%, transparent) 1px,
    transparent 1px
  );
  background-size: 22px 22px;
  opacity: 0.35;
  pointer-events: none;
  mask-image: radial-gradient(ellipse 70% 60% at 50% 45%, black, transparent);
}

.login-card__body {
  position: relative;
  z-index: 1;
  padding: 2rem;
  border-radius: 1rem;
  background: color-mix(in srgb, var(--coffee-bean) 82%, #2a0f16);
  border: 1px solid color-mix(in srgb, var(--lavender-blush) 12%, transparent);
  box-shadow:
    0 24px 48px rgba(0, 0, 0, 0.45),
    inset 0 1px 0 color-mix(in srgb, var(--lavender-blush) 6%, transparent);
}

.login-card__wireframes {
  position: absolute;
  right: -4.5rem;
  top: 18%;
  width: 7rem;
  height: 7rem;
  pointer-events: none;
  z-index: 0;
}

@media (max-width: 640px) {
  .login-card__wireframes {
    display: none;
  }
}

.wire {
  position: absolute;
  inset: 0;
  border: 1.5px solid;
  border-radius: 0.35rem;
}

.wire--a {
  border-color: color-mix(in srgb, var(--blue-slate) 80%, white);
  transform: rotate(-18deg) translate(4px, -2px);
  opacity: 0.85;
}

.wire--b {
  border-color: color-mix(in srgb, var(--meadow-green) 75%, white);
  transform: rotate(8deg) translate(-2px, 6px);
  opacity: 0.7;
}

.wire--c {
  border-color: color-mix(in srgb, var(--lavender-blush) 35%, transparent);
  transform: rotate(-4deg);
  opacity: 0.5;
}

.login-card__submit {
  box-shadow: 0 0 24px color-mix(in srgb, var(--meadow-green) 35%, transparent);
}
</style>
