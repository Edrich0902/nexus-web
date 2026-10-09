<script setup lang="ts">
/**
 * Browse a collection by a shared trait (tasting note, author, tag): pressing
 * a chip lights up matching items; pressing it again clears the filter.
 */
withDefaults(defineProps<{ options: string[]; label?: string }>(), { label: 'Notes' })

const model = defineModel<string | null>({ default: null })

function toggle(option: string): void {
  model.value = model.value === option ? null : option
}
</script>

<template>
  <div v-if="options.length" class="nx-note-filter" role="group" :aria-label="`Filter by ${label.toLowerCase()}`">
    <span class="label">{{ label }}</span>
    <div class="chips">
      <button
        v-for="option in options"
        :key="option"
        type="button"
        class="chip"
        :aria-pressed="model === option"
        @click="toggle(option)"
      >
        {{ option }}
      </button>
    </div>
  </div>
</template>

<style scoped>
.nx-note-filter {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}

.label {
  flex-shrink: 0;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--ink-3);
}

.chips {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  min-width: 0;
}

.chip {
  padding: 6px 12px;
  border-radius: 999px;
  border: 1px solid var(--line);
  background: var(--tint);
  color: var(--ink-2);
  font: inherit;
  font-size: 13px;
  line-height: 1.2;
  cursor: pointer;
  transition:
    background 0.2s,
    color 0.2s,
    border-color 0.2s;
}

.chip:hover {
  color: var(--ink);
  border-color: var(--line-strong, var(--line));
}

.chip[aria-pressed='true'] {
  background: var(--acc);
  border-color: var(--acc);
  color: var(--amb);
  font-weight: 600;
}

.chip:focus-visible {
  outline: 2px solid var(--acc);
  outline-offset: 2px;
}

@media (max-width: 640px) {
  .nx-note-filter {
    align-items: flex-start;
    flex-direction: column;
    gap: 8px;
  }

  .chips {
    flex-wrap: nowrap;
    max-width: 100%;
    overflow-x: auto;
    scrollbar-width: none;
    padding-bottom: 2px;
  }

  .chip {
    flex-shrink: 0;
  }
}
</style>
