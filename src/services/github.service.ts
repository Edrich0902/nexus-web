import http from '@lib/http'
import type {
  GithubBranch,
  GithubCommit,
  GithubCompareResult,
  GithubConnectResponse,
  GithubConnectionStatus,
  GithubCreatePullPayload,
  GithubInboxPull,
  GithubMergePullPayload,
  GithubMergeResult,
  GithubPaginated,
  GithubProfile,
  GithubPullFile,
  GithubPullRequest,
  GithubPullStateFilter,
  GithubRepo,
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

export async function listRepos(): Promise<GithubRepo[]> {
  const { data } = await http.get<GithubRepo[]>(`${BASE}/repos`)
  return data
}

export async function getRepo(owner: string, repo: string): Promise<GithubRepo> {
  const { data } = await http.get<GithubRepo>(`${BASE}/repos/${owner}/${repo}`)
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
