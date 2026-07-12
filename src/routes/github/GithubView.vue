<script setup lang="ts">
import { onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useConfirm } from 'primevue/useconfirm'
import NexusPageWrapper from '@components/nexus-page-wrapper/NexusPageWrapper.vue'
import NexusGithubChrome from '@components/nexus-github-chrome/NexusGithubChrome.vue'
import NexusGithubIcon from '@components/nexus-github-icon/NexusGithubIcon.vue'
import { useGithubStore } from '@stores/github/github.store'

const github = useGithubStore()
const route = useRoute()
const router = useRouter()
const confirm = useConfirm()

onMounted(async () => {
  const connected =
    typeof route.query.connected === 'string' ? route.query.connected : null
  const error = typeof route.query.error === 'string' ? route.query.error : null

  if (connected !== null) {
    await github.handleOAuthReturn(connected, error)
    await router.replace({ name: 'github', query: {} })
    return
  }

  await github.loadHub()
})

function disconnectConfirm(event: Event): void {
  confirm.require({
    target: event.currentTarget as HTMLElement,
    message: 'Disconnect GitHub from Nexus?',
    icon: 'pi pi-exclamation-triangle',
    rejectProps: {
      label: 'Cancel',
      severity: 'secondary',
      outlined: true,
    },
    acceptProps: {
      label: 'Disconnect',
      severity: 'danger',
    },
    accept: () => {
      void github.disconnect()
    },
  })
}

function formatDate(value: string | null): string {
  if (!value) return '—'
  return new Date(value).toLocaleString()
}
</script>

<template>
  <NexusPageWrapper show-toolbar title="GitHub">
    <template #toolbar>
      <div class="toolbar-actions">
        <template v-if="github.connected">
          <Button
            label="Sync"
            icon="pi pi-sync"
            severity="secondary"
            text
            :loading="github.syncPending"
            @click="github.syncNow()"
          />
          <Button
            label="Disconnect"
            icon="pi pi-times"
            severity="danger"
            text
            @click="disconnectConfirm"
          />
        </template>
      </div>
    </template>

    <div class="github-page">
      <NexusGithubChrome>
        <Message
          v-if="github.needsReauth"
          severity="warn"
          :closable="false"
          class="reauth-banner"
        >
          GitHub needs re-authorization.
          <Button
            label="Reconnect"
            size="small"
            class="ml-2"
            @click="github.connect()"
          />
        </Message>

        <section
          v-if="!github.connected && !github.statusLoading"
          class="connect-hero"
        >
          <div class="connect-mark">
            <NexusGithubIcon :size="36" />
          </div>
          <div class="connect-copy">
            <h2>Link GitHub</h2>
            <p>
              Browse your repositories, review pull request diffs, and merge
              from Nexus.
            </p>
            <Button
              label="Connect GitHub"
              icon="pi pi-link"
              @click="github.connect()"
            />
          </div>
        </section>

        <template v-else-if="github.connected">
          <section v-if="github.profile" class="profile-strip">
            <img
              v-if="github.profile.avatar_url"
              :src="github.profile.avatar_url"
              :alt="github.profile.login ?? 'avatar'"
              class="avatar"
            />
            <div class="profile-copy">
              <h2>{{ github.profile.name || github.profile.login }}</h2>
              <p v-if="github.profile.login">@{{ github.profile.login }}</p>
              <p v-if="github.profile.bio" class="bio">{{ github.profile.bio }}</p>
              <div class="meta">
                <span v-if="github.profile.public_repos != null">
                  {{ github.profile.public_repos }} public
                </span>
                <span v-if="github.profile.total_private_repos != null">
                  {{ github.profile.total_private_repos }} private
                </span>
                <span v-if="github.status?.last_synced_at">
                  Synced {{ formatDate(github.status.last_synced_at) }}
                </span>
              </div>
            </div>
            <a
              v-if="github.profile.html_url"
              :href="github.profile.html_url"
              target="_blank"
              rel="noopener noreferrer"
              class="external"
            >
              Open on GitHub
            </a>
          </section>

          <section class="repos-section">
            <div class="section-head">
              <h3>Repositories</h3>
              <span class="count">{{ github.repos.length }}</span>
            </div>

            <div v-if="github.reposLoading" class="empty">Loading repositories…</div>
            <div v-else-if="github.repos.length === 0" class="empty">
              No repositories synced yet. Hit Sync to pull from GitHub.
            </div>
            <ul v-else class="repo-list">
              <li v-for="repo in github.repos" :key="repo.id">
                <router-link
                  :to="{
                    name: 'github-repo',
                    params: { owner: repo.owner, repo: repo.name },
                  }"
                  class="repo-row"
                >
                  <div class="repo-main">
                    <strong>{{ repo.full_name }}</strong>
                    <span v-if="repo.private" class="badge">Private</span>
                    <span v-else class="badge badge-public">Public</span>
                  </div>
                  <p v-if="repo.description" class="desc">{{ repo.description }}</p>
                  <div class="repo-meta">
                    <span v-if="repo.language">{{ repo.language }}</span>
                    <span>Pushed {{ formatDate(repo.pushed_at) }}</span>
                  </div>
                </router-link>
              </li>
            </ul>
          </section>
        </template>
      </NexusGithubChrome>
    </div>
  </NexusPageWrapper>
</template>

<style scoped>
.github-page {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  padding-top: 0.5rem;
  padding-bottom: 2rem;
}

.toolbar-actions {
  display: flex;
  gap: 0.25rem;
}

.connect-hero {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 1.25rem;
  align-items: center;
  padding: 1.5rem;
  border-radius: 1rem;
  background: var(--github-card-surface);
  border: 1px solid color-mix(in srgb, var(--lavender-blush) 10%, transparent);
}

@media (max-width: 640px) {
  .connect-hero {
    grid-template-columns: 1fr;
  }
}

.connect-mark {
  width: 4.5rem;
  height: 4.5rem;
  border-radius: 1rem;
  display: grid;
  place-items: center;
  color: var(--github-ink);
  background: color-mix(in srgb, var(--github-black) 55%, transparent);
  border: 1px solid color-mix(in srgb, var(--github-ink) 25%, transparent);
}

.connect-copy h2 {
  margin: 0 0 0.35rem;
  font-size: 1.45rem;
}

.connect-copy p {
  margin: 0 0 1rem;
  max-width: 36rem;
  color: color-mix(in srgb, var(--lavender-blush) 65%, transparent);
  line-height: 1.45;
}

.profile-strip {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  align-items: center;
  padding: 1.1rem 1.25rem;
  border-radius: 1rem;
  background: var(--github-card-surface);
  border: 1px solid color-mix(in srgb, var(--lavender-blush) 10%, transparent);
}

.avatar {
  width: 3.5rem;
  height: 3.5rem;
  border-radius: 999px;
  object-fit: cover;
}

.profile-copy {
  flex: 1;
  min-width: 12rem;
}

.profile-copy h2 {
  margin: 0;
  font-size: 1.25rem;
}

.profile-copy p {
  margin: 0.15rem 0 0;
  color: color-mix(in srgb, var(--lavender-blush) 65%, transparent);
}

.bio {
  max-width: 40rem;
}

.meta {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  margin-top: 0.5rem;
  font-size: 0.85rem;
  color: color-mix(in srgb, var(--lavender-blush) 55%, transparent);
}

.external {
  color: var(--github-ink);
  text-decoration: none;
  font-weight: 600;
  font-size: 0.9rem;
}

.section-head {
  display: flex;
  align-items: baseline;
  gap: 0.6rem;
  margin-bottom: 0.75rem;
}

.section-head h3 {
  margin: 0;
  font-size: 1.1rem;
}

.count {
  color: color-mix(in srgb, var(--lavender-blush) 50%, transparent);
  font-size: 0.85rem;
}

.repo-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.55rem;
}

.repo-row {
  display: block;
  padding: 0.9rem 1rem;
  border-radius: 0.85rem;
  text-decoration: none;
  color: inherit;
  background: color-mix(in srgb, var(--lavender-blush) 4%, transparent);
  border: 1px solid color-mix(in srgb, var(--lavender-blush) 10%, transparent);
  transition:
    border-color 0.15s ease,
    background-color 0.15s ease;
}

.repo-row:hover {
  border-color: color-mix(in srgb, var(--github-ink) 35%, transparent);
  background: color-mix(in srgb, var(--github-black) 40%, transparent);
}

.repo-main {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  align-items: center;
}

.badge {
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.02em;
  text-transform: uppercase;
  padding: 0.15rem 0.45rem;
  border-radius: 999px;
  color: var(--github-ink);
  background: color-mix(in srgb, var(--github-black) 70%, transparent);
}

.badge-public {
  color: var(--meadow-green);
  background: color-mix(in srgb, var(--meadow-green) 16%, transparent);
}

.desc {
  margin: 0.35rem 0 0;
  color: color-mix(in srgb, var(--lavender-blush) 60%, transparent);
  font-size: 0.9rem;
}

.repo-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  margin-top: 0.45rem;
  font-size: 0.8rem;
  color: color-mix(in srgb, var(--lavender-blush) 50%, transparent);
}

.empty {
  padding: 1.25rem;
  color: color-mix(in srgb, var(--lavender-blush) 55%, transparent);
}
</style>
