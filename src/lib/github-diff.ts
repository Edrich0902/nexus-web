export type DiffSideType = 'context' | 'add' | 'del' | 'empty'

export type DiffSideCell = {
  lineNumber: number | null
  text: string
  type: DiffSideType
}

export type DiffRow = {
  left: DiffSideCell
  right: DiffSideCell
}

export type DiffHunk = {
  header: string
  rows: DiffRow[]
}

/**
 * Parse a unified diff patch into side-by-side rows (GitHub-style pairing).
 */
export function parseUnifiedDiff(patch: string): DiffHunk[] {
  const lines = patch.replace(/\r\n/g, '\n').split('\n')
  const hunks: DiffHunk[] = []
  let current: DiffHunk | null = null
  let leftLine = 0
  let rightLine = 0
  let pendingDel: Array<{ lineNumber: number; text: string }> = []
  let pendingAdd: Array<{ lineNumber: number; text: string }> = []

  function flushPending(): void {
    if (!current) return
    const max = Math.max(pendingDel.length, pendingAdd.length)
    for (let i = 0; i < max; i++) {
      const del = pendingDel[i]
      const add = pendingAdd[i]
      current.rows.push({
        left: del
          ? { lineNumber: del.lineNumber, text: del.text, type: 'del' }
          : { lineNumber: null, text: '', type: 'empty' },
        right: add
          ? { lineNumber: add.lineNumber, text: add.text, type: 'add' }
          : { lineNumber: null, text: '', type: 'empty' },
      })
    }
    pendingDel = []
    pendingAdd = []
  }

  for (const raw of lines) {
    if (raw.startsWith('@@')) {
      flushPending()
      const match = /^@@\s+-(\d+)(?:,\d+)?\s+\+(\d+)(?:,\d+)?\s+@@/.exec(raw)
      leftLine = match ? Number(match[1]) : 0
      rightLine = match ? Number(match[2]) : 0
      current = { header: raw, rows: [] }
      hunks.push(current)
      continue
    }

    if (!current) continue

    if (raw.startsWith('\\')) {
      // "\ No newline at end of file"
      continue
    }

    const prefix = raw[0]
    const text = raw.slice(1)

    if (prefix === ' ') {
      flushPending()
      current.rows.push({
        left: { lineNumber: leftLine, text, type: 'context' },
        right: { lineNumber: rightLine, text, type: 'context' },
      })
      leftLine++
      rightLine++
      continue
    }

    if (prefix === '-') {
      pendingDel.push({ lineNumber: leftLine, text })
      leftLine++
      continue
    }

    if (prefix === '+') {
      pendingAdd.push({ lineNumber: rightLine, text })
      rightLine++
      continue
    }
  }

  flushPending()
  return hunks
}
