<script setup lang="ts">
import { useLayoutStore } from '@stores/layout/layout.store'

defineProps<{
  showToolbar?: boolean
  title?: string
}>()

const layout = useLayoutStore()
</script>

<template>
  <div class="w-full p-4 flex flex-col gap-y-2 flex-1 min-h-0">
    <div
      v-if="showToolbar"
      class="w-full flex flex-row justify-between items-center"
    >
      <div class="flex items-center gap-3 min-w-0">
        <button
          v-tooltip.bottom="layout.sidebarVisible ? 'Hide menu' : 'Show menu'"
          type="button"
          class="flex items-center justify-center w-10 h-10 rounded-lg cursor-pointer text-surface-300 hover:bg-surface-800 transition-colors shrink-0"
          @click="layout.toggleSidebar()"
        >
          <span class="pi pi-bars text-lg" />
        </button>
        <div class="text-2xl font-bold tracking-tight truncate text-surface-0">
          {{ title ?? '' }}
        </div>
      </div>
      <div class="flex flex-row items-center gap-x-2">
        <slot name="toolbar" />
      </div>
    </div>
    <slot />
  </div>
</template>
