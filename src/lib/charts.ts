export type ChartCountItem = {
  label: string
  count: number
}

const PALETTE = [
  '#ace894',
  '#5ecf8a',
  '#1db954',
  '#3d5a6c',
  '#e6edf3',
  '#f6e8ea',
  '#7eb8da',
  '#c4b5fd',
  '#fbbf24',
  '#fb7185',
]

export function chartPalette(count: number): string[] {
  if (count <= 0) {
    return []
  }
  return Array.from({ length: count }, (_, i) => PALETTE[i % PALETTE.length])
}

export function toBarChartData(
  items: ChartCountItem[],
  datasetLabel = 'Count',
  color = '#ace894',
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
  color = '#ace894',
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
        backgroundColor: `${color}33`,
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
  color = '#ace894',
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
        backgroundColor: `${color}55`,
        borderWidth: 2,
        pointBackgroundColor: color,
        pointBorderColor: '#f6e8ea',
      },
    ],
  }
}

export function formatBucketLabel(bucket: string): string {
  return bucket.charAt(0).toUpperCase() + bucket.slice(1)
}
