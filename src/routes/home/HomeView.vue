<script setup lang="ts">
import NexusPageWrapper from '@components/nexus-page-wrapper/NexusPageWrapper.vue'
import NexusHomeBrief from '@components/nexus-home-brief/NexusHomeBrief.vue'
import NexusSpotifyResumeCard from '@components/nexus-spotify-resume-card/NexusSpotifyResumeCard.vue'
import NexusSpotifyOnRepeat from '@components/nexus-spotify-on-repeat/NexusSpotifyOnRepeat.vue'
import NexusSpotifyTasteCard from '@components/nexus-spotify-taste-card/NexusSpotifyTasteCard.vue'
import NexusGithubPulseCard from '@components/nexus-github-pulse-card/NexusGithubPulseCard.vue'
import NexusGithubContributionsCard from '@components/nexus-github-contributions-card/NexusGithubContributionsCard.vue'
import NexusSportsPulseCard from '@components/nexus-sports-pulse-card/NexusSportsPulseCard.vue'
import NexusSportsSnapshotCard from '@components/nexus-sports-snapshot-card/NexusSportsSnapshotCard.vue'
import NexusF1PulseCard from '@components/nexus-f1-pulse-card/NexusF1PulseCard.vue'
import NexusAdminPulseCard from '@components/nexus-admin-pulse-card/NexusAdminPulseCard.vue'
import NexusFoodDrinkPulseCard from '@components/nexus-food-drink-pulse-card/NexusFoodDrinkPulseCard.vue'
import NexusLibraryPulseCard from '@components/nexus-library-pulse-card/NexusLibraryPulseCard.vue'
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

      <NexusHomeBrief />

      <div class="dashboard">
        <div class="col col-main">
          <NexusSpotifyResumeCard />
          <NexusF1PulseCard />
          <NexusSportsPulseCard />
          <NexusSpotifyTasteCard />
          <NexusSpotifyOnRepeat />
        </div>
        <div class="col col-ops">
          <NexusAdminPulseCard />
          <NexusFoodDrinkPulseCard />
          <NexusLibraryPulseCard />
          <NexusSportsSnapshotCard />
        </div>
        <div class="col col-dev">
          <NexusGithubContributionsCard />
          <NexusGithubPulseCard />
        </div>
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
  width: 100%;
  flex: 1;
  min-height: 0;
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
  grid-template-columns: minmax(0, 1.35fr) minmax(0, 1fr);
  gap: 1rem;
  align-items: start;
  width: 100%;
  flex: 1;
}

.col {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  min-width: 0;
}

.col > :deep(*) {
  width: 100%;
}

.col-ops,
.col-dev {
  grid-column: 2;
}

@media (min-width: 1400px) {
  .dashboard {
    grid-template-columns: minmax(0, 1.25fr) minmax(0, 1fr) minmax(0, 1fr);
  }

  .col-ops {
    grid-column: 2;
    grid-row: 1;
  }

  .col-dev {
    grid-column: 3;
    grid-row: 1;
  }
}

@media (max-width: 960px) {
  .dashboard {
    grid-template-columns: 1fr;
  }

  .col-ops,
  .col-dev {
    grid-column: 1;
  }
}
</style>
