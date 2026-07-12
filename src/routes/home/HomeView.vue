<script setup lang="ts">
import NexusPageWrapper from '@components/nexus-page-wrapper/NexusPageWrapper.vue'
import { useAuthStore } from '@stores/auth/auth.store'

const auth = useAuthStore()
</script>

<template>
  <NexusPageWrapper show-toolbar title="Home">
    <div class="flex flex-col gap-3 pt-2 max-w-2xl">
      <p class="text-surface-300 text-base m-0">
        Command station ready
        <span v-if="auth.user"> — welcome, {{ auth.user.name }}.</span>
      </p>
      <p class="text-surface-500 text-sm m-0">
        Module surfaces will appear here as they come online. Use the side menu
        to move between station pages.
      </p>
    </div>
  </NexusPageWrapper>
</template>
