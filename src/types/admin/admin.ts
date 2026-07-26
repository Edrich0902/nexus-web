export type AdminProviderHealth = {
  available: boolean
  live_lockout: boolean
  reason?: string | null
  locked_until?: string | null
  last_checked_at?: string | null
}

export type AdminQueueSummary = {
  queue: string
  pending: number
  reserved: number
  delayed: number
}

export type AdminServerStats = {
  php_version: string
  laravel_env: string
  queue_connection: string
  memory: {
    php_usage_bytes: number
    php_peak_bytes: number
    php_limit: string | null
    source?: 'cgroup' | 'host' | 'php'
    system_total_bytes: number | null
    system_used_bytes?: number | null
    system_available_bytes: number | null
    system_used_percent: number | null
  }
  load: number[] | null
  cpu_percent: number | null
  disk: {
    path: string
    total_bytes: number | null
    free_bytes: number | null
    used_bytes?: number | null
    used_percent: number | null
  }
  uptime_seconds: number | null
  sampled_at: string
}

export type AdminOverview = {
  queues: AdminQueueSummary[]
  failed_job_count: number
  providers: {
    openf1?: AdminProviderHealth
  }
  server: AdminServerStats
  telescope_url: string
  sampled_at: string
}

export type AdminPendingJob = {
  id: number
  queue: string
  job_class: string
  attempts: number
  reserved_at: string | null
  available_at: string
  created_at: string
}

export type AdminFailedJob = {
  id: number
  uuid: string
  connection: string
  queue: string
  job_class: string
  exception_summary: string
  failed_at: string
}

export type AdminRecentJob = {
  uuid: string
  job_class: string
  queue: string | null
  status: string | null
  created_at: string
}

export type AdminPaginated<T> = {
  data: T[]
  current_page: number
  last_page: number
  per_page: number
  total: number
}
