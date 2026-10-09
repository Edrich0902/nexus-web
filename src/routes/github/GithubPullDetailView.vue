<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useConfirm } from 'primevue/useconfirm'
import DetailTemplate from '@design/templates/DetailTemplate.vue'
import type { ViewState } from '@design/templates/types'
import NxStage from '@design/components/NxStage.vue'
import NxPanel from '@design/components/NxPanel.vue'
import NxIcon from '@design/components/NxIcon.vue'
import NxSkeletonRows from '@design/components/skeletons/NxSkeletonRows.vue'
import NexusGithubDiffViewer from '@components/nexus-github-diff-viewer/NexusGithubDiffViewer.vue'
import { plural } from '@routes/collections/collectionFields'
import { relativeTime } from '@lib/datetime'
import { useGithubStore } from '@stores/github/github.store'
import type { GithubSubmitReviewPayload } from '@/types/github/github'
import { PULL_STATE_LABEL, pullState } from './code'

const github = useGithubStore()
const route = useRoute()
const router = useRouter()
const confirm = useConfirm()

const owner = computed(() => String(route.params.owner ?? ''))
const repo = computed(() => String(route.params.repo ?? ''))
const number = computed(() => Number(route.params.number))
const checked = ref(false)

const mergeMethod = ref<'merge' | 'squash' | 'rebase'>('squash')
const mergeOptions = [
  { label: 'Squash and merge', value: 'squash' },
  { label: 'Create a merge commit', value: 'merge' },
  { label: 'Rebase and merge', value: 'rebase' },
]

const reviewBody = ref('')
const reviewEvent = ref<GithubSubmitReviewPayload['event']>('COMMENT')

async function load(): Promise<void> {
  checked.value = false
  await github.loadHub()
  if (!github.connected) {
    await router.replace({ name: 'github' })
    return
  }
  checked.value = true
  if (Number.isFinite(number.value)) await github.loadPullDetail(owner.value, repo.value, number.value)
}

watch([owner, repo, number], () => void load(), { immediate: true })

const pull = computed(() => (github.pullDetail?.number === number.value ? github.pullDetail : null))

const state = computed<ViewState>(() => {
  if (!checked.value || (github.pullDetailLoading && !pull.value)) return 'loading'
  return pull.value ? 'ready' : 'error'
})

const kind = computed(() => (pull.value ? pullState(pull.value) : 'open'))
const isOpen = computed(() => kind.value === 'open' || kind.value === 'draft')
const canMerge = computed(() => isOpen.value && !pull.value?.draft && pull.value?.mergeable !== false)

const eyebrow = computed(() => `${owner.value}/${repo.value} · #${number.value} · ${PULL_STATE_LABEL[kind.value]}`)

const lede = computed(() => {
  const p = pull.value
  if (!p) return ''
  const parts = [`${p.head.ref ?? '?'} → ${p.base.ref ?? '?'}`]
  if (p.commits != null) parts.push(plural(p.commits, 'commit'))
  if (p.changed_files != null) parts.push(plural(p.changed_files, 'file'))
  if (p.user.login) parts.push(`opened by ${p.user.login} ${relativeTime(p.created_at)}`)
  return parts.join(' · ')
})

function mergeConfirm(event: Event): void {
  const label = mergeOptions.find((o) => o.value === mergeMethod.value)?.label.toLowerCase() ?? mergeMethod.value
  confirm.require({
    target: event.currentTarget as HTMLElement,
    message: `${label.charAt(0).toUpperCase()}${label.slice(1)} #${number.value}?`,
    acceptLabel: 'Merge',
    rejectLabel: 'Cancel',
    acceptProps: { size: 'small' },
    rejectProps: { severity: 'secondary', text: true, size: 'small' },
    accept: () => void github.mergePull(owner.value, repo.value, number.value, { merge_method: mergeMethod.value }),
  })
}

async function submitReview(event: GithubSubmitReviewPayload['event']): Promise<void> {
  reviewEvent.value = event
  const body = reviewBody.value.trim()
  if (event !== 'APPROVE' && !body) return
  const ok = await github.submitReview(owner.value, repo.value, number.value, { event, body: body || null })
  if (ok) reviewBody.value = ''
}

const REVIEW_LABEL: Record<string, string> = {
  APPROVED: 'Approved',
  CHANGES_REQUESTED: 'Requested changes',
  COMMENTED: 'Commented',
  DISMISSED: 'Dismissed',
  PENDING: 'Pending',
}

function reviewTone(state: string | null): string {
  if (state === 'APPROVED') return 'ok'
  if (state === 'CHANGES_REQUESTED') return 'bad'
  return 'muted'
}
</script>

<template>
  <DetailTemplate
    :state="state"
    :back-to="{ name: 'github-repo', params: { owner, repo } }"
    :back-label="repo"
    error-title="Pull request not found"
    error-body="It may have been deleted, or you no longer have access to this repository."
  >
    <template #stage>
      <NxStage size="compact" :eyebrow="eyebrow" :title="pull?.title ?? `Pull #${number}`" :lede="lede">
        <template #actions>
          <template v-if="canMerge">
            <Select v-model="mergeMethod" :options="mergeOptions" option-label="label" option-value="value" class="method" />
            <Button rounded severity="contrast" label="Merge" :loading="github.writePending" @click="mergeConfirm">
              <template #icon="{ class: iconClass }">
                <NxIcon name="check" :size="16" :class="iconClass" />
              </template>
            </Button>
          </template>
          <Button
            v-if="isOpen && pull?.draft"
            rounded
            severity="contrast"
            label="Ready for review"
            :loading="github.writePending"
            @click="github.markReady(owner, repo, number)"
          />
          <Button
            v-else-if="isOpen"
            rounded
            severity="secondary"
            label="Convert to draft"
            :loading="github.writePending"
            @click="github.convertToDraft(owner, repo, number)"
          />
          <Button
            v-if="pull?.html_url"
            as="a"
            :href="pull.html_url"
            target="_blank"
            rel="noopener noreferrer"
            rounded
            severity="secondary"
            label="Open on GitHub"
          >
            <template #icon="{ class: iconClass }">
              <NxIcon name="external-link" :size="16" :class="iconClass" />
            </template>
          </Button>
        </template>
      </NxStage>
    </template>

    <div v-if="pull" class="pull">
      <div v-if="isOpen && pull.mergeable === false" class="notice" role="status">
        <NxIcon name="close" :size="16" />
        This branch has conflicts with {{ pull.base.ref }} — resolve them on GitHub before merging.
      </div>

      <div class="cols">
        <NxPanel title="Description" variant="flush">
          <p v-if="pull.body" class="prose">{{ pull.body }}</p>
          <p v-else class="quiet">No description provided.</p>
          <p class="diffstat">
            <span class="add">+{{ (pull.additions ?? 0).toLocaleString() }}</span>
            <span class="del">−{{ (pull.deletions ?? 0).toLocaleString() }}</span>
            <span v-if="pull.comments || pull.review_comments">
              {{ plural((pull.comments ?? 0) + (pull.review_comments ?? 0), 'comment') }}
            </span>
          </p>
        </NxPanel>

        <NxPanel :title="`Reviews · ${github.pullReviews.length}`" variant="flush">
          <p v-if="!github.pullReviews.length" class="quiet">No reviews yet.</p>
          <div v-for="r in github.pullReviews" :key="r.id ?? r.submitted_at ?? ''" class="review">
            <img v-if="r.user.avatar_url" :src="r.user.avatar_url" alt="" class="avatar" loading="lazy" />
            <div class="review-body">
              <div class="review-head">
                <b>{{ r.user.login ?? 'Someone' }}</b>
                <span class="tone" :class="`t-${reviewTone(r.state)}`">{{ REVIEW_LABEL[r.state ?? ''] ?? r.state }}</span>
                <span class="when">{{ relativeTime(r.submitted_at) }}</span>
              </div>
              <p v-if="r.body" class="prose small">{{ r.body }}</p>
            </div>
          </div>

          <form v-if="isOpen" class="review-form" @submit.prevent="submitReview('COMMENT')">
            <Textarea
              v-model="reviewBody"
              rows="3"
              auto-resize
              placeholder="Leave a review — a comment is required to request changes."
              aria-label="Review comment"
            />
            <div class="review-actions">
              <Button
                rounded
                size="small"
                label="Approve"
                :loading="github.writePending && reviewEvent === 'APPROVE'"
                @click="submitReview('APPROVE')"
              />
              <Button
                rounded
                size="small"
                severity="secondary"
                label="Request changes"
                :disabled="!reviewBody.trim()"
                :loading="github.writePending && reviewEvent === 'REQUEST_CHANGES'"
                @click="submitReview('REQUEST_CHANGES')"
              />
              <Button
                type="submit"
                rounded
                size="small"
                text
                severity="secondary"
                label="Comment"
                :disabled="!reviewBody.trim()"
                :loading="github.writePending && reviewEvent === 'COMMENT'"
              />
            </div>
          </form>
        </NxPanel>
      </div>

      <NxPanel :title="`Files changed · ${github.pullFiles.length}`" variant="flush">
        <NxSkeletonRows v-if="github.pullDetailLoading" :rows="4" />
        <NexusGithubDiffViewer v-else :files="github.pullFiles" />
      </NxPanel>
    </div>
  </DetailTemplate>
</template>

<style scoped>
.pull {
  display: flex;
  flex-direction: column;
  gap: 40px;
}

.cols {
  display: grid;
  grid-template-columns: minmax(0, 1.2fr) minmax(0, 1fr);
  gap: 40px;
}

.method {
  min-width: 190px;
}

.notice {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 16px;
  border-radius: var(--r-md);
  background: color-mix(in srgb, var(--bad) 14%, transparent);
  font-size: 14px;
}

.prose {
  margin: 0;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
  font-size: 15px;
  line-height: 1.6;
  color: var(--ink-2);
}

.prose.small {
  font-size: 14px;
  line-height: 1.5;
}

.quiet {
  margin: 0;
  color: var(--ink-3);
  font-size: 14px;
}

.diffstat {
  display: flex;
  gap: 14px;
  margin: 16px 0 0;
  font-family: var(--font-mono);
  font-size: 13px;
  color: var(--ink-3);
}

.add {
  color: var(--ok);
}

.del {
  color: var(--bad);
}

.review {
  display: grid;
  grid-template-columns: 28px minmax(0, 1fr);
  gap: 12px;
  padding: 12px 0;
  border-top: 1px solid var(--line);
}

.avatar {
  width: 28px;
  height: 28px;
  border-radius: 50%;
}

.review-body {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
}

.review-head {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 4px 10px;
  font-size: 14px;
}

.tone {
  font-size: 12px;
  font-weight: 600;
}

.t-ok {
  color: var(--ok);
}

.t-bad {
  color: var(--bad);
}

.t-muted {
  color: var(--ink-3);
}

.when {
  font-size: 12px;
  color: var(--ink-3);
}

.review-form {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-top: 16px;
}

.review-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

@media (max-width: 960px) {
  .cols {
    grid-template-columns: minmax(0, 1fr);
  }
}
</style>
