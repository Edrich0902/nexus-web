<script setup lang="ts">
import { RouterView, useRoute } from 'vue-router'
import AppSidebar from '@components/sidebar/AppSidebar.vue'
import { useLayoutStore } from '@stores/layout/layout.store'

const route = useRoute()
const layout = useLayoutStore()
</script>

<template>
  <Toast />
  <ConfirmPopup />

  <div
    class="flex flex-row items-stretch h-screen p-3 overflow-hidden bg-[var(--coffee-bean)]"
  >
    <div
      v-if="route.meta.showMenu"
      class="w-64 h-full shrink-0 transition-[margin,transform] duration-300 ease-in-out"
      :class="
        layout.sidebarVisible
          ? 'ml-0 mr-3 translate-x-0'
          : '-ml-64 mr-0 -translate-x-10'
      "
    >
      <AppSidebar />
    </div>

    <RouterView v-slot="{ Component }">
      <Transition name="fade" mode="out-in">
        <component
          :is="Component"
          class="overflow-auto flex flex-col flex-1 min-w-0"
        />
      </Transition>
    </RouterView>
  </div>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.18s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
