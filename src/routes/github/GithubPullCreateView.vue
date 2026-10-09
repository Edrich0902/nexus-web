<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import DetailTemplate from '@design/templates/DetailTemplate.vue'
import type { ViewState } from '@design/templates/types'
import NxStage from '@design/components/NxStage.vue'
import NxPanel from '@design/components/NxPanel.vue'
import NxIcon from '@design/components/NxIcon.vue'
import NxSkeletonRows from '@design/components/skeletons/NxSkeletonRows.vue'
import NexusGithubDiffViewer from '@components/nexus-github-diff-viewer/NexusGithubDiffViewer.vue'
import { plural } from '@routes/collections/collectionFields'
import { useGithubStore } from '@stores/github/github.store'

const github = useGithubStore()
const route = useRoute()
const router = useRouter()

const owner = computed(() => String(route.params.owner ?? ''))
const repo = computed(() => String(route.params.repo ?? ''))
const ready = ref(false)

const title = ref('')
const body = ref('')
const head = ref<string | null>(null)
const base = ref<string | null>(null)
const draft = ref(false)

const branchOptions = computed(() => github.branches.map((b) => ({ label: b.name, value: b.name })))
const comparable = computed(() => Boolean(base.value && head.value && base.value !== head.value))

onMounted(async () => {
  await github.loadHub()
  if (!github.connected) {
    await router.replace({ name: 'github' })
    return
  }
  await github.loadBranches(owner.value, repo.value)
  const repoRow = github.repos.find((r) => r.owner === owner.value && r.name === repo.value)
  base.value = github.currentRepo?.default_branch ?? repoRow?.default_branch ?? github.branches[0]?.name ?? null
  const requested = typeof route.query.head === 'string' ? route.query.head : null
  head.value =
    (requested && github.branches.some((b) => b.name === requested) ? requested : null) ??
    github.branches.find((b) => b.name !== base.value)?.name ??
    null
  if (head.value && !title.value) title.value = head.value.replace(/^[\w-]+\//, '').replace(/[-_]+/g, ' ')
  ready.value = true
})

watch([base, head], () => {
  if (comparable.value) void github.loadCompare(owner.value, repo.value, base.value!, head.value!)
  else void github.loadCompare(owner.value, repo.value, '', '')
})

const state = computed<ViewState>(() => (ready.value ? 'ready' : 'loading'))

const lede = computed(() => {
  const r = github.compareResult
  if (!comparable.value) return 'Choose two different branches to compare.'
  if (!r || github.compareLoading) return `Merging ${head.value} into ${base.value}.`
  const parts = [`Merging ${head.value} into ${base.value}`]
  if (r.total_commits != null) parts.push(plural(r.total_commits, 'commit'))
  parts.push(plural(r.files.length, 'file'))
  if (r.behind_by) parts.push(`${r.behind_by} behind`)
  return `${parts.join(' · ')}.`
})

async function submit(): Promise<void> {
  if (!title.value.trim() || !comparable.value) return
  const pull = await github.createPull(owner.value, repo.value, {
    title: title.value.trim(),
    head: head.value!,
    base: base.value!,
    body: body.value.trim() || null,
    draft: draft.value,
  })
  if (pull?.number) {
    await router.push({
      name: 'github-pull-detail',
      params: { owner: owner.value, repo: repo.value, number: pull.number },
    })
  }
}
</script>

<template>
  <DetailTemplate :state="state" :back-to="{ name: 'github-repo', params: { owner, repo } }" :back-label="repo">
    <template #stage>
      <NxStage size="compact" :eyebrow="`${owner}/${repo}`" title="New" accent="pull request" :lede="lede" />
    </template>

    <div class="create">
      <NxPanel>
        <form id="create-pull" class="nx-form" @submit.prevent="submit">
          <div class="row">
            <label class="f">
              <span>Merge into</span>
              <Select v-model="base" :options="branchOptions" option-label="label" option-value="value" placeholder="Base branch" filter />
            </label>
            <label class="f">
              <span>From</span>
              <Select v-model="head" :options="branchOptions" option-label="label" option-value="value" placeholder="Head branch" filter />
            </label>
          </div>
          <label class="f">
            <span>Title</span>
            <InputText v-model="title" required maxlength="256" />
          </label>
          <label class="f">
            <span>Description</span>
            <Textarea v-model="body" rows="5" auto-resize />
          </label>
          <div class="foot">
            <label class="check">
              <Checkbox v-model="draft" binary input-id="create-draft" />
              <span>Open as a draft</span>
            </label>
            <Button
              type="submit"
              rounded
              :label="draft ? 'Create draft' : 'Create pull request'"
              :loading="github.writePending"
              :disabled="!title.trim() || !comparable"
            >
              <template #icon="{ class: iconClass }">
                <NxIcon name="check" :size="16" :class="iconClass" />
              </template>
            </Button>
          </div>
        </form>
      </NxPanel>

      <NxPanel title="Changes" variant="flush">
        <p v-if="!comparable" class="quiet">Pick two different branches to preview the diff.</p>
        <NxSkeletonRows v-else-if="github.compareLoading" :rows="4" />
        <p v-else-if="github.compareResult && !github.compareResult.files.length" class="quiet">
          These branches are identical.
        </p>
        <NexusGithubDiffViewer v-else-if="github.compareResult" :files="github.compareResult.files" expand-all />
      </NxPanel>
    </div>
  </DetailTemplate>
</template>

<style scoped>
.create {
  display: flex;
  flex-direction: column;
  gap: 36px;
}

.foot {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.check {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: var(--ink-2);
  cursor: pointer;
}

.quiet {
  margin: 0;
  color: var(--ink-3);
  font-size: 14px;
}
</style>
