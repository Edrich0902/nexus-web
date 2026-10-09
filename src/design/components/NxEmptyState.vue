<script setup lang="ts">
import NxIcon from './NxIcon.vue'
import type { IconName } from '../icons'

withDefaults(
  defineProps<{
    title: string
    body?: string
    icon?: IconName
    tone?: 'empty' | 'error'
  }>(),
  { body: undefined, icon: 'sparkles', tone: 'empty' },
)
</script>

<template>
  <div class="nx-empty" :class="`tone-${tone}`" :role="tone === 'error' ? 'alert' : undefined">
    <div class="ic"><NxIcon :name="icon" :size="22" /></div>
    <h3 class="nx-serif">{{ title }}</h3>
    <p v-if="body">{{ body }}</p>
    <div v-if="$slots.default" class="act"><slot /></div>
  </div>
</template>

<style scoped>
.nx-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 48px 20px;
  border-radius: var(--r-xl);
  border: 1px dashed var(--line-strong);
}

.ic {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  background: var(--tint);
  color: var(--acc);
}

.tone-error .ic {
  color: #ff8a7a;
}

h3 {
  font-size: 28px;
  font-weight: 400;
  margin: 14px 0 0;
}

p {
  margin: 6px 0 0;
  color: var(--ink-3);
  max-width: 44ch;
}

.act {
  margin-top: 18px;
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  justify-content: center;
}
</style>
