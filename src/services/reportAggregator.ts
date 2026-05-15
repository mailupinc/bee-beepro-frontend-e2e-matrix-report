import { ImmutableCache } from '@/lib/cache'
import { getJson } from '@/lib/s3'
import type { MochawesomeReport, MochawesomeSuite, MochawesomeTest, ReportKey, TestRow } from '@/lib/types'
import { assignOwner } from './suiteOwnersService'

const reportCache = new ImmutableCache<MochawesomeReport>()

const fetchReport = (key: string): Promise<MochawesomeReport> =>
  reportCache.getOrLoad(key, () => getJson<MochawesomeReport>(key))

const normalizeFilePath = (filePath?: string): string =>
  (filePath ?? '').replace(/^cypress\/e2e\//, '')

type CellState = 'failed' | 'passed' | 'pending' | 'skipped'

type CellEntry = {
  state: CellState
  duration?: number
}

type TestAccumulator = {
  testName: string
  filePath: string
  owner: string
  cells: Map<string, CellEntry>
}

const walkSuite = (
  suite: MochawesomeSuite,
  reportKey: string,
  acc: Map<string, TestAccumulator>,
  parentTitle = '',
  parentFile = '',
): void => {
  const suiteTitle = suite.title ? (parentTitle ? `${parentTitle} > ${suite.title}` : suite.title) : parentTitle
  const suiteFile = suite.file || suite.fullFile || parentFile

  suite.tests?.forEach((test: MochawesomeTest) => {
    const fullName = suiteTitle ? `${suiteTitle} > ${test.title}` : test.title
    const filePath = normalizeFilePath(suiteFile)
    const dedupKey = `${filePath}::${fullName}`

    let entry = acc.get(dedupKey)
    if (!entry) {
      entry = {
        testName: fullName,
        filePath,
        owner: assignOwner(filePath),
        cells: new Map(),
      }
      acc.set(dedupKey, entry)
    }

    const state: CellState = test.state === 'failed' ? 'failed'
      : test.state === 'pending' ? 'pending'
        : test.state === 'skipped' ? 'skipped'
          : 'passed'
    const existing = entry.cells.get(reportKey)
    // Priority: failed > passed > skipped > pending (retries: if it passes after failing, failed wins)
    const priority: Record<CellState, number> = { failed: 3, passed: 2, skipped: 1, pending: 0 }
    if (!existing || priority[state] > priority[existing.state]) {
      entry.cells.set(reportKey, { state, duration: test.duration })
    } else if (existing && test.duration != null) {
      // Accumulate duration across retries
      existing.duration = (existing.duration ?? 0) + test.duration
    }
  })

  suite.suites?.forEach((nested) => walkSuite(nested, reportKey, acc, suiteTitle, suiteFile))
}

export type AggregateInput = {
  reports: ReportKey[]
}

export type ReportStats = {
  passes: number
  failures: number
  pending: number
  skipped: number
  tests: number
}

export type AggregateResult = {
  rows: TestRow[]
  reportStats: Map<string, ReportStats>
}

export const aggregateReports = async ({ reports }: AggregateInput): Promise<AggregateResult> => {
  const acc = new Map<string, TestAccumulator>()
  const reportStats = new Map<string, ReportStats>()

  const reportData = await Promise.all(
    reports.map(async (r) => ({ key: r.s3Key, data: await fetchReport(r.s3Key) })),
  )

  for (const { key, data } of reportData) {
    data.results?.forEach((root) => walkSuite(root, key, acc))
    reportStats.set(key, {
      passes: data.stats?.passes ?? 0,
      failures: data.stats?.failures ?? 0,
      pending: data.stats?.pending ?? 0,
      skipped: data.stats?.skipped ?? 0,
      tests: data.stats?.tests ?? 0,
    })
  }

  const orderedKeys = reports.map((r) => r.s3Key)

  const rows = Array.from(acc.values())
    .filter((entry) => entry.owner !== 'unknown')
    .map((entry) => {
      const cells = orderedKeys.map((k) => {
        const cellEntry = entry.cells.get(k)
        if (cellEntry === undefined) return null
        return { failed: cellEntry.state === 'failed', pending: cellEntry.state === 'pending', skipped: cellEntry.state === 'skipped', duration: cellEntry.duration }
      })
      const runs = cells.filter((c) => c !== null).length
      const failures = cells.filter((c) => c?.failed).length
      const pendings = cells.filter((c) => c?.pending).length
      const skips = cells.filter((c) => c?.skipped).length
      const unstableRate = runs > 0 ? Number((((failures + skips) / runs) * 100).toFixed(1)) : 0
      return {
        testName: entry.testName,
        filePath: entry.filePath,
        owner: entry.owner,
        cells,
        runs,
        failures,
        pendings,
        skips,
        unstableRate,
      }
    })

  return { rows, reportStats }
}
