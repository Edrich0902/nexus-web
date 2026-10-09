<script setup lang="ts">
import { computed } from 'vue'
import type { F1SessionSummary } from '@/types/f1/f1'
import { focusSession, sessionState, sessionWhen } from './f1'

/** A race weekend as a horizontal timeline in the viewer's timezone. */
const props = defineProps<{
  sessions: F1SessionSummary[]
  now: number
}>()

const items = computed(() => {
  const list = props.sessions.filter((s) => !s.is_cancelled)
  const focus = focusSession(list, props.now)
  return list.map((s) => ({
    session: s,
    state: sessionState(s, focus, props.now),
  }))
})

const STATE_LABEL = { done: 'Finished', live: 'Live now', next: 'Up next', upcoming: '' } as const
</script>

<template>
  <ol class="weekend" :style="{ '--n': items.length }">
    <li v-for="{ session, state } in items" :key="session.session_key" :class="`s-${state}`">
      <RouterLink :to="{ name: 'f1-session', params: { sessionKey: session.session_key } }" class="item">
        <b>{{ session.session_name }}</b>
        <span class="when">{{ sessionWhen(session.date_start) }}</span>
        <span v-if="STATE_LABEL[state]" class="state">{{ STATE_LABEL[state] }}</span>
      </RouterLink>
    </li>
  </ol>
</template>

<style scoped>
.weekend {
  display: grid;
  grid-template-columns: repeat(var(--n), minmax(0, 1fr));
  list-style: none;
  margin: 8px 0 0;
  padding: 0;
}

li {
  position: relative;
  border-top: 1px solid var(--line-strong);
  min-width: 0;
}

li::before {
  content: '';
  position: absolute;
  top: -5px;
  left: 0;
  width: 9px;
  height: 9px;
  border-radius: 50%;
  background: var(--amb);
  border: 1px solid var(--ink-3);
}

li.s-done::before {
  background: var(--ink-3);
  border-color: var(--ink-3);
}

li.s-next::before,
li.s-live::before {
  background: var(--acc);
  border-color: var(--acc);
  box-shadow: 0 0 0 5px color-mix(in srgb, var(--acc) 25%, transparent);
}

li.s-live::before {
  animation: nx-pulse 1.6s infinite;
}

.item {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 22px 16px 4px 0;
  color: inherit;
}

.item:hover b {
  text-decoration: underline;
  text-underline-offset: 3px;
}

b {
  font-size: 15px;
  font-weight: 600;
}

.s-done b {
  color: var(--ink-2);
}

.when {
  font-family: var(--font-mono);
  font-size: 12px;
  color: var(--ink-3);
}

.state {
  font-size: 12px;
  color: var(--ink-3);
}

.s-next .when,
.s-next .state,
.s-live .when,
.s-live .state {
  color: var(--acc);
}

@media (max-width: 640px) {
  .weekend {
    grid-template-columns: 1fr;
    margin-left: 4px;
  }

  li {
    border-top: 0;
    border-left: 1px solid var(--line-strong);
  }

  li::before {
    top: 16px;
    left: -5px;
  }

  .item {
    flex-direction: row;
    flex-wrap: wrap;
    align-items: baseline;
    column-gap: 10px;
    padding: 10px 0 10px 20px;
  }

  .state {
    margin-left: auto;
  }
}
</style>
