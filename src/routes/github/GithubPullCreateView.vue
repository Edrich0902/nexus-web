<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import NexusPageWrapper from '@components/nexus-page-wrapper/NexusPageWrapper.vue'
import NexusGithubChrome from '@components/nexus-github-chrome/NexusGithubChrome.vue'
import NexusGithubDiffViewer from '@components/nexus-github-diff-viewer/NexusGithubDiffViewer.vue'
import { useGithubStore } from '@stores/github/github.store'

const github = useGithubStore()
const route = useRoute()
const router = useRouter()

const owner = computed(() => String(route.params.owner ?? ''))
const repo = computed(() => String(route.params.repo ?? ''))

const title = ref('')
const body = ref('')
const head = ref<string | null>(null)
const base = ref<string | null>(null)
const draft = ref(false)

const branchOptions = computed(() =>
  github.branches.map((branch) => ({
    label: branch.name,
    value: branch.name,
  })),
)

const compareSummary = computed(() => {
  const result = github.compareResult
  if (!result) return null
  return {
    ahead: result.ahead_by,
    behind: result.behind_by,
    commits: result.total_commits,
    status: result.status,
    files: result.files.length,
  }
})

async function refreshCompare(): Promise<void> {
  if (!base.value || !head.value || base.value === head.value) {
    await github.loadCompare(owner.value, repo.value, '', '')
    return
  }
  await github.loadCompare(owner.value, repo.value, base.value, head.value)
}

onMounted(async () => {
  await github.loadHub()
  if (!github.connected) {
    await router.replace({ name: 'github' })
    return
  }
  await github.loadBranches(owner.value, repo.value)
  const repoRow = github.repos.find(
    (item) => item.owner === owner.value && item.name === repo.value,
  )
  base.value = repoRow?.default_branch ?? github.branches[0]?.name ?? null
  head.value =
    github.branches.find((b) => b.name !== base.value)?.name ??
    github.branches[0]?.name ??
    null
  await refreshCompare()
})

watch([base, head], () => {
  void refreshCompare()
})

async function submit(): Promise<void> {
  if (!title.value.trim() || !head.value || !base.value) return
  const pull = await github.createPull(owner.value, repo.value, {
    title: title.value.trim(),
    head: head.value,
    base: base.value,
    body: body.value.trim() || null,
    draft: draft.value,
  })
  if (pull?.number) {
    await router.push({
      name: 'github-pull-detail',
      params: {
        owner: owner.value,
        repo: repo.value,
        number: pull.number,
      },
    })
  }
}
</script>

<template>
  <NexusPageWrapper show-toolbar title="New pull request">
    <div class="github-page">
      <NexusGithubChrome>
        <form class="form" @submit.prevent="submit">
          <p class="repo-label">{{ owner }}/{{ repo }}</p>

          <label class="field">
            <span>Title</span>
            <InputText v-model="title" class="w-full" required maxlength="256" />
          </label>

          <div class="branch-row">
            <label class="field">
              <span>Base</span>
              <Select
                v-model="base"
                :options="branchOptions"
                option-label="label"
                option-value="value"
                placeholder="Base branch"
                class="w-full"
              />
            </label>
            <label class="field">
              <span>Compare</span>
              <Select
                v-model="head"
                :options="branchOptions"
                option-label="label"
                option-value="value"
                placeholder="Head branch"
                class="w-full"
              />
            </label>
          </div>

          <label class="field">
            <span>Description</span>
            <Textarea v-model="body" rows="6" class="w-full" auto-resize />
          </label>

          <label class="draft-check">
            <Checkbox v-model="draft" binary input-id="create-draft" />
            <span>Create as draft</span>
          </label>

          <div class="actions">
            <Button
              type="button"
              label="Cancel"
              severity="secondary"
              text
              @click="
                router.push({
                  name: 'github-repo',
                  params: { owner, repo },
                })
              "
            />
            <Button
              type="submit"
              label="Create pull request"
              icon="pi pi-check"
              :loading="github.writePending"
              :disabled="!title.trim() || !head || !base || head === base"
            />
          </div>
        </form>

        <section class="preview">
          <div class="preview-head">
            <h3>Diff preview</h3>
            <p v-if="compareSummary" class="preview-meta">
              <span v-if="compareSummary.commits != null">
                {{ compareSummary.commits }} commit{{
                  compareSummary.commits === 1 ? '' : 's'
                }}
              </span>
              <span v-if="compareSummary.ahead != null">
                {{ compareSummary.ahead }} ahead
              </span>
              <span v-if="compareSummary.behind != null">
                {{ compareSummary.behind }} behind
              </span>
              <span>{{ compareSummary.files }} files</span>
            </p>
          </div>

          <div v-if="!base || !head || base === head" class="empty">
            Choose different base and compare branches to preview the diff.
          </div>
          <div v-else-if="github.compareLoading" class="empty">
            Loading comparison…
          </div>
          <NexusGithubDiffViewer
            v-else-if="github.compareResult"
            :files="github.compareResult.files"
            expand-all
          />
        </section>
      </NexusGithubChrome>
    </div>
  </NexusPageWrapper>
</template>

<style scoped>
.github-page {
  padding-bottom: 2rem;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  max-width: 42rem;
  padding: 1.2rem;
  border-radius: 1rem;
  background: var(--github-card-surface);
  border: 1px solid color-mix(in srgb, var(--lavender-blush) 10%, transparent);
}

.repo-label {
  margin: 0;
  font-weight: 700;
  color: var(--github-ink);
}

.field {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.field span {
  font-size: 0.85rem;
  color: color-mix(in srgb, var(--lavender-blush) 65%, transparent);
}

.branch-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.85rem;
}

@media (max-width: 640px) {
  .branch-row {
    grid-template-columns: 1fr;
  }
}

.actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
}

.draft-check {
  display: flex;
  align-items: center;
  gap: 0.55rem;
  font-size: 0.9rem;
  color: color-mix(in srgb, var(--lavender-blush) 75%, transparent);
}

.preview-head {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 0.75rem;
  margin-bottom: 0.75rem;
}

.preview-head h3 {
  margin: 0;
}

.preview-meta {
  margin: 0;
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  font-size: 0.85rem;
  color: color-mix(in srgb, var(--lavender-blush) 55%, transparent);
}

.empty {
  padding: 1rem;
  color: color-mix(in srgb, var(--lavender-blush) 55%, transparent);
}
</style>
