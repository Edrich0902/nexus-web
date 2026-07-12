<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useConfirm } from 'primevue/useconfirm'
import NexusPageWrapper from '@components/nexus-page-wrapper/NexusPageWrapper.vue'
import NexusGithubChrome from '@components/nexus-github-chrome/NexusGithubChrome.vue'
import NexusGithubDiffViewer from '@components/nexus-github-diff-viewer/NexusGithubDiffViewer.vue'
import { useGithubStore } from '@stores/github/github.store'

const github = useGithubStore()
const route = useRoute()
const router = useRouter()
const confirm = useConfirm()

const owner = computed(() => String(route.params.owner ?? ''))
const repo = computed(() => String(route.params.repo ?? ''))
const number = computed(() => Number(route.params.number))
const mergeMethod = ref<'merge' | 'squash' | 'rebase'>('squash')

const mergeOptions = [
  { label: 'Create a merge commit', value: 'merge' },
  { label: 'Squash and merge', value: 'squash' },
  { label: 'Rebase and merge', value: 'rebase' },
]

const title = computed(
  () => github.pullDetail?.title ?? `Pull #${number.value}`,
)

async function load(): Promise<void> {
  await github.loadHub()
  if (!github.connected) {
    await router.replace({ name: 'github' })
    return
  }
  if (!Number.isFinite(number.value)) return
  await github.loadPullDetail(owner.value, repo.value, number.value)
}

onMounted(() => {
  void load()
})

watch([owner, repo, number], () => {
  void load()
})

function canMerge(): boolean {
  const pull = github.pullDetail
  if (!pull || pull.merged || pull.state !== 'open') return false
  return pull.mergeable !== false
}

function mergeConfirm(event: Event): void {
  confirm.require({
    target: event.currentTarget as HTMLElement,
    message: `Merge #${number.value} with ${mergeMethod.value}?`,
    icon: 'pi pi-exclamation-triangle',
    rejectProps: {
      label: 'Cancel',
      severity: 'secondary',
      outlined: true,
    },
    acceptProps: {
      label: 'Merge',
      severity: 'success',
    },
    accept: () => {
      void github.mergePull(owner.value, repo.value, number.value, {
        merge_method: mergeMethod.value,
      })
    },
  })
}
</script>

<template>
  <NexusPageWrapper show-toolbar :title="title">
    <template #toolbar>
      <a
        v-if="github.pullDetail?.html_url"
        :href="github.pullDetail.html_url"
        target="_blank"
        rel="noopener noreferrer"
        class="external"
      >
        Open on GitHub
      </a>
    </template>

    <div class="github-page">
      <NexusGithubChrome>
        <div v-if="github.pullDetailLoading" class="empty">Loading pull request…</div>
        <template v-else-if="github.pullDetail">
          <section class="summary">
            <div class="summary-top">
              <span class="badge">#{{ github.pullDetail.number }}</span>
              <span class="badge">{{ github.pullDetail.state }}</span>
              <span v-if="github.pullDetail.merged" class="badge merged">merged</span>
              <span v-if="github.pullDetail.draft" class="badge">draft</span>
            </div>
            <p class="branch-line">
              <code>{{ github.pullDetail.head.ref }}</code>
              →
              <code>{{ github.pullDetail.base.ref }}</code>
            </p>
            <p v-if="github.pullDetail.body" class="body">
              {{ github.pullDetail.body }}
            </p>
            <div class="stats">
              <span v-if="github.pullDetail.additions != null">
                +{{ github.pullDetail.additions }}
              </span>
              <span v-if="github.pullDetail.deletions != null">
                −{{ github.pullDetail.deletions }}
              </span>
              <span v-if="github.pullDetail.changed_files != null">
                {{ github.pullDetail.changed_files }} files
              </span>
            </div>

            <div v-if="canMerge()" class="merge-bar">
              <Select
                v-model="mergeMethod"
                :options="mergeOptions"
                option-label="label"
                option-value="value"
                class="merge-select"
              />
              <Button
                label="Merge pull request"
                icon="pi pi-check"
                :loading="github.writePending"
                @click="mergeConfirm"
              />
            </div>
          </section>

          <section class="files">
            <h3>Files changed</h3>
            <NexusGithubDiffViewer :files="github.pullFiles" />
          </section>
        </template>
        <div v-else class="empty">Pull request not found.</div>
      </NexusGithubChrome>
    </div>
  </NexusPageWrapper>
</template>

<style scoped>
.github-page {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding-bottom: 2rem;
}

.external {
  color: var(--github-ink);
  text-decoration: none;
  font-weight: 600;
  font-size: 0.9rem;
}

.summary {
  padding: 1.1rem 1.2rem;
  border-radius: 1rem;
  background: var(--github-card-surface);
  border: 1px solid color-mix(in srgb, var(--lavender-blush) 10%, transparent);
}

.summary-top {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
}

.badge {
  font-size: 0.72rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.03em;
  padding: 0.2rem 0.45rem;
  border-radius: 999px;
  background: color-mix(in srgb, var(--github-black) 65%, transparent);
  color: var(--github-ink);
}

.badge.merged {
  color: var(--meadow-green);
  background: color-mix(in srgb, var(--meadow-green) 16%, transparent);
}

.branch-line {
  margin: 0.75rem 0 0;
  color: color-mix(in srgb, var(--lavender-blush) 70%, transparent);
}

.body {
  margin: 0.75rem 0 0;
  white-space: pre-wrap;
  color: color-mix(in srgb, var(--lavender-blush) 75%, transparent);
  line-height: 1.45;
}

.stats {
  display: flex;
  gap: 0.85rem;
  margin-top: 0.75rem;
  font-size: 0.85rem;
  color: color-mix(in srgb, var(--lavender-blush) 55%, transparent);
}

.merge-bar {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  align-items: center;
  margin-top: 1rem;
}

.merge-select {
  min-width: 14rem;
}

.files h3 {
  margin: 0 0 0.75rem;
}

.empty {
  padding: 1rem;
  color: color-mix(in srgb, var(--lavender-blush) 55%, transparent);
}
</style>
