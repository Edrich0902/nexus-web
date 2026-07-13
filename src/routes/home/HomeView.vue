<script setup lang="ts">
import NexusPageWrapper from '@components/nexus-page-wrapper/NexusPageWrapper.vue'
import NexusSpotifyResumeCard from '@components/nexus-spotify-resume-card/NexusSpotifyResumeCard.vue'
import NexusSpotifyOnRepeat from '@components/nexus-spotify-on-repeat/NexusSpotifyOnRepeat.vue'
import NexusSpotifyTasteCard from '@components/nexus-spotify-taste-card/NexusSpotifyTasteCard.vue'
import NexusGithubPulseCard from '@components/nexus-github-pulse-card/NexusGithubPulseCard.vue'
import NexusGithubContributionsCard from '@components/nexus-github-contributions-card/NexusGithubContributionsCard.vue'
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
      </header>

      <div class="dashboard">
        <div class="dashboard-main">
          <NexusSpotifyResumeCard />
          <NexusSpotifyTasteCard />
          <NexusSpotifyOnRepeat />
        </div>
        <aside class="dashboard-side">
          <NexusGithubContributionsCard />
          <NexusGithubPulseCard />
        </aside>
      </div>
    </div>
  </NexusPageWrapper>
</template>

<style scoped>
.home-page {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  padding-top: 0.5rem;
  padding-bottom: 2rem;
  max-width: 72rem;
  width: 100%;
}

.home-intro {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
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

.dashboard {
  display: grid;
  grid-template-columns: minmax(0, 1.55fr) minmax(17rem, 1fr);
  gap: 1rem;
  align-items: start;
}

.dashboard-main {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  min-width: 0;
}

.dashboard-side {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  min-width: 0;
}

@media (max-width: 960px) {
  .dashboard {
    grid-template-columns: 1fr;
  }
}
</style>
