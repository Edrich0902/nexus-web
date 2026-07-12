import { defineStore } from 'pinia'
import { ref } from 'vue'

const SIDEBAR_STORAGE_KEY = 'nexus-sidebar-visible'

function readSidebarVisible(): boolean {
  const raw = localStorage.getItem(SIDEBAR_STORAGE_KEY)
  if (raw === null) return true
  return raw === 'true'
}

export const useLayoutStore = defineStore('layout', () => {
  const sidebarVisible = ref(readSidebarVisible())

  function toggleSidebar(): void {
    sidebarVisible.value = !sidebarVisible.value
    localStorage.setItem(SIDEBAR_STORAGE_KEY, String(sidebarVisible.value))
  }

  function setSidebarVisible(visible: boolean): void {
    sidebarVisible.value = visible
    localStorage.setItem(SIDEBAR_STORAGE_KEY, String(visible))
  }

  return {
    sidebarVisible,
    toggleSidebar,
    setSidebarVisible,
  }
})
