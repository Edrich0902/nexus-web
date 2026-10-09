<script setup lang="ts">
import NexusAvatar from '@components/nexus-avatar/NexusAvatar.vue'
import { useAuthStore } from '@stores/auth/auth.store'
import NxIcon from '../NxIcon.vue'
import NxIconButton from '../NxIconButton.vue'
import { useCommandStore } from '../../command/command.store'

const auth = useAuthStore()
const command = useCommandStore()

const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.userAgent)
const shortcut = isMac ? '⌘K' : 'Ctrl K'
</script>

<template>
  <header class="nx-top">
    <RouterLink to="/home" class="nx-logo" aria-label="Nexus home">
      <i aria-hidden="true" />
      <span>Nexus</span>
    </RouterLink>

    <button type="button" class="nx-cmd-pill" @click="command.show()">
      <NxIcon name="search" />
      <span>Ask, find or log anything</span>
      <kbd>{{ shortcut }}</kbd>
    </button>

    <div class="nx-top-right">
      <div id="nx-top-context" class="nx-top-context" />
      <NxIconButton
        class="nx-top-search"
        icon="search"
        label="Search"
        tooltip="bottom"
        @click="command.show()"
      />
      <NexusAvatar v-if="auth.user" :user="auth.user" menu size="normal" />
    </div>
  </header>
</template>

<style scoped>
.nx-top {
  position: sticky;
  top: 0;
  z-index: 50;
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  gap: 16px;
  height: var(--shell-top);
  padding: 0 var(--page-pad);
  background: color-mix(in srgb, var(--amb) 82%, transparent);
  backdrop-filter: blur(18px) saturate(1.2);
  -webkit-backdrop-filter: blur(18px) saturate(1.2);
}

.nx-logo {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  font-weight: 600;
  font-size: 15px;
  letter-spacing: -0.01em;
  justify-self: start;
}

.nx-logo i {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: var(--acc);
}

.nx-cmd-pill {
  display: flex;
  align-items: center;
  gap: 10px;
  width: min(440px, 40vw);
  height: 40px;
  padding: 0 14px;
  border-radius: 999px;
  border: 1px solid var(--line);
  background: var(--tint);
  color: var(--ink-3);
  font-size: 13.5px;
  cursor: pointer;
  transition:
    background 0.2s,
    border-color 0.2s;
}

.nx-cmd-pill:hover {
  background: var(--tint-2);
  border-color: var(--line-strong);
}

.nx-cmd-pill span {
  flex: 1;
  text-align: left;
}

kbd {
  font-family: inherit;
  font-size: 11.5px;
  padding: 2px 7px;
  border-radius: 6px;
  border: 1px solid var(--line);
  color: var(--ink-3);
}

.nx-top-right {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 12px;
  min-width: 0;
}

.nx-top-context {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.nx-top-context:empty {
  display: none;
}

.nx-top-search {
  display: none;
}

@media (max-width: 960px) {
  .nx-top {
    grid-template-columns: auto 1fr auto;
  }

  .nx-cmd-pill {
    width: 100%;
    max-width: 360px;
    justify-self: center;
  }
}

@media (max-width: 640px) {
  .nx-top {
    grid-template-columns: auto 1fr;
  }

  .nx-cmd-pill {
    display: none;
  }

  .nx-top-search {
    display: inline-grid;
  }
}
</style>
