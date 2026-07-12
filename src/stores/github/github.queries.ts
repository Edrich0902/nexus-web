import { defineQuery } from '@pinia/colada'
import * as githubService from '@services/github.service'

export const githubKeys = {
  all: ['github'] as const,
  status: ['github', 'status'] as const,
  profile: ['github', 'profile'] as const,
  repos: ['github', 'repos'] as const,
  repo: (owner: string, repo: string) =>
    ['github', 'repo', owner, repo] as const,
  branches: (owner: string, repo: string) =>
    ['github', 'branches', owner, repo] as const,
  commits: (owner: string, repo: string) =>
    ['github', 'commits', owner, repo] as const,
  inbox: (state: string) => ['github', 'inbox', state] as const,
  pulls: (owner: string, repo: string, state: string) =>
    ['github', 'pulls', owner, repo, state] as const,
  pull: (owner: string, repo: string, number: number) =>
    ['github', 'pull', owner, repo, number] as const,
  pullFiles: (owner: string, repo: string, number: number) =>
    ['github', 'pull-files', owner, repo, number] as const,
}

export const useGithubStatusQuery = defineQuery({
  key: githubKeys.status,
  query: () => githubService.getStatus(),
})

export const useGithubProfileQuery = defineQuery({
  key: githubKeys.profile,
  query: () => githubService.getProfile(),
  enabled: false,
})

export const useGithubReposQuery = defineQuery({
  key: githubKeys.repos,
  query: () => githubService.listRepos(),
  enabled: false,
})
