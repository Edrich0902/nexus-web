export type GithubConnectionStatus = {
  connected: boolean
  provider: string
  status: string | null
  external_user_id: string | null
  scopes: string[]
  missing_scopes: string[]
  connected_at: string | null
  last_synced_at: string | null
  needs_reauth: boolean
}

export type GithubConnectResponse = {
  url: string
}

export type GithubSyncResponse = {
  message: string
}

export type GithubProfile = {
  id: string | null
  login: string | null
  name: string | null
  avatar_url: string | null
  html_url: string | null
  bio: string | null
  public_repos: number | null
  total_private_repos: number | null
  followers: number | null
  following: number | null
}

export type GithubRepo = {
  id: number
  owner: string
  name: string
  full_name: string
  private: boolean
  default_branch: string | null
  html_url: string | null
  description: string | null
  pushed_at: string | null
  language: string | null
}

export type GithubBranch = {
  name: string
  protected: boolean
}

export type GithubCommit = {
  sha: string | null
  message: string | null
  author_name: string | null
  author_date: string | null
  html_url: string | null
}

export type GithubPullUser = {
  login: string | null
  avatar_url: string | null
}

export type GithubPullRef = {
  ref: string | null
  sha: string | null
  label: string | null
}

export type GithubPullRequest = {
  id: number | null
  number: number | null
  title: string | null
  body: string | null
  state: string | null
  draft: boolean
  merged: boolean
  mergeable: boolean | null
  mergeable_state: string | null
  merged_at: string | null
  html_url: string | null
  created_at: string | null
  updated_at: string | null
  user: GithubPullUser
  head: GithubPullRef
  base: GithubPullRef
  additions: number | null
  deletions: number | null
  changed_files: number | null
  comments: number | null
  review_comments: number | null
  commits: number | null
}

export type GithubInboxPull = {
  id: number | null
  number: number | null
  title: string | null
  state: string | null
  draft: boolean
  html_url: string | null
  created_at: string | null
  updated_at: string | null
  user: GithubPullUser
  repository: {
    owner: string | null
    name: string | null
    full_name: string | null
  }
  pull_request: unknown
}

export type GithubPullFile = {
  sha: string | null
  filename: string | null
  status: string | null
  additions: number | null
  deletions: number | null
  changes: number | null
  patch: string | null
  blob_url: string | null
  raw_url: string | null
}

export type GithubCompareResult = {
  status: string | null
  ahead_by: number | null
  behind_by: number | null
  total_commits: number | null
  html_url: string | null
  files: GithubPullFile[]
}

export type GithubCreatePullPayload = {
  title: string
  head: string
  base: string
  body?: string | null
}

export type GithubMergePullPayload = {
  merge_method?: 'merge' | 'squash' | 'rebase'
  commit_title?: string | null
  commit_message?: string | null
}

export type GithubMergeResult = {
  sha: string | null
  merged: boolean
  message: string | null
}

export type GithubPaginated<T> = {
  items: T[]
  page: number
  per_page: number
  total_count?: number
}

export type GithubPullStateFilter = 'open' | 'closed' | 'merged' | 'all'
