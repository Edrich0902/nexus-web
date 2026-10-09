<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import IndexTemplate from '@design/templates/IndexTemplate.vue'
import type { ViewState } from '@design/templates/types'
import NxStage from '@design/components/NxStage.vue'
import NxPillGroup from '@design/components/NxPillGroup.vue'
import NxEmptyState from '@design/components/NxEmptyState.vue'
import NxSkeletonRows from '@design/components/skeletons/NxSkeletonRows.vue'
import { plural } from '@routes/collections/collectionFields'
import { useGithubStore } from '@stores/github/github.store'
import type { GithubPullStateFilter } from '@/types/github/github'
import CodeNav from './CodeNav.vue'
import PullRow from './PullRow.vue'
import { PULL_FILTERS } from './code'

const github = useGithubStore()
const router = useRouter()
const filter = ref<GithubPullStateFilter>('open')
const ready = ref(false)

onMounted(async () => {
  await github.loadHub()
  if (!github.connected) {
    await router.replace({ name: 'github' })
    return
  }
  ready.value = true
  await github.loadInbox(filter.value)
})

watch(filter, (value) => void github.loadInbox(value))

const state = computed<ViewState>(() => (ready.value ? 'ready' : 'loading'))

const lede = computed(() => {
  if (github.inboxLoading) return 'Across every repository you have access to.'
  const label = PULL_FILTERS.find((f) => f.value === filter.value)?.label.toLowerCase() ?? ''
  return `${plural(github.inbox.length, `${label} pull request`.trim(), `${label} pull requests`.trim())} across your repositories.`
})

const emptyBody: Record<GithubPullStateFilter, string> = {
  open: 'Nothing open — you are all caught up.',
  merged: 'No merged pull requests yet.',
  closed: 'No closed pull requests.',
  all: 'No pull requests found.',
}
</script>

<template>
  <IndexTemplate :state="state">
    <template #stage>
      <NxStage size="compact" eyebrow="Code" title="Pull" accent="requests" :lede="lede" />
    </template>

    <template #toolbar>
      <CodeNav />
      <NxPillGroup v-model="filter" :options="PULL_FILTERS" label="Pull request state" size="sm" class="filter" />
    </template>

    <NxSkeletonRows v-if="github.inboxLoading && !github.inbox.length" :rows="8" />
    <NxEmptyState v-else-if="!github.inbox.length" title="No pull requests" :body="emptyBody[filter]" icon="code" />
    <div v-else :class="{ dim: github.inboxLoading }">
      <PullRow
        v-for="p in github.inbox"
        :key="p.id ?? `${p.repository.full_name}-${p.number}`"
        :owner="p.repository.owner"
        :repo="p.repository.name"
        :number="p.number"
        :title="p.title"
        :state="p.state"
        :draft="p.draft"
        :merged="filter === 'merged'"
        :updated-at="p.updated_at"
        :user="p.user"
        :href="p.html_url"
        show-repo
      />
    </div>
  </IndexTemplate>
</template>

<style scoped>
.filter {
  margin-left: auto;
}

.dim {
  opacity: 0.55;
  transition: opacity 0.2s;
}
</style>
