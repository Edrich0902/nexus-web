import http from '@lib/http'
import type {
  GithubBranch,
  GithubCommit,
  GithubCompareResult,
  GithubConnectResponse,
  GithubConnectionStatus,
  GithubCreateBranchPayload,
  GithubCreatePullPayload,
  GithubInboxPull,
  GithubMergePullPayload,
  GithubMergeResult,
  GithubPaginated,
  GithubProfile,
  GithubPullFile,
  GithubPullRequest,
  GithubPullStateFilter,
  GithubPulse,
  GithubRepo,
  GithubReview,
  GithubSearchCodeHit,
  GithubSearchIssueHit,
  GithubSearchRepoHit,
  GithubSearchType,
  GithubStats,
  GithubSubmitReviewPayload,
  GithubSyncResponse,
} from '@/types/github/github'

const BASE = '/api/v1/github'

export async function getConnectUrl(): Promise<GithubConnectResponse> {
  const { data } = await http.get<GithubConnectResponse>(`${BASE}/connect`)
  return data
}

export async function getStatus(): Promise<GithubConnectionStatus> {
  const { data } = await http.get<GithubConnectionStatus>(`${BASE}/status`)
  return data
}

export async function disconnect(): Promise<void> {
  await http.post(`${BASE}/disconnect`)
}

export async function sync(): Promise<GithubSyncResponse> {
  const { data } = await http.post<GithubSyncResponse>(`${BASE}/sync`)
  return data
}

export async function getProfile(): Promise<GithubProfile> {
  const { data } = await http.get<GithubProfile>(`${BASE}/me`)
  return data
}

export async function getPulse(): Promise<GithubPulse> {
  const { data } = await http.get<GithubPulse>(`${BASE}/pulse`)
  return data
}

export async function getStats(refresh = false): Promise<GithubStats> {
  const { data } = await http.get<GithubStats>(`${BASE}/stats`, {
    params: refresh ? { refresh: 1 } : undefined,
  })
  return data
}

export async function listRepos(starredOnly = false): Promise<GithubRepo[]> {
  const { data } = await http.get<GithubRepo[]>(`${BASE}/repos`, {
    params: starredOnly ? { starred: '1' } : undefined,
  })
  return data
}

export async function getRepo(owner: string, repo: string): Promise<GithubRepo> {
  const { data } = await http.get<GithubRepo>(`${BASE}/repos/${owner}/${repo}`)
  return data
}

export async function starRepo(
  owner: string,
  repo: string,
): Promise<{ starred: boolean; github_synced: boolean }> {
  const { data } = await http.post<{ starred: boolean; github_synced: boolean }>(
    `${BASE}/repos/${owner}/${repo}/star`,
  )
  return data
}

export async function unstarRepo(
  owner: string,
  repo: string,
): Promise<{ starred: boolean; github_synced: boolean }> {
  const { data } = await http.delete<{ starred: boolean; github_synced: boolean }>(
    `${BASE}/repos/${owner}/${repo}/star`,
  )
  return data
}

export async function search(
  q: string,
  type: GithubSearchType,
  page = 1,
): Promise<
  GithubPaginated<
    GithubSearchRepoHit | GithubSearchIssueHit | GithubSearchCodeHit
  >
> {
  const { data } = await http.get<
    GithubPaginated<
      GithubSearchRepoHit | GithubSearchIssueHit | GithubSearchCodeHit
    >
  >(`${BASE}/search`, {
    params: { q, type, page, per_page: 20 },
  })
  return data
}

export async function listBranches(
  owner: string,
  repo: string,
): Promise<GithubPaginated<GithubBranch>> {
  const { data } = await http.get<GithubPaginated<GithubBranch>>(
    `${BASE}/repos/${owner}/${repo}/branches`,
  )
  return data
}

export async function createBranch(
  owner: string,
  repo: string,
  payload: GithubCreateBranchPayload,
): Promise<GithubBranch> {
  const { data } = await http.post<GithubBranch>(
    `${BASE}/repos/${owner}/${repo}/branches`,
    payload,
  )
  return data
}

export async function deleteBranch(
  owner: string,
  repo: string,
  branch: string,
): Promise<void> {
  await http.delete(
    `${BASE}/repos/${owner}/${repo}/branches/${encodeURIComponent(branch)}`,
  )
}

export async function listCommits(
  owner: string,
  repo: string,
  params: { page?: number; per_page?: number; sha?: string } = {},
): Promise<GithubPaginated<GithubCommit>> {
  const { data } = await http.get<GithubPaginated<GithubCommit>>(
    `${BASE}/repos/${owner}/${repo}/commits`,
    { params },
  )
  return data
}

export async function compareBranches(
  owner: string,
  repo: string,
  base: string,
  head: string,
): Promise<GithubCompareResult> {
  const { data } = await http.get<GithubCompareResult>(
    `${BASE}/repos/${owner}/${repo}/compare`,
    { params: { base, head } },
  )
  return data
}

export async function listInboxPulls(
  params: {
    state?: GithubPullStateFilter
    page?: number
    per_page?: number
  } = {},
): Promise<GithubPaginated<GithubInboxPull>> {
  const { data } = await http.get<GithubPaginated<GithubInboxPull>>(
    `${BASE}/pulls`,
    { params },
  )
  return data
}

export async function listRepoPulls(
  owner: string,
  repo: string,
  params: {
    state?: GithubPullStateFilter
    page?: number
    per_page?: number
  } = {},
): Promise<GithubPaginated<GithubPullRequest>> {
  const { data } = await http.get<GithubPaginated<GithubPullRequest>>(
    `${BASE}/repos/${owner}/${repo}/pulls`,
    { params },
  )
  return data
}

export async function getPull(
  owner: string,
  repo: string,
  number: number,
): Promise<GithubPullRequest> {
  const { data } = await http.get<GithubPullRequest>(
    `${BASE}/repos/${owner}/${repo}/pulls/${number}`,
  )
  return data
}

export async function listPullFiles(
  owner: string,
  repo: string,
  number: number,
): Promise<GithubPaginated<GithubPullFile>> {
  const { data } = await http.get<GithubPaginated<GithubPullFile>>(
    `${BASE}/repos/${owner}/${repo}/pulls/${number}/files`,
  )
  return data
}

export async function createPull(
  owner: string,
  repo: string,
  payload: GithubCreatePullPayload,
): Promise<GithubPullRequest> {
  const { data } = await http.post<GithubPullRequest>(
    `${BASE}/repos/${owner}/${repo}/pulls`,
    payload,
  )
  return data
}

export async function mergePull(
  owner: string,
  repo: string,
  number: number,
  payload: GithubMergePullPayload = {},
): Promise<GithubMergeResult> {
  const { data } = await http.put<GithubMergeResult>(
    `${BASE}/repos/${owner}/${repo}/pulls/${number}/merge`,
    payload,
  )
  return data
}

export async function markPullReady(
  owner: string,
  repo: string,
  number: number,
): Promise<GithubPullRequest> {
  const { data } = await http.post<GithubPullRequest>(
    `${BASE}/repos/${owner}/${repo}/pulls/${number}/ready`,
  )
  return data
}

export async function convertPullToDraft(
  owner: string,
  repo: string,
  number: number,
): Promise<GithubPullRequest> {
  const { data } = await http.post<GithubPullRequest>(
    `${BASE}/repos/${owner}/${repo}/pulls/${number}/draft`,
  )
  return data
}

export async function listPullReviews(
  owner: string,
  repo: string,
  number: number,
): Promise<GithubPaginated<GithubReview>> {
  const { data } = await http.get<GithubPaginated<GithubReview>>(
    `${BASE}/repos/${owner}/${repo}/pulls/${number}/reviews`,
  )
  return data
}

export async function submitPullReview(
  owner: string,
  repo: string,
  number: number,
  payload: GithubSubmitReviewPayload,
): Promise<GithubReview> {
  const { data } = await http.post<GithubReview>(
    `${BASE}/repos/${owner}/${repo}/pulls/${number}/reviews`,
    payload,
  )
  return data
}
