export interface DeviceSessionDevice {
  name: string
  ip_address: string | null
  user_agent: string | null
}

/** Active Sanctum token / device session from GET /auth/sessions */
export interface DeviceSession {
  id: number
  name: string
  device: DeviceSessionDevice
  remember: boolean
  last_used_at: string | null
  expires_at: string | null
  created_at: string | null
  is_current: boolean
}
