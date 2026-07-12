import { defineMutation } from '@pinia/colada'
import * as githubService from '@services/github.service'
import type {
  GithubCreatePullPayload,
  GithubMergePullPayload,
} from '@/types/github/github'

export const useGithubDisconnectMutation = defineMutation({
  mutation: () => githubService.disconnect(),
})

export const useGithubSyncMutation = defineMutation({
  mutation: () => githubService.sync(),
})

export const useGithubCreatePullMutation = defineMutation({
  mutation: (vars: {
    owner: string
    repo: string
    payload: GithubCreatePullPayload
  }) => githubService.createPull(vars.owner, vars.repo, vars.payload),
})

export const useGithubMergePullMutation = defineMutation({
  mutation: (vars: {
    owner: string
    repo: string
    number: number
    payload?: GithubMergePullPayload
  }) =>
    githubService.mergePull(
      vars.owner,
      vars.repo,
      vars.number,
      vars.payload ?? {},
    ),
})
