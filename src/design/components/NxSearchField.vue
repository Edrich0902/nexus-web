<script setup lang="ts">
import { onBeforeUnmount, watch } from 'vue'
import NxIcon from './NxIcon.vue'

/**
 * Pill search input. Emits `search` on Enter and, when `debounce` is set,
 * after typing pauses.
 */
const props = withDefaults(
  defineProps<{
    placeholder?: string
    label?: string
    debounce?: number
  }>(),
  { placeholder: 'Search…', label: undefined, debounce: 0 },
)

const model = defineModel<string>({ default: '' })
const emit = defineEmits<{ search: [value: string] }>()

let timer: ReturnType<typeof setTimeout> | undefined

watch(model, (value) => {
  if (!props.debounce) return
  clearTimeout(timer)
  timer = setTimeout(() => emit('search', value.trim()), props.debounce)
})

onBeforeUnmount(() => clearTimeout(timer))

function submit(): void {
  clearTimeout(timer)
  emit('search', model.value.trim())
}

function clear(): void {
  model.value = ''
  submit()
}
</script>

<template>
  <label class="nx-search">
    <NxIcon name="search" :size="16" class="lead" />
    <input
      v-model="model"
      type="search"
      :placeholder="placeholder"
      :aria-label="label ?? placeholder"
      enterkeyhint="search"
      @keydown.enter.prevent="submit"
    />
    <button v-if="model" type="button" class="clear" aria-label="Clear search" @click="clear">
      <NxIcon name="close" :size="14" />
    </button>
  </label>
</template>

<style scoped>
.nx-search {
  position: relative;
  display: flex;
  align-items: center;
  flex: 1 1 260px;
  min-width: 0;
  max-width: 440px;
  height: 42px;
  border-radius: 999px;
  background: var(--tint);
  border: 1px solid transparent;
  transition:
    border-color 0.2s,
    background 0.2s;
}

.nx-search:focus-within {
  background: var(--tint-2);
  border-color: var(--line-strong);
}

.lead {
  position: absolute;
  left: 16px;
  color: var(--ink-3);
  pointer-events: none;
}

input {
  flex: 1;
  min-width: 0;
  height: 100%;
  padding: 0 40px 0 42px;
  border: 0;
  background: transparent;
  color: var(--ink);
  font: inherit;
  font-size: 14px;
  outline: none;
}

input::placeholder {
  color: var(--ink-4);
}

input::-webkit-search-cancel-button {
  display: none;
}

.clear {
  position: absolute;
  right: 8px;
  width: 28px;
  height: 28px;
  display: grid;
  place-items: center;
  border: 0;
  border-radius: 50%;
  background: transparent;
  color: var(--ink-3);
  cursor: pointer;
}

.clear:hover {
  background: var(--tint-2);
  color: var(--ink);
}

@media (max-width: 640px) {
  .nx-search {
    max-width: none;
    flex-basis: 100%;
  }
}
</style>
