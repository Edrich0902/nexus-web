<script setup lang="ts">
import NexusPageWrapper from '@components/nexus-page-wrapper/NexusPageWrapper.vue'
import NexusSpotifyResumeCard from '@components/nexus-spotify-resume-card/NexusSpotifyResumeCard.vue'
import NexusSpotifyOnRepeat from '@components/nexus-spotify-on-repeat/NexusSpotifyOnRepeat.vue'
import { useAuthStore } from '@stores/auth/auth.store'

const auth = useAuthStore()
</script>

<template>
  <NexusPageWrapper show-toolbar title="Home">
    <div class="home-page">
      <header class="home-intro">
        <p class="eyebrow">Command station</p>
        <h2>
          Welcome<span v-if="auth.user">, {{ auth.user.name }}</span>
        </h2>
        <p class="lede">
          Resume listening, then open modules from the side menu as they come
          online.
        </p>
      </header>

      <section class="widget-grid">
        <NexusSpotifyResumeCard />
        <NexusSpotifyOnRepeat />
      </section>
    </div>
  </NexusPageWrapper>
</template>

<style scoped>
.home-page {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  padding-top: 0.5rem;
  padding-bottom: 2rem;
  max-width: 52rem;
}

.home-intro {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.eyebrow {
  margin: 0;
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--light-green);
}

.home-intro h2 {
  margin: 0;
  font-size: clamp(1.5rem, 2.5vw, 1.9rem);
  font-weight: 700;
  letter-spacing: -0.02em;
}

.lede {
  margin: 0;
  max-width: 34rem;
  color: color-mix(in srgb, var(--lavender-blush) 58%, transparent);
  line-height: 1.45;
}

.widget-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1rem;
}
</style>
