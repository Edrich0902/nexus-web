import http from '@lib/http'
import type {
  F1Analysis,
  F1HomeSnapshot,
  F1MeetingSummary,
  F1ReplayPayload,
  F1ReplayStatus,
  F1Season,
  F1SessionDetail,
  F1Standings,
  F1Status,
  F1SyncResponse,
} from '@/types/f1/f1'

const BASE = '/api/v1/f1'

export async function getStatus(): Promise<F1Status> {
  const { data } = await http.get<F1Status>(`${BASE}/status`)
  return data
}

export async function sync(
  type = 'all',
  year?: number,
): Promise<F1SyncResponse> {
  const { data } = await http.post<F1SyncResponse>(`${BASE}/sync`, {
    type,
    year,
  })
  return data
}

export async function getHome(): Promise<F1HomeSnapshot> {
  const { data } = await http.get<F1HomeSnapshot>(`${BASE}/home`)
  return data
}

export async function getSeason(year?: number): Promise<F1Season> {
  const { data } = await http.get<F1Season>(`${BASE}/season`, {
    params: year ? { year } : undefined,
  })
  return data
}

export async function getStandings(year?: number): Promise<F1Standings> {
  const { data } = await http.get<F1Standings>(`${BASE}/standings`, {
    params: year ? { year } : undefined,
  })
  return data
}

export async function getMeeting(meetingKey: number): Promise<F1MeetingSummary> {
  const { data } = await http.get<F1MeetingSummary>(
    `${BASE}/meetings/${meetingKey}`,
  )
  return data
}

export async function getSession(sessionKey: number): Promise<F1SessionDetail> {
  const { data } = await http.get<F1SessionDetail>(
    `${BASE}/sessions/${sessionKey}`,
  )
  return data
}

export async function getAnalysis(sessionKey: number): Promise<F1Analysis> {
  const { data } = await http.get<F1Analysis>(
    `${BASE}/sessions/${sessionKey}/analysis`,
  )
  return data
}

export async function getReplay(
  sessionKey: number,
  driverNumber?: number,
): Promise<F1ReplayPayload> {
  const { data } = await http.get<F1ReplayPayload>(
    `${BASE}/sessions/${sessionKey}/replay`,
    {
      params:
        driverNumber != null ? { driver_number: driverNumber } : undefined,
    },
  )
  return data
}

export async function getReplayStatus(
  sessionKey: number,
): Promise<F1ReplayStatus> {
  const { data } = await http.get<F1ReplayStatus>(
    `${BASE}/sessions/${sessionKey}/replay/status`,
  )
  return data
}

export async function retryReplay(
  sessionKey: number,
): Promise<F1ReplayStatus> {
  const { data } = await http.post<F1ReplayStatus>(
    `${BASE}/sessions/${sessionKey}/replay/retry`,
  )
  return data
}
