import { defineMutation } from '@pinia/colada'
import * as githubService from '@services/github.service'
import type {
  GithubCreateBranchPayload,
  GithubCreatePullPayload,
  GithubMergePullPayload,
  GithubSubmitReviewPayload,
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

export const useGithubStarMutation = defineMutation({
  mutation: (vars: { owner: string; repo: string; starred: boolean }) =>
    vars.starred
      ? githubService.unstarRepo(vars.owner, vars.repo)
      : githubService.starRepo(vars.owner, vars.repo),
})

export const useGithubCreateBranchMutation = defineMutation({
  mutation: (vars: {
    owner: string
    repo: string
    payload: GithubCreateBranchPayload
  }) => githubService.createBranch(vars.owner, vars.repo, vars.payload),
})

export const useGithubDeleteBranchMutation = defineMutation({
  mutation: (vars: { owner: string; repo: string; branch: string }) =>
    githubService.deleteBranch(vars.owner, vars.repo, vars.branch),
})

export const useGithubMarkReadyMutation = defineMutation({
  mutation: (vars: { owner: string; repo: string; number: number }) =>
    githubService.markPullReady(vars.owner, vars.repo, vars.number),
})

export const useGithubConvertDraftMutation = defineMutation({
  mutation: (vars: { owner: string; repo: string; number: number }) =>
    githubService.convertPullToDraft(vars.owner, vars.repo, vars.number),
})

export const useGithubSubmitReviewMutation = defineMutation({
  mutation: (vars: {
    owner: string
    repo: string
    number: number
    payload: GithubSubmitReviewPayload
  }) =>
    githubService.submitPullReview(
      vars.owner,
      vars.repo,
      vars.number,
      vars.payload,
    ),
})
