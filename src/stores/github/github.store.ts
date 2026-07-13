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
  useGithubConvertDraftMutation,
  useGithubCreateBranchMutation,
  useGithubCreatePullMutation,
  useGithubDeleteBranchMutation,
  useGithubDisconnectMutation,
  useGithubMarkReadyMutation,
  useGithubMergePullMutation,
  useGithubStarMutation,
  useGithubSubmitReviewMutation,
  useGithubSyncMutation,
} from '@stores/github/github.mutations'
import type {
  GithubCommit,
  GithubCompareResult,
  GithubCreateBranchPayload,
  GithubCreatePullPayload,
  GithubInboxPull,
  GithubMergePullPayload,
  GithubPullFile,
  GithubPullRequest,
  GithubPullStateFilter,
  GithubBranch,
  GithubPulse,
  GithubReview,
  GithubSearchCodeHit,
  GithubSearchIssueHit,
  GithubSearchRepoHit,
  GithubSearchType,
  GithubStats,
  GithubSubmitReviewPayload,
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
  const starMutation = useGithubStarMutation()
  const createBranchMutation = useGithubCreateBranchMutation()
  const deleteBranchMutation = useGithubDeleteBranchMutation()
  const markReadyMutation = useGithubMarkReadyMutation()
  const convertDraftMutation = useGithubConvertDraftMutation()
  const submitReviewMutation = useGithubSubmitReviewMutation()

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
  const pullReviews = ref<GithubReview[]>([])
  const pullDetailLoading = ref(false)
  const compareResult = ref<GithubCompareResult | null>(null)
  const compareLoading = ref(false)
  const searchResults = ref<
    Array<GithubSearchRepoHit | GithubSearchIssueHit | GithubSearchCodeHit>
  >([])
  const searchTotal = ref(0)
  const searchLoading = ref(false)
  const currentRepo = ref<{
    owner: string
    name: string
    default_branch: string | null
    starred: boolean
  } | null>(null)
  const pulse = ref<GithubPulse | null>(null)
  const pulseLoading = ref(false)
  const stats = ref<GithubStats | null>(null)
  const statsLoading = ref(false)

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
      mergePullMutation.asyncStatus.value === 'loading' ||
      starMutation.asyncStatus.value === 'loading' ||
      createBranchMutation.asyncStatus.value === 'loading' ||
      deleteBranchMutation.asyncStatus.value === 'loading' ||
      markReadyMutation.asyncStatus.value === 'loading' ||
      convertDraftMutation.asyncStatus.value === 'loading' ||
      submitReviewMutation.asyncStatus.value === 'loading',
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

  async function loadPulse(): Promise<void> {
    pulseLoading.value = true
    try {
      await statusQuery.refetch()
      if (!connected.value) {
        pulse.value = null
        return
      }
      pulse.value = await githubService.getPulse()
    } catch (error) {
      toastError(error, 'Unable to load GitHub pulse')
      pulse.value = null
    } finally {
      pulseLoading.value = false
    }
  }

  async function loadStats(refresh = false): Promise<void> {
    statsLoading.value = true
    try {
      await statusQuery.refetch()
      if (!connected.value) {
        stats.value = null
        return
      }
      stats.value = await githubService.getStats(refresh)
    } catch (error) {
      toastError(error, 'Unable to load GitHub stats')
      stats.value = null
    } finally {
      statsLoading.value = false
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
      const [branchResult, repoRow] = await Promise.all([
        githubService.listBranches(owner, repo),
        githubService.getRepo(owner, repo).catch(() => null),
      ])
      branches.value = branchResult.items
      if (repoRow) {
        currentRepo.value = {
          owner: repoRow.owner,
          name: repoRow.name,
          default_branch: repoRow.default_branch,
          starred: repoRow.starred,
        }
      }
    } catch (error) {
      toastError(error, 'Unable to load branches')
      branches.value = []
    } finally {
      branchesLoading.value = false
    }
  }

  async function loadCurrentRepo(owner: string, repo: string): Promise<void> {
    try {
      const repoRow = await githubService.getRepo(owner, repo)
      currentRepo.value = {
        owner: repoRow.owner,
        name: repoRow.name,
        default_branch: repoRow.default_branch,
        starred: repoRow.starred,
      }
    } catch (error) {
      toastError(error, 'Unable to load repository')
      currentRepo.value = null
    }
  }

  async function loadPullDetail(
    owner: string,
    repo: string,
    number: number,
  ): Promise<void> {
    pullDetailLoading.value = true
    try {
      const [pull, files, reviews] = await Promise.all([
        githubService.getPull(owner, repo, number),
        githubService.listPullFiles(owner, repo, number),
        githubService.listPullReviews(owner, repo, number),
      ])
      pullDetail.value = pull
      pullFiles.value = files.items
      pullReviews.value = reviews.items
    } catch (error) {
      toastError(error, 'Unable to load pull request')
      pullDetail.value = null
      pullFiles.value = []
      pullReviews.value = []
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

  async function search(
    q: string,
    type: GithubSearchType,
  ): Promise<void> {
    searchLoading.value = true
    try {
      const result = await githubService.search(q, type)
      searchResults.value = result.items
      searchTotal.value = result.total_count ?? result.items.length
    } catch (error) {
      toastError(error, 'Unable to search GitHub')
      searchResults.value = []
      searchTotal.value = 0
    } finally {
      searchLoading.value = false
    }
  }

  async function toggleStar(owner: string, repo: string): Promise<boolean> {
    const current = repos.value.find(
      (item) => item.owner === owner && item.name === repo,
    )
    const starred =
      current?.starred ??
      (currentRepo.value?.owner === owner &&
      currentRepo.value?.name === repo
        ? currentRepo.value.starred
        : false)

    try {
      const result = await starMutation.mutateAsync({
        owner,
        repo,
        starred,
      })
      await reposQuery.refetch()
      if (
        currentRepo.value?.owner === owner &&
        currentRepo.value?.name === repo
      ) {
        currentRepo.value = {
          ...currentRepo.value,
          starred: result.starred,
        }
      }
      if (result.github_synced === false) {
        toast.add({
          severity: 'warn',
          summary: 'Saved in Nexus only',
          detail:
            'GitHub App blocked starring write. Check Account → Starring (read & write), revoke the app under GitHub → Settings → Applications → Authorized GitHub Apps, then reconnect.',
          life: 7000,
        })
      }
      return true
    } catch (error) {
      toastError(error, 'Unable to update star')
      return false
    }
  }

  async function createBranch(
    owner: string,
    repo: string,
    payload: GithubCreateBranchPayload,
  ): Promise<boolean> {
    try {
      await createBranchMutation.mutateAsync({ owner, repo, payload })
      toast.add({
        severity: 'success',
        summary: 'Branch created',
        detail: payload.name,
        life: 2500,
      })
      await loadBranches(owner, repo)
      return true
    } catch (error) {
      toastError(error, 'Unable to create branch')
      return false
    }
  }

  async function deleteBranch(
    owner: string,
    repo: string,
    branch: string,
  ): Promise<boolean> {
    try {
      await deleteBranchMutation.mutateAsync({ owner, repo, branch })
      toast.add({
        severity: 'success',
        summary: 'Branch deleted',
        detail: branch,
        life: 2500,
      })
      await loadBranches(owner, repo)
      return true
    } catch (error) {
      toastError(error, 'Unable to delete branch')
      return false
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

  async function markReady(
    owner: string,
    repo: string,
    number: number,
  ): Promise<boolean> {
    try {
      pullDetail.value = await markReadyMutation.mutateAsync({
        owner,
        repo,
        number,
      })
      toast.add({
        severity: 'success',
        summary: 'Ready for review',
        detail: `#${number} is no longer a draft`,
        life: 2500,
      })
      return true
    } catch (error) {
      toastError(error, 'Unable to mark ready for review')
      return false
    }
  }

  async function convertToDraft(
    owner: string,
    repo: string,
    number: number,
  ): Promise<boolean> {
    try {
      pullDetail.value = await convertDraftMutation.mutateAsync({
        owner,
        repo,
        number,
      })
      toast.add({
        severity: 'success',
        summary: 'Converted to draft',
        detail: `#${number} is now a draft`,
        life: 2500,
      })
      return true
    } catch (error) {
      toastError(error, 'Unable to convert to draft')
      return false
    }
  }

  async function submitReview(
    owner: string,
    repo: string,
    number: number,
    payload: GithubSubmitReviewPayload,
  ): Promise<boolean> {
    try {
      await submitReviewMutation.mutateAsync({
        owner,
        repo,
        number,
        payload,
      })
      toast.add({
        severity: 'success',
        summary: 'Review submitted',
        detail: payload.event.replace('_', ' ').toLowerCase(),
        life: 2500,
      })
      await loadPullDetail(owner, repo, number)
      return true
    } catch (error) {
      toastError(error, 'Unable to submit review')
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
    pullReviews,
    pullDetailLoading,
    compareResult,
    compareLoading,
    searchResults,
    searchTotal,
    searchLoading,
    currentRepo,
    pulse,
    pulseLoading,
    stats,
    statsLoading,
    loadHub,
    connect,
    disconnect,
    syncNow,
    handleOAuthReturn,
    loadInbox,
    loadPulse,
    loadStats,
    loadRepoPulls,
    loadCommits,
    loadBranches,
    loadCurrentRepo,
    loadPullDetail,
    loadCompare,
    search,
    toggleStar,
    createBranch,
    deleteBranch,
    createPull,
    mergePull,
    markReady,
    convertToDraft,
    submitReview,
  }
})
