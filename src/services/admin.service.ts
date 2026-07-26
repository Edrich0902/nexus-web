import http from '@lib/http'
import type {
  AdminFailedJob,
  AdminOverview,
  AdminPaginated,
  AdminPendingJob,
  AdminRecentJob,
} from '@/types/admin/admin'

const BASE = '/api/v1/admin'

export async function getOverview(): Promise<AdminOverview> {
  const { data } = await http.get<AdminOverview>(`${BASE}/overview`)
  return data
}

export async function getJobs(
  page = 1,
  queue?: string,
): Promise<AdminPaginated<AdminPendingJob>> {
  const { data } = await http.get<AdminPaginated<AdminPendingJob>>(
    `${BASE}/jobs`,
    { params: { page, per_page: 25, queue: queue || undefined } },
  )
  return data
}

export async function getFailedJobs(
  page = 1,
): Promise<AdminPaginated<AdminFailedJob>> {
  const { data } = await http.get<AdminPaginated<AdminFailedJob>>(
    `${BASE}/failed-jobs`,
    { params: { page, per_page: 25 } },
  )
  return data
}

export async function retryFailedJob(uuid: string): Promise<void> {
  await http.post(`${BASE}/failed-jobs/${uuid}/retry`)
}

export async function forgetFailedJob(uuid: string): Promise<void> {
  await http.delete(`${BASE}/failed-jobs/${uuid}`)
}

export async function getRecentJobs(): Promise<AdminRecentJob[]> {
  const { data } = await http.get<{ data: AdminRecentJob[] }>(
    `${BASE}/recent-jobs`,
  )
  return data.data
}
