import { useAmbientStore } from '@design/ambient'
import { sections, type Ambient } from '@design/tokens'

export type ChartCountItem = {
  label: string
  count: number
}

/** Series colours: the section field palette, so charts read as colour fields. */
const SERIES = [
  sections.listening.field.bg,
  sections.beer.field.bg,
  sections.library.field.bg,
  sections.cellar.ambient.acc,
  sections.sports.ambient.acc,
  sections.spirits.field.bg,
  sections.kitchen.field.bg,
  sections.media.field.bg,
  sections.f1.ambient.acc,
  sections.code.field.bg,
]

/** Hex colour with alpha, e.g. alpha('#f6e8ea', 0.5). Non-hex values pass through. */
export function alpha(hex: string, a: number): string {
  const raw = hex.replace('#', '')
  if (!/^[0-9a-f]{6}$/i.test(raw)) return hex
  const n = parseInt(raw, 16)
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${a})`
}

function activeAmbient(): Ambient {
  return useAmbientStore().active
}

/** The current ambient accent, resolved to a hex value Chart.js can use. */
export function accentColor(): string {
  return activeAmbient().acc
}

/** Resolved chart chrome colours for an ambient palette. */
export function chartChrome(ambient: Ambient) {
  return {
    text: ambient.ink,
    muted: alpha(ambient.ink, 0.6),
    grid: alpha(ambient.ink, 0.07),
    border: alpha(ambient.ink, 0.12),
    tooltipBg: ambient.amb2,
  }
}

export function chartPalette(count: number): string[] {
  if (count <= 0) {
    return []
  }
  return Array.from({ length: count }, (_, i) => SERIES[i % SERIES.length]!)
}

export function toBarChartData(
  items: ChartCountItem[],
  datasetLabel = 'Count',
  color = accentColor(),
): {
  labels: string[]
  datasets: Array<{
    label: string
    data: number[]
    backgroundColor: string
    borderRadius: number
    maxBarThickness: number
  }>
} {
  return {
    labels: items.map((i) => i.label),
    datasets: [
      {
        label: datasetLabel,
        data: items.map((i) => i.count),
        backgroundColor: color,
        borderRadius: 6,
        maxBarThickness: 36,
      },
    ],
  }
}

export function toDoughnutChartData(
  items: ChartCountItem[],
  datasetLabel = 'Share',
): {
  labels: string[]
  datasets: Array<{
    label: string
    data: number[]
    backgroundColor: string[]
    borderWidth: number
  }>
} {
  return {
    labels: items.map((i) => i.label),
    datasets: [
      {
        label: datasetLabel,
        data: items.map((i) => i.count),
        backgroundColor: chartPalette(items.length),
        borderWidth: 0,
      },
    ],
  }
}

export function toLineChartData(
  items: ChartCountItem[],
  datasetLabel = 'Count',
  color = accentColor(),
): {
  labels: string[]
  datasets: Array<{
    label: string
    data: number[]
    borderColor: string
    backgroundColor: string
    fill: boolean
    tension: number
    pointRadius: number
  }>
} {
  return {
    labels: items.map((i) => i.label),
    datasets: [
      {
        label: datasetLabel,
        data: items.map((i) => i.count),
        borderColor: color,
        backgroundColor: alpha(color, 0.2),
        fill: true,
        tension: 0.35,
        pointRadius: 0,
      },
    ],
  }
}

export function toRadarChartData(
  items: ChartCountItem[],
  datasetLabel = 'Metrics',
  color = accentColor(),
): {
  labels: string[]
  datasets: Array<{
    label: string
    data: number[]
    borderColor: string
    backgroundColor: string
    borderWidth: number
    pointBackgroundColor: string
    pointBorderColor: string
  }>
} {
  return {
    labels: items.map((i) => i.label),
    datasets: [
      {
        label: datasetLabel,
        data: items.map((i) => i.count),
        borderColor: color,
        backgroundColor: alpha(color, 0.33),
        borderWidth: 2,
        pointBackgroundColor: color,
        pointBorderColor: activeAmbient().ink,
      },
    ],
  }
}

export function formatBucketLabel(bucket: string): string {
  return bucket.charAt(0).toUpperCase() + bucket.slice(1)
}
