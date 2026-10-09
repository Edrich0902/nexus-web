<script setup lang="ts">
import { computed } from 'vue'
import type { RouteLocationRaw } from 'vue-router'

/**
 * One event on a timeline: mono time, a coloured node, and a card with a
 * coloured kind label, title, body, chips and any extra slot content.
 */
const props = withDefaults(
  defineProps<{
    time: string
    /** Node + kind colour. */
    color?: string
    kind?: string
    meta?: string
    title: string
    body?: string
    chips?: string[]
    to?: RouteLocationRaw
    /** Dashed card for planned / upcoming items. */
    future?: boolean
  }>(),
  {
    color: 'var(--acc)',
    kind: undefined,
    meta: undefined,
    body: undefined,
    chips: () => [],
    to: undefined,
    future: false,
  },
)

const tag = computed(() => (props.to ? 'RouterLink' : 'div'))
</script>

<template>
  <div class="nx-ev" :class="{ future }" :style="{ '--c': color }" role="listitem">
    <div class="t">{{ time }}</div>
    <div class="ln" aria-hidden="true" />
    <div class="bd">
      <component :is="tag" :to="to" class="card" :class="{ link: Boolean(to) }">
        <div v-if="kind || meta" class="w">
          <b v-if="kind">{{ kind }}</b><template v-if="kind && meta"> · </template>{{ meta }}
        </div>
        <h4>{{ title }}</h4>
        <p v-if="body">{{ body }}</p>
        <div v-if="chips.length" class="chips">
          <span v-for="chip in chips" :key="chip">{{ chip }}</span>
        </div>
        <slot />
      </component>
    </div>
  </div>
</template>

<style scoped>
.nx-ev {
  display: grid;
  grid-template-columns: 56px 24px minmax(0, 1fr);
}

.t {
  font-family: var(--font-mono);
  font-size: 11.5px;
  color: var(--ink-3);
  text-align: right;
  padding: 14px 8px 0 0;
  white-space: nowrap;
}

.ln {
  position: relative;
}

.ln::before {
  content: '';
  position: absolute;
  left: 11px;
  top: 0;
  bottom: 0;
  width: 1px;
  background: var(--line);
}

.ln::after {
  content: '';
  position: absolute;
  left: 7px;
  top: 17px;
  width: 9px;
  height: 9px;
  border-radius: 50%;
  background: var(--c);
  box-shadow: 0 0 0 4px var(--amb);
}

.bd {
  padding: 6px 0 12px 6px;
  min-width: 0;
}

.card {
  display: block;
  background: var(--tint);
  border-radius: var(--r-md);
  padding: 12px 14px;
  transition: background 0.2s;
}

.future .card {
  background: transparent;
  border: 1px dashed var(--line-strong);
}

.card.link:hover {
  background: var(--tint-2);
}

.w {
  font-size: 12px;
  color: var(--ink-3);
}

.w b {
  color: var(--c);
  font-weight: 600;
}

h4 {
  margin: 3px 0 0;
  font-size: 14.5px;
  font-weight: 600;
  letter-spacing: -0.01em;
  overflow-wrap: anywhere;
}

p {
  margin: 2px 0 0;
  font-size: 13px;
  color: var(--ink-2);
}

.chips {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
  margin-top: 9px;
}

.chips span {
  font-size: 12px;
  padding: 3px 9px;
  border-radius: 999px;
  background: color-mix(in srgb, var(--c) 22%, transparent);
}

@media (max-width: 640px) {
  .nx-ev {
    grid-template-columns: 42px 20px minmax(0, 1fr);
  }

  .ln::before {
    left: 9px;
  }

  .ln::after {
    left: 5px;
  }
}
</style>
