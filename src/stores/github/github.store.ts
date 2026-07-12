import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { useQueryCache } from '@pinia/colada'
import { useToast } from 'primevue/usetoast'
import * as githubService from '@services/github.service'
import { extractApiErrorMessage, isReauthError } from '@lib/api-error'
import {
  githubKeys,
  useGithubProfileQuery,
  useGithubReposQuery,
  useGithubStatusQuery,
} from '@stores/github/github.queries'
import {
  useGithubCreatePullMutation,
  useGithubDisconnectMutation,
  useGithubMergePullMutation,
  useGithubSyncMutation,
} from '@stores/github/github.mutations'
import type {
  GithubCommit,
  GithubCompareResult,
  GithubCreatePullPayload,
  GithubInboxPull,
  GithubMergePullPayload,
  GithubPullFile,
  GithubPullRequest,
  GithubPullStateFilter,
  GithubBranch,
} from '@/types/github/github'

export const useGithubStore = defineStore('github', () => {
  const toast = useToast()
  const queryCache = useQueryCache()

  const statusQuery = useGithubStatusQuery()
  const profileQuery = useGithubProfileQuery()
  const reposQuery = useGithubReposQuery()

  const disconnectMutation = useGithubDisconnectMutation()
  const syncMutation = useGithubSyncMutation()
  const createPullMutation = useGithubCreatePullMutation()
  const mergePullMutation = useGithubMergePullMutation()

  const inbox = ref<GithubInboxPull[]>([])
  const inboxLoading = ref(false)
  const repoPulls = ref<GithubPullRequest[]>([])
  const repoPullsLoading = ref(false)
  const commits = ref<GithubCommit[]>([])
  const commitsLoading = ref(false)
  const branches = ref<GithubBranch[]>([])
  const branchesLoading = ref(false)
  const pullDetail = ref<GithubPullRequest | null>(null)
  const pullFiles = ref<GithubPullFile[]>([])
  const pullDetailLoading = ref(false)
  const compareResult = ref<GithubCompareResult | null>(null)
  const compareLoading = ref(false)

  const status = computed(() => statusQuery.data.value ?? null)
  const connected = computed(() => status.value?.connected === true)
  const needsReauth = computed(() => status.value?.needs_reauth === true)
  const statusLoading = computed(() => statusQuery.asyncStatus.value === 'loading')
  const profile = computed(() => profileQuery.data.value ?? null)
  const repos = computed(() => reposQuery.data.value ?? [])
  const reposLoading = computed(() => reposQuery.asyncStatus.value === 'loading')
  const syncPending = computed(() => syncMutation.asyncStatus.value === 'loading')
  const writePending = computed(
    () =>
      createPullMutation.asyncStatus.value === 'loading' ||
      mergePullMutation.asyncStatus.value === 'loading',
  )

  function toastError(error: unknown, fallback: string): void {
    toast.add({
      severity: 'error',
      summary: fallback,
      detail: extractApiErrorMessage(error, fallback),
      life: 4000,
    })
    if (isReauthError(error)) {
      void statusQuery.refetch()
    }
  }

  async function loadHub(force = false): Promise<void> {
    await statusQuery.refetch()
    if (!connected.value) return
    await Promise.allSettled([
      profileQuery.refetch(),
      reposQuery.refetch(),
    ])
    if (force) {
      // no-op marker for OAuth return path
    }
  }

  async function connect(): Promise<void> {
    try {
      const { url } = await githubService.getConnectUrl()
      window.location.assign(url)
    } catch (error) {
      toastError(error, 'Unable to start GitHub connect')
    }
  }

  async function disconnect(): Promise<boolean> {
    try {
      await disconnectMutation.mutateAsync()
      await queryCache.invalidateQueries({ key: githubKeys.all })
      toast.add({
        severity: 'success',
        summary: 'Disconnected',
        detail: 'GitHub account unlinked',
        life: 2500,
      })
      await statusQuery.refetch()
      return true
    } catch (error) {
      toastError(error, 'Unable to disconnect GitHub')
      return false
    }
  }

  async function syncNow(): Promise<boolean> {
    try {
      const result = await syncMutation.mutateAsync()
      toast.add({
        severity: 'info',
        summary: 'Sync queued',
        detail: result.message,
        life: 2500,
      })
      window.setTimeout(() => {
        void Promise.allSettled([
          statusQuery.refetch(),
          reposQuery.refetch(),
          profileQuery.refetch(),
        ])
      }, 2500)
      return true
    } catch (error) {
      toastError(error, 'Unable to sync GitHub data')
      return false
    }
  }

  async function handleOAuthReturn(
    connectedFlag: string | null,
    errorCode: string | null,
  ): Promise<void> {
    if (connectedFlag === '1') {
      toast.add({
        severity: 'success',
        summary: 'GitHub connected',
        detail: 'Pulling your repositories…',
        life: 3000,
      })
      await loadHub(true)
      await syncNow()
      return
    }

    if (connectedFlag === '0') {
      toast.add({
        severity: 'error',
        summary: 'GitHub connect failed',
        detail: errorCode ?? 'access_denied',
        life: 4000,
      })
      await statusQuery.refetch()
    }
  }

  async function loadInbox(
    state: GithubPullStateFilter = 'open',
  ): Promise<void> {
    inboxLoading.value = true
    try {
      const result = await githubService.listInboxPulls({ state, per_page: 40 })
      inbox.value = result.items
    } catch (error) {
      toastError(error, 'Unable to load pull requests')
      inbox.value = []
    } finally {
      inboxLoading.value = false
    }
  }

  async function loadRepoPulls(
    owner: string,
    repo: string,
    state: GithubPullStateFilter = 'open',
  ): Promise<void> {
    repoPullsLoading.value = true
    try {
      const result = await githubService.listRepoPulls(owner, repo, {
        state,
        per_page: 40,
      })
      repoPulls.value = result.items
    } catch (error) {
      toastError(error, 'Unable to load repository pull requests')
      repoPulls.value = []
    } finally {
      repoPullsLoading.value = false
    }
  }

  async function loadCommits(owner: string, repo: string): Promise<void> {
    commitsLoading.value = true
    try {
      const result = await githubService.listCommits(owner, repo, {
        per_page: 40,
      })
      commits.value = result.items
    } catch (error) {
      toastError(error, 'Unable to load commits')
      commits.value = []
    } finally {
      commitsLoading.value = false
    }
  }

  async function loadBranches(owner: string, repo: string): Promise<void> {
    branchesLoading.value = true
    try {
      const result = await githubService.listBranches(owner, repo)
      branches.value = result.items
    } catch (error) {
      toastError(error, 'Unable to load branches')
      branches.value = []
    } finally {
      branchesLoading.value = false
    }
  }

  async function loadPullDetail(
    owner: string,
    repo: string,
    number: number,
  ): Promise<void> {
    pullDetailLoading.value = true
    try {
      const [pull, files] = await Promise.all([
        githubService.getPull(owner, repo, number),
        githubService.listPullFiles(owner, repo, number),
      ])
      pullDetail.value = pull
      pullFiles.value = files.items
    } catch (error) {
      toastError(error, 'Unable to load pull request')
      pullDetail.value = null
      pullFiles.value = []
    } finally {
      pullDetailLoading.value = false
    }
  }

  async function loadCompare(
    owner: string,
    repo: string,
    base: string,
    head: string,
  ): Promise<void> {
    if (!base || !head || base === head) {
      compareResult.value = null
      return
    }

    compareLoading.value = true
    try {
      compareResult.value = await githubService.compareBranches(
        owner,
        repo,
        base,
        head,
      )
    } catch (error) {
      toastError(error, 'Unable to load branch comparison')
      compareResult.value = null
    } finally {
      compareLoading.value = false
    }
  }

  async function createPull(
    owner: string,
    repo: string,
    payload: GithubCreatePullPayload,
  ): Promise<GithubPullRequest | null> {
    try {
      const pull = await createPullMutation.mutateAsync({
        owner,
        repo,
        payload,
      })
      toast.add({
        severity: 'success',
        summary: 'Pull request created',
        detail: `#${pull.number} ${pull.title ?? ''}`,
        life: 3000,
      })
      return pull
    } catch (error) {
      toastError(error, 'Unable to create pull request')
      return null
    }
  }

  async function mergePull(
    owner: string,
    repo: string,
    number: number,
    payload: GithubMergePullPayload = {},
  ): Promise<boolean> {
    try {
      const result = await mergePullMutation.mutateAsync({
        owner,
        repo,
        number,
        payload,
      })
      toast.add({
        severity: 'success',
        summary: 'Merged',
        detail: result.message ?? `Pull request #${number} merged`,
        life: 3000,
      })
      await loadPullDetail(owner, repo, number)
      return result.merged
    } catch (error) {
      toastError(error, 'Unable to merge pull request')
      return false
    }
  }

  return {
    status,
    connected,
    needsReauth,
    statusLoading,
    profile,
    repos,
    reposLoading,
    syncPending,
    writePending,
    inbox,
    inboxLoading,
    repoPulls,
    repoPullsLoading,
    commits,
    commitsLoading,
    branches,
    branchesLoading,
    pullDetail,
    pullFiles,
    pullDetailLoading,
    compareResult,
    compareLoading,
    loadHub,
    connect,
    disconnect,
    syncNow,
    handleOAuthReturn,
    loadInbox,
    loadRepoPulls,
    loadCommits,
    loadBranches,
    loadPullDetail,
    loadCompare,
    createPull,
    mergePull,
  }
})
