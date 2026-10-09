<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@stores/auth/auth.store'
import { Status } from '@/types/status'
import { moments } from '@design/tokens'
import { useAmbient } from '@design/ambient'
import NxIcon from '@design/components/NxIcon.vue'

const auth = useAuthStore()
const router = useRouter()
const route = useRoute()

const email = ref('')
const password = ref('')
const remember = ref(false)
const submitting = ref(false)

const now = ref(new Date())
let clock: ReturnType<typeof setInterval> | undefined
onMounted(() => {
  clock = setInterval(() => (now.value = new Date()), 30_000)
})
onBeforeUnmount(() => clearInterval(clock))

/** Greeting and ambient come from the local clock only — nothing personal before sign-in. */
const daypart = computed(() => {
  const h = now.value.getHours()
  if (h >= 5 && h < 12) return { word: 'morning', moment: moments.morning }
  if (h >= 12 && h < 17) return { word: 'afternoon', moment: moments.afternoon }
  return { word: 'evening', moment: moments.evening }
})
useAmbient(() => daypart.value.moment)

const clockLabel = computed(() =>
  now.value.toLocaleString(undefined, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }),
)

const sessionExpired = computed(() => route.query.reason === 'expired')
const busy = computed(() => submitting.value || auth.status === Status.LOADING)
const error = computed(() => (auth.status === Status.ERROR ? auth.message : ''))

async function onSubmit(): Promise<void> {
  if (!email.value.trim() || !password.value || busy.value) return

  submitting.value = true
  try {
    const success = await auth.login({
      email: email.value.trim(),
      password: password.value,
      remember: remember.value,
    })

    if (success) {
      const redirect = typeof route.query.redirect === 'string' ? route.query.redirect : null
      if (redirect && redirect.startsWith('/') && !redirect.startsWith('//')) {
        await router.replace(redirect)
      } else {
        await router.replace({ name: 'home' })
      }
    } else {
      password.value = ''
    }
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <div class="login">
    <div class="bloom" aria-hidden="true" />

    <header class="brand">
      <span class="dot" aria-hidden="true" />
      <span>Nexus</span>
    </header>

    <main class="stage">
      <section class="copy nx-rise">
        <p class="nx-eyebrow">{{ clockLabel }}</p>
        <h1>Good <em>{{ daypart.word }}</em>.</h1>
        <p class="lede">Sign in to pick up where you left off.</p>
      </section>

      <form class="form nx-rise" novalidate @submit.prevent="onSubmit">
        <Message v-if="sessionExpired && !error" severity="secondary" :closable="false" class="note">
          <template #icon><NxIcon name="clock" :size="16" /></template>
          Your session ended. Sign in again to continue.
        </Message>

        <div class="field">
          <label for="email">Email</label>
          <InputText
            id="email"
            v-model="email"
            type="email"
            autocomplete="username"
            inputmode="email"
            autocapitalize="off"
            spellcheck="false"
            required
            fluid
            :invalid="Boolean(error)"
          />
        </div>

        <div class="field">
          <label for="password">Password</label>
          <Password
            v-model="password"
            input-id="password"
            :feedback="false"
            toggle-mask
            fluid
            required
            autocomplete="current-password"
            :invalid="Boolean(error)"
          />
        </div>

        <label class="remember" for="remember">
          <ToggleSwitch v-model="remember" input-id="remember" />
          <span>Keep me signed in</span>
        </label>

        <Message v-if="error" severity="error" :closable="false" role="alert">
          {{ error }}
        </Message>

        <Button
          type="submit"
          label="Sign in"
          rounded
          severity="contrast"
          icon-pos="right"
          class="submit"
          :loading="busy"
        >
          <template #icon="{ class: iconClass }">
            <NxIcon name="arrow-right" :size="18" :class="iconClass" />
          </template>
        </Button>
      </form>
    </main>

    <footer class="foot nx-mono">Private hub · authorised access only</footer>
  </div>
</template>

<style scoped>
.login {
  position: relative;
  min-height: 100dvh;
  display: grid;
  grid-template-rows: auto 1fr auto;
  padding: 28px var(--page-pad);
  overflow: hidden;
  isolation: isolate;
}

.bloom {
  position: absolute;
  inset: -20%;
  z-index: -1;
  background:
    radial-gradient(40% 45% at 22% 38%, color-mix(in srgb, var(--acc) 22%, transparent), transparent 70%),
    radial-gradient(45% 50% at 85% 80%, var(--amb-2), transparent 70%);
  pointer-events: none;
  animation: drift 24s var(--ease) infinite alternate;
}

@keyframes drift {
  to {
    transform: translate3d(3%, -2%, 0) scale(1.05);
  }
}

.brand {
  display: flex;
  align-items: center;
  gap: 10px;
  font-weight: 700;
  font-size: 15px;
  letter-spacing: -0.01em;
}

.dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: var(--acc);
}

.stage {
  width: 100%;
  max-width: 1120px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: minmax(0, 1.25fr) minmax(320px, 400px);
  gap: 72px;
  align-items: center;
}

h1 {
  font-family: var(--font-serif);
  font-weight: 400;
  font-size: clamp(64px, 9vw, 128px);
  line-height: 0.95;
  letter-spacing: -0.025em;
  margin: 14px 0 18px;
}

h1 em {
  color: var(--acc);
}

.lede {
  font-size: 17px;
  color: var(--ink-2);
  margin: 0;
}

.form {
  display: flex;
  flex-direction: column;
  gap: 18px;
  padding: 28px;
  border-radius: var(--r-xxl);
  background: var(--surface);
  border: 1px solid var(--line);
  backdrop-filter: blur(18px);
  animation-delay: 0.08s;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.field label {
  font-size: 13px;
  font-weight: 500;
  color: var(--ink-2);
}

.remember {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 13.5px;
  color: var(--ink-2);
  cursor: pointer;
  user-select: none;
}

.submit {
  margin-top: 4px;
  height: 48px;
  font-weight: 600;
}

.note :deep(.p-message-text) {
  font-size: 13px;
}

.foot {
  font-size: 11.5px;
  color: var(--ink-4);
  text-align: center;
}

@media (prefers-reduced-motion: reduce) {
  .bloom {
    animation: none;
  }
}

@media (max-width: 960px) {
  .stage {
    grid-template-columns: minmax(0, 1fr);
    gap: 36px;
    max-width: 480px;
  }
}

@media (max-width: 640px) {
  .login {
    padding-top: 20px;
    padding-bottom: 20px;
  }

  .stage {
    align-items: start;
    padding-top: 8vh;
    gap: 28px;
  }

  h1 {
    font-size: clamp(56px, 16vw, 72px);
  }

  .lede {
    font-size: 15.5px;
  }

  .form {
    padding: 20px;
  }
}
</style>
