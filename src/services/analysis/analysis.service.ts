import http from '@lib/http'
import type { AnalysisQuota } from '@/types/analysis/drink-analysis'

export async function getAnalysisQuota(): Promise<AnalysisQuota> {
  const { data } = await http.get<AnalysisQuota>('/api/v1/analysis/quota')
  return data
}
