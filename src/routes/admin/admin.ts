import type { AdminServerStats } from '@/types/admin/admin'

export function formatBytes(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value)) return '—'
  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  let n = value
  let i = 0
  while (n >= 1024 && i < units.length - 1) {
    n /= 1024
    i++
  }
  return `${n.toFixed(i === 0 ? 0 : 1)} ${units[i]}`
}

export function formatUptime(seconds: number | null | undefined): string {
  if (seconds == null) return '—'
  const d = Math.floor(seconds / 86400)
  const h = Math.floor((seconds % 86400) / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  if (d > 0) return `${d}d ${h}h`
  return `${h}h ${m}m`
}

export function memoryUsed(server: AdminServerStats | null): number | null {
  const mem = server?.memory
  if (!mem) return null
  if (mem.system_used_bytes != null) return mem.system_used_bytes
  if (mem.system_total_bytes != null && mem.system_available_bytes != null) {
    return Math.max(0, mem.system_total_bytes - mem.system_available_bytes)
  }
  return mem.php_usage_bytes ?? null
}

export function diskUsed(server: AdminServerStats | null): number | null {
  const disk = server?.disk
  if (!disk) return null
  if (disk.used_bytes != null) return disk.used_bytes
  if (disk.total_bytes != null && disk.free_bytes != null) return Math.max(0, disk.total_bytes - disk.free_bytes)
  return null
}

export function shortClass(name: string): string {
  return name.split('\\').pop() || name
}

export function statusTone(status: string | null | undefined): 'neutral' | 'info' | 'success' | 'warn' | 'danger' {
  const s = (status ?? '').toLowerCase()
  if (s === 'processed' || s === 'success' || s === 'ok') return 'success'
  if (s === 'failed' || s === 'failure') return 'danger'
  if (s === 'pending' || s === 'queued' || s === 'released') return 'warn'
  if (s === 'processing' || s === 'reserved') return 'info'
  return 'neutral'
}

/** 0–1 from a 0–100 percentage, or null when unknown. */
export function share(percent: number | null | undefined): number | null {
  return percent == null || Number.isNaN(percent) ? null : Math.min(1, Math.max(0, percent / 100))
}
